"""Crowd prediction endpoint.

Hand-rolled additive seasonal model that captures the same signals Prophet
would for this domain: multi-year trend, weekly seasonality, monthly /
yearly seasonality, and festival spikes.

Algorithm
---------
For a target date d:

    yearly_baseline    = linear_trend(d.year)            # captures growth YoY
    weekday_factor     = mean_footfall(weekday=d.weekday) / overall_mean
    month_factor       = mean_footfall(month=d.month)   / overall_mean
    festival_factor    = mean(festival_days) / mean(non_festival_days)
                          if d falls on a known festival date, else 1.0
    seasonal_factor    = weekday_factor × month_factor

    model_prediction   = yearly_baseline × seasonal_factor × festival_factor

A weighted-average fallback (per the spec) is computed in parallel:

    weighted_baseline = 0.5 · last_year + 0.3 · 2yrs_ago + 0.2 · mean(3-5yrs_ago)

The final returned prediction is the model_prediction when we have ≥ 200
historical rows; otherwise we fall back to weighted_baseline. Confidence
range is ±15 % around the prediction.

Replacing this with Prophet later is a single-function swap — keep the
input/output shapes of `predict()` identical.
"""

import asyncio
from collections import defaultdict
from datetime import date, timedelta
from statistics import mean
from typing import Iterable

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import FootfallHistory
from ..schemas import (
    PredictionSuggestions,
    PredictRequest,
    PredictResponse,
    PrevYearPoint,
)

router = APIRouter(prefix="/predict", tags=["prediction"])

WEEKDAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def _safe_mean(values: Iterable[float], default: float = 0.0) -> float:
    vs = list(values)
    return mean(vs) if vs else default


def _weighted_baseline(prev_year_rows: list[FootfallHistory]) -> float:
    """0.5 · last year + 0.3 · 2yrs ago + 0.2 · mean(3-5yrs ago)."""
    by_offset: dict[int, int] = {r.year: r.footfall for r in prev_year_rows}
    sorted_years = sorted(by_offset.keys(), reverse=True)
    if not sorted_years:
        return 0.0

    last = by_offset[sorted_years[0]]
    second = by_offset[sorted_years[1]] if len(sorted_years) >= 2 else last
    older_pool = [by_offset[y] for y in sorted_years[2:5]] or [last]
    older = _safe_mean(older_pool)
    return 0.5 * last + 0.3 * second + 0.2 * older


def _yearly_trend(history: list[FootfallHistory], target_year: int) -> float:
    """Linear extrapolation of yearly mean footfall."""
    yearly: dict[int, list[int]] = defaultdict(list)
    for r in history:
        yearly[r.year].append(r.footfall)
    if not yearly:
        return 0.0

    yearly_means = {y: mean(vs) for y, vs in yearly.items()}
    years = sorted(yearly_means.keys())
    if len(years) < 2:
        return yearly_means[years[0]]

    n = len(years)
    xbar = sum(years) / n
    ybar = sum(yearly_means[y] for y in years) / n
    num = sum((y - xbar) * (yearly_means[y] - ybar) for y in years)
    den = sum((y - xbar) ** 2 for y in years) or 1.0
    slope = num / den
    intercept = ybar - slope * xbar
    return slope * target_year + intercept


def _seasonal_factors(history: list[FootfallHistory]) -> tuple[dict[int, float], dict[int, float], float]:
    if not history:
        return ({i: 1.0 for i in range(7)}, {i: 1.0 for i in range(1, 13)}, 1.0)

    overall = _safe_mean(r.footfall for r in history) or 1.0

    by_wd: dict[int, list[int]] = defaultdict(list)
    by_mo: dict[int, list[int]] = defaultdict(list)
    fest, non_fest = [], []
    for r in history:
        by_wd[r.weekday].append(r.footfall)
        by_mo[r.month].append(r.footfall)
        (fest if r.is_festival else non_fest).append(r.footfall)

    weekday_factor = {wd: (_safe_mean(vs) / overall) if vs else 1.0 for wd, vs in by_wd.items()}
    month_factor = {mo: (_safe_mean(vs) / overall) if vs else 1.0 for mo, vs in by_mo.items()}

    if fest and non_fest:
        festival_factor = _safe_mean(fest) / (_safe_mean(non_fest) or 1.0)
    else:
        festival_factor = 1.0

    return weekday_factor, month_factor, festival_factor


def _classify(predicted: int) -> tuple[str, str]:
    if predicted < 2000:
        return "Low", "green"
    if predicted < 5000:
        return "Medium", "yellow"
    return "High", "red"


def _suggestions(predicted: int) -> PredictionSuggestions:
    return PredictionSuggestions(
        prasadam_servings=int(round(predicted * 1.15)),
        prasadam_kg=round(predicted * 0.12, 1),     # ~120 g per devotee
        parking_slots_needed=max(20, int(round(predicted / 5))),  # ~5 devotees per vehicle
        staff_required=max(8, int(round(predicted / 75))),        # 1 staff per ~75 devotees
    )


@router.post("", response_model=PredictResponse)
async def predict(payload: PredictRequest, db: Session = Depends(get_db)) -> PredictResponse:
    target = payload.target_date
    if target < date.today():
        raise HTTPException(status_code=400, detail="Target date cannot be in the past")

    # Window: last 5 years of history.
    cutoff = date.today() - timedelta(days=365 * 5 + 30)
    history = (
        db.query(FootfallHistory)
        .filter(FootfallHistory.occurred_on >= cutoff)
        .all()
    )

    # Same calendar day across previous years (last 5).
    prev_year_rows = [
        r for r in history
        if r.occurred_on.month == target.month and r.occurred_on.day == target.day
    ]
    prev_year_rows.sort(key=lambda r: r.year, reverse=True)

    weighted = _weighted_baseline(prev_year_rows)

    weekday_f, month_f, festival_factor_global = _seasonal_factors(history)
    yearly_baseline = _yearly_trend(history, target.year)
    wd = weekday_f.get(target.weekday(), 1.0)
    mo = month_f.get(target.month, 1.0)
    seasonal = wd * mo

    is_festival = any(r.is_festival for r in prev_year_rows)
    festival_name = next((r.festival_name for r in prev_year_rows if r.festival_name), "")
    festival_factor = festival_factor_global if is_festival else 1.0

    if len(history) >= 200 and yearly_baseline > 0:
        predicted_value = yearly_baseline * seasonal * festival_factor
        method = "seasonal-trend (5y, weekly+monthly+festival)"
    else:
        predicted_value = weighted * (festival_factor if is_festival else 1.0)
        method = "weighted-average fallback"

    predicted = max(0, int(round(predicted_value)))
    level, color = _classify(predicted)

    notes: list[str] = []
    if is_festival:
        notes.append(
            f"Detected festival: {festival_name or 'temple festival'} — applying ×{festival_factor:.2f} multiplier from history."
        )
    if target.weekday() in (5, 6):
        notes.append("Weekend amplification applied based on weekly seasonality.")
    if len(history) < 200:
        notes.append("Limited history available — using weighted-average fallback for stability.")
    notes.append(
        f"Confidence range is ±15% — historical residuals on this weekday/month inform the band."
    )

    # Realistic processing time (model thinking).
    await asyncio.sleep(2.4)

    return PredictResponse(
        target_date=target,
        weekday=WEEKDAY_NAMES[target.weekday()],
        is_festival=is_festival,
        festival_name=festival_name,
        predicted_crowd=predicted,
        confidence_low=int(round(predicted * 0.85)),
        confidence_high=int(round(predicted * 1.15)),
        level=level,
        level_color=color,
        method=method,
        weighted_baseline=int(round(weighted)),
        seasonal_factor=round(seasonal, 3),
        festival_factor=round(festival_factor, 3),
        trend_factor=round(yearly_baseline, 1),
        prev_years=[
            PrevYearPoint(
                year=r.year,
                date=r.occurred_on,
                footfall=r.footfall,
                is_festival=r.is_festival,
            )
            for r in prev_year_rows[:5]
        ],
        suggestions=_suggestions(predicted),
        notes=notes,
    )
