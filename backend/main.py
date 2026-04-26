"""SmartDarshan crowd analytics application."""

from __future__ import annotations

import io
import os
import re
import csv
from collections import defaultdict
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta
from functools import lru_cache
from pathlib import Path
from statistics import mean
from typing import Any
from zipfile import ZipFile
import heapq

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image, ImageFilter, ImageStat


PROJECT_ROOT = Path(__file__).resolve().parent.parent
FRONTEND_DIR = PROJECT_ROOT / "frontend"
TIMESTAMP_PATTERN = re.compile(r"(\d{8})_(\d{2})_(\d{2})_(\d{2})")
WEEKDAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
SURGE_MULTIPLIER = 1.5


def _resolve_dataset_zip() -> Path | None:
    candidates = [
        os.getenv("SMARTDARSHAN_DATASET_ZIP"),
        str(PROJECT_ROOT / "data" / "archive(1).zip"),
        str(PROJECT_ROOT / "data" / "archive.zip"),
        str(PROJECT_ROOT / "Dharshan" / "data" / "archive(1).zip"),
        "/Users/santhosh/Downloads/archive(1).zip",
    ]
    for candidate in candidates:
        if not candidate:
            continue
        path = Path(candidate).expanduser()
        if path.exists():
            return path
    return None


def _resolve_reference_zip() -> Path | None:
    candidates = [
        os.getenv("SMARTDARSHAN_REFERENCE_ZIP"),
        str(PROJECT_ROOT / "data" / "Footfall 2.zip"),
        str(PROJECT_ROOT / "Dharshan" / "data" / "Footfall 2.zip"),
        "/Users/santhosh/Documents/untitled folder/Footfall 2.zip",
        "/Users/santhosh/Downloads/Footfall 2.zip",
    ]
    for candidate in candidates:
        if not candidate:
            continue
        path = Path(candidate).expanduser()
        if path.exists():
            return path
    return None


def _resolve_attendance_csv() -> Path | None:
    candidates = [
        os.getenv("SMARTDARSHAN_ATTENDANCE_CSV"),
        str(PROJECT_ROOT / "data" / "event_attendance.csv"),
        "/Users/santhosh/Downloads/event_attendance.csv",
    ]
    for candidate in candidates:
        if not candidate:
            continue
        path = Path(candidate).expanduser()
        if path.exists():
            return path
    return None


def _resolve_traffic_csv() -> Path | None:
    candidates = [
        os.getenv("SMARTDARSHAN_TRAFFIC_CSV"),
        str(PROJECT_ROOT / "data" / "traffic.csv"),
        "/Users/santhosh/Downloads/traffic.csv",
    ]
    for candidate in candidates:
        if not candidate:
            continue
        path = Path(candidate).expanduser()
        if path.exists():
            return path
    return None


def _clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, value))


def _density_label(score: float) -> str:
    if score >= 72:
        return "Very High"
    if score >= 55:
        return "High"
    if score >= 38:
        return "Moderate"
    return "Low"


def _round(value: float) -> float:
    return round(float(value), 2)


@dataclass
class DatasetSummary:
    dataset_path: str
    total_images: int
    start_date: str
    end_date: str
    average_score: float
    peak_score: float
    peak_hour: int
    busiest_day: str


class CrowdDatasetService:
    """Reads the ZIP dataset and builds dashboard-ready analytics."""

    def __init__(self) -> None:
        self.dataset_zip = _resolve_dataset_zip()
        self.reference_zip = _resolve_reference_zip()
        self.attendance_csv = _resolve_attendance_csv()
        self.traffic_csv = _resolve_traffic_csv()
        self._records: list[dict[str, Any]] | None = None
        self._summary: DatasetSummary | None = None
        self._footfall_tables: dict[str, list[dict[str, Any]]] | None = None
        self._attendance_summary: dict[str, Any] | None = None
        self._traffic_summary: dict[str, Any] | None = None

    def _require_zip(self) -> Path:
        if not self.dataset_zip:
            raise FileNotFoundError(
                "Dataset ZIP not found. Set SMARTDARSHAN_DATASET_ZIP or place archive(1).zip in data/."
            )
        return self.dataset_zip

    def _parse_timestamp(self, name: str) -> datetime:
        match = TIMESTAMP_PATTERN.search(Path(name).name)
        if not match:
            raise ValueError(f"Could not parse timestamp from {name}")
        date_part, hour, minute, second = match.groups()
        return datetime.strptime(f"{date_part}{hour}{minute}{second}", "%Y%m%d%H%M%S")

    def _score_image(self, image_bytes: bytes) -> dict[str, float | int]:
        with Image.open(io.BytesIO(image_bytes)) as image:
            rgb = image.convert("RGB")
            gray = image.convert("L")
            width, height = rgb.size

            preview = gray.resize((192, 192))
            edge_map = preview.filter(ImageFilter.FIND_EDGES)

            gray_stat = ImageStat.Stat(preview)
            edge_stat = ImageStat.Stat(edge_map)

            brightness = (gray_stat.mean[0] / 255.0) * 100.0
            contrast = (gray_stat.stddev[0] / 128.0) * 100.0
            edge_strength = (edge_stat.mean[0] / 255.0) * 100.0

            histogram = preview.histogram()
            total_pixels = float(sum(histogram)) or 1.0
            dark_pixels = sum(histogram[:89])
            dark_ratio = (dark_pixels / total_pixels) * 100.0

            crowd_score = (
                0.48 * edge_strength
                + 0.34 * contrast
                + 0.12 * dark_ratio
                + 0.06 * (100.0 - abs(brightness - 54.0))
            )
            crowd_score = _clamp(crowd_score)

            return {
                "width": width,
                "height": height,
                "edge_strength": _round(edge_strength),
                "contrast": _round(contrast),
                "brightness": _round(brightness),
                "crowd_score": _round(crowd_score),
            }

    def load(self) -> list[dict[str, Any]]:
        if self._records is not None:
            return self._records

        dataset_zip = self._require_zip()
        rows: list[dict[str, Any]] = []
        with ZipFile(dataset_zip) as archive:
            image_names = [
                name for name in archive.namelist() if name.lower().endswith((".jpg", ".jpeg", ".png"))
            ]
            for index, name in enumerate(sorted(image_names), start=1):
                image_bytes = archive.read(name)
                shot_at = self._parse_timestamp(name)
                image_info = self._score_image(image_bytes)
                crowd_score = float(image_info["crowd_score"])

                rows.append(
                    {
                        "id": index,
                        "zip_path": name,
                        "filename": Path(name).name,
                        "shot_at": shot_at,
                        "date": shot_at.date().isoformat(),
                        "hour": shot_at.hour,
                        "weekday": shot_at.strftime("%A"),
                        "month": shot_at.strftime("%b"),
                        "crowd_score": crowd_score,
                        "crowd_label": _density_label(crowd_score),
                        "estimated_people_index": int(round(crowd_score * 2.4)),
                        **image_info,
                    }
                )

        rows.sort(key=lambda item: item["shot_at"])
        if not rows:
            raise ValueError("The dataset ZIP does not contain any supported images.")

        by_hour: dict[int, list[float]] = defaultdict(list)
        by_date: dict[str, list[float]] = defaultdict(list)
        for row in rows:
            by_hour[int(row["hour"])].append(float(row["crowd_score"]))
            by_date[str(row["date"])].append(float(row["crowd_score"]))

        peak_hour = max(by_hour, key=lambda hour: mean(by_hour[hour]))
        busiest_day = max(by_date, key=lambda date: mean(by_date[date]))

        self._summary = DatasetSummary(
            dataset_path=str(dataset_zip),
            total_images=len(rows),
            start_date=str(rows[0]["date"]),
            end_date=str(rows[-1]["date"]),
            average_score=_round(mean(float(row["crowd_score"]) for row in rows)),
            peak_score=_round(max(float(row["crowd_score"]) for row in rows)),
            peak_hour=int(peak_hour),
            busiest_day=str(busiest_day),
        )
        self._records = rows
        return rows

    def summary(self) -> DatasetSummary:
        if self._summary is None:
            self.load()
        assert self._summary is not None
        return self._summary

    def _read_csv_from_zip(self, archive: ZipFile, member: str) -> list[dict[str, str]]:
        with archive.open(member) as handle:
            text = io.TextIOWrapper(handle, encoding="utf-8")
            return list(csv.DictReader((line for line in text if not line.startswith("#"))))

    def load_footfall_tables(self) -> dict[str, list[dict[str, Any]]]:
        if self._footfall_tables is not None:
            return self._footfall_tables

        tables = {"history": [], "forecast_21d": [], "forecast_hourly": []}
        if not self.reference_zip:
            self._footfall_tables = tables
            return tables

        with ZipFile(self.reference_zip) as archive:
            members = set(archive.namelist())
            mapping = {
                "history": "Footfall/data/historical_footfall.csv",
                "forecast_21d": "Footfall/predictions_21d.csv",
                "forecast_hourly": "Footfall/predictions_hourly.csv",
            }
            for key, member in mapping.items():
                if member not in members:
                    continue
                rows = self._read_csv_from_zip(archive, member)
                parsed: list[dict[str, Any]] = []
                for row in rows:
                    item = dict(row)
                    if "date" in item and item["date"]:
                        item["date"] = item["date"]
                    for num_key in [
                        "footfall",
                        "is_festival",
                        "hour",
                        "pred_p10",
                        "pred_p50",
                        "pred_p90",
                    ]:
                        if num_key in item and item[num_key] not in {"", None}:
                            value = float(item[num_key])
                            item[num_key] = int(value) if num_key in {"is_festival", "hour"} else value
                    parsed.append(item)
                tables[key] = parsed

        self._footfall_tables = tables
        return tables

    def temple_options(self) -> list[str]:
        tables = self.load_footfall_tables()
        temples = sorted({str(row.get("temple_id")) for row in tables["history"] if row.get("temple_id")})
        return temples or ["All_India_Sites"]

    def load_attendance_summary(self) -> dict[str, Any]:
        if self._attendance_summary is not None:
            return self._attendance_summary

        empty = {
            "source_path": str(self.attendance_csv) if self.attendance_csv else None,
            "total_attendees": 0,
            "unique_events": 0,
            "busiest_event": None,
            "top_events": [],
            "time_slots": [],
            "recent_attendees": [],
            "daily_registrations": [],
        }
        if not self.attendance_csv:
            self._attendance_summary = empty
            return empty

        event_map: dict[str, dict[str, Any]] = {}
        date_counts: dict[str, int] = defaultdict(int)
        hour_counts: dict[int, int] = defaultdict(int)
        recent_heap: list[tuple[str, int, dict[str, str]]] = []
        total_attendees = 0

        with self.attendance_csv.open(newline="", encoding="utf-8") as handle:
            reader = csv.DictReader(handle)
            for index, row in enumerate(reader):
                total_attendees += 1
                event_id = str(row.get("event_id", ""))
                date_text = str(row.get("date_time", ""))
                try:
                    event_dt = datetime.strptime(date_text, "%Y-%m-%d %H:%M")
                except ValueError:
                    continue

                entry = event_map.setdefault(
                    event_id,
                    {
                        "event_id": event_id,
                        "event_name": str(row.get("event_name", "Untitled event")),
                        "location": str(row.get("location", "Unknown location")),
                        "date_time": date_text,
                        "attendees": 0,
                    },
                )
                entry["attendees"] += 1
                date_counts[event_dt.date().isoformat()] += 1
                hour_counts[event_dt.hour] += 1

                attendee = {
                    "event_id": event_id,
                    "event_name": str(row.get("event_name", "Untitled event")),
                    "date_time": date_text,
                    "attendee_name": str(row.get("attendee_name", "Visitor")),
                    "attendee_email": str(row.get("attendee_email", "")),
                    "attendee_phone_number": str(row.get("attendee_phone_number", "")),
                }
                heapq.heappush(recent_heap, (event_dt.isoformat(), index, attendee))
                if len(recent_heap) > 8:
                    heapq.heappop(recent_heap)

        top_events = sorted(event_map.values(), key=lambda item: (-int(item["attendees"]), str(item["date_time"])))[:6]
        time_slots = []
        slot_ranges = [(6, 8), (8, 10), (10, 12), (12, 14), (16, 18), (18, 20)]
        for start, end in slot_ranges:
            booked = sum(count for hour, count in hour_counts.items() if start <= int(hour) < end)
            time_slots.append(
                {
                    "label": f"{start:02d}:00 - {end:02d}:00",
                    "booked": booked,
                    "capacity": max(booked + 20, 120),
                }
            )

        daily_registrations = [
            {"date": date, "registrations": count}
            for date, count in sorted(date_counts.items())[-14:]
        ]
        recent_attendees = [item[2] for item in sorted(recent_heap, key=lambda pair: (pair[0], pair[1]), reverse=True)]
        busiest_event = top_events[0] if top_events else None

        self._attendance_summary = {
            "source_path": str(self.attendance_csv),
            "total_attendees": total_attendees,
            "unique_events": len(event_map),
            "busiest_event": busiest_event,
            "top_events": top_events,
            "time_slots": time_slots,
            "recent_attendees": recent_attendees,
            "daily_registrations": daily_registrations,
        }
        return self._attendance_summary

    def load_traffic_summary(self) -> dict[str, Any]:
        if self._traffic_summary is not None:
            return self._traffic_summary

        empty = {
            "source_path": str(self.traffic_csv) if self.traffic_csv else None,
            "total_vehicles": 0,
            "peak_hour": None,
            "peak_hour_volume": 0,
            "busiest_junction": None,
            "junctions": [],
            "daily_trend": [],
        }
        if not self.traffic_csv:
            self._traffic_summary = empty
            return empty

        junction_totals: dict[str, int] = defaultdict(int)
        hour_totals: dict[int, int] = defaultdict(int)
        day_totals: dict[str, int] = defaultdict(int)
        peak_row: dict[str, Any] | None = None
        total_vehicles = 0

        with self.traffic_csv.open(newline="", encoding="utf-8") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                try:
                    dt = datetime.strptime(str(row.get("DateTime", "")), "%Y-%m-%d %H:%M:%S")
                    vehicles = int(float(str(row.get("Vehicles", "0"))))
                except ValueError:
                    continue
                junction = f"Junction {row.get('Junction', '0')}"
                total_vehicles += vehicles
                junction_totals[junction] += vehicles
                hour_totals[dt.hour] += vehicles
                day_totals[dt.date().isoformat()] += vehicles
                if peak_row is None or vehicles > int(peak_row["vehicles"]):
                    peak_row = {"date_time": dt.isoformat(), "junction": junction, "vehicles": vehicles}

        junctions = []
        zone_names = ["Zone A", "Zone B", "Zone C", "Zone D", "Zone E"]
        for index, (junction, vehicles) in enumerate(sorted(junction_totals.items(), key=lambda item: -item[1])[:5]):
            capacity = max(int(vehicles * 1.08), vehicles + 2000)
            junctions.append(
                {
                    "zone": zone_names[index],
                    "junction": junction,
                    "vehicles": vehicles,
                    "capacity": capacity,
                    "available": max(0, capacity - vehicles),
                }
            )

        peak_hour = max(hour_totals, key=hour_totals.get) if hour_totals else None
        busiest_junction = max(junction_totals, key=junction_totals.get) if junction_totals else None
        daily_trend = [{"date": date, "vehicles": count} for date, count in sorted(day_totals.items())[-14:]]

        self._traffic_summary = {
            "source_path": str(self.traffic_csv),
            "total_vehicles": total_vehicles,
            "peak_hour": peak_hour,
            "peak_hour_volume": int(hour_totals.get(peak_hour, 0)) if peak_hour is not None else 0,
            "busiest_junction": busiest_junction,
            "peak_row": peak_row,
            "junctions": junctions,
            "daily_trend": daily_trend,
        }
        return self._traffic_summary

    def build_live_monitor(self) -> dict[str, Any]:
        records = self.load()
        recent = records[-24:]
        latest = recent[-1]
        chart = [
            {
                "time": row["shot_at"].strftime("%d %b %H:%M"),
                "crowd_score": _round(float(row["crowd_score"])),
                "people_index": int(row["estimated_people_index"]),
                "image_id": int(row["id"]),
            }
            for row in recent
        ]
        recent_scores = [float(row["estimated_people_index"]) for row in recent[-10:]]
        return {
            "latest_image_id": int(latest["id"]),
            "latest_people_index": int(latest["estimated_people_index"]),
            "latest_score": _round(float(latest["crowd_score"])),
            "rolling_average": _round(mean(recent_scores)) if recent_scores else 0.0,
            "session_peak": max(int(row["estimated_people_index"]) for row in recent),
            "series": chart,
        }

    def footfall_view(self, temple_id: str | None = None, days: int = 7) -> dict[str, Any]:
        tables = self.load_footfall_tables()
        records = self.load()
        summary = self.summary()
        temples = self.temple_options()
        selected = temple_id if temple_id in temples else temples[0]

        history = [row for row in tables["history"] if row.get("temple_id") == selected]
        forecast = [row for row in tables["forecast_21d"] if row.get("temple_id") == selected]
        hourly = [row for row in tables["forecast_hourly"] if row.get("temple_id") == selected]

        history.sort(key=lambda row: str(row["date"]))
        forecast.sort(key=lambda row: str(row["date"]))
        hourly.sort(key=lambda row: (str(row["date"]), int(row.get("hour", 0))))

        last_60 = history[-60:]
        baseline_values = [float(row["footfall"]) for row in history[-30:]] if history else []
        baseline = mean(baseline_values) if baseline_values else mean(float(row["pred_p50"]) for row in forecast) if forecast else 0.0
        surge_days = [row for row in forecast if float(row["pred_p50"]) > SURGE_MULTIPLIER * baseline] if baseline else []

        forecast_cards = []
        for row in forecast[:21]:
            forecast_cards.append(
                {
                    "date": str(row["date"]),
                    "pred_p10": _round(float(row["pred_p10"])),
                    "pred_p50": _round(float(row["pred_p50"])),
                    "pred_p90": _round(float(row["pred_p90"])),
                    "is_surge": bool(baseline and float(row["pred_p50"]) > SURGE_MULTIPLIER * baseline),
                }
            )

        hourly_dates = []
        for row in hourly:
            date = str(row["date"])
            if date not in hourly_dates:
                hourly_dates.append(date)
        selected_dates = hourly_dates[: max(1, min(days, len(hourly_dates)))]
        hourly_subset = [row for row in hourly if str(row["date"]) in selected_dates]

        by_day: dict[str, list[dict[str, Any]]] = defaultdict(list)
        for row in hourly_subset:
            by_day[str(row["date"])].append(row)

        heatmap = []
        for date in selected_dates:
            day_rows = sorted(by_day[date], key=lambda row: int(row["hour"]))
            values = []
            for hour in range(24):
                match = next((row for row in day_rows if int(row["hour"]) == hour), None)
                values.append(_round(float(match["pred_p50"])) if match else 0.0)
            heatmap.append({"date": date, "label": datetime.strptime(date, "%Y-%m-%d").strftime("%a %d-%b"), "values": values})

        tomorrow_profile = []
        if selected_dates:
            first_day = sorted(by_day[selected_dates[0]], key=lambda row: int(row["hour"]))
            for row in first_day:
                tomorrow_profile.append(
                    {
                        "hour": int(row["hour"]),
                        "pred_p10": _round(float(row["pred_p10"])),
                        "pred_p50": _round(float(row["pred_p50"])),
                        "pred_p90": _round(float(row["pred_p90"])),
                    }
                )

        peak_hour = None
        peak_row = None
        if tomorrow_profile:
            peak_row = max(tomorrow_profile, key=lambda row: row["pred_p50"])
            peak_hour = peak_row["hour"]

        current_daily_index_map: dict[str, int] = defaultdict(int)
        current_weekday_index_map: dict[str, list[int]] = defaultdict(list)
        for row in records:
            current_daily_index_map[str(row["date"])] += int(row["estimated_people_index"])
            current_weekday_index_map[str(row["weekday"])].append(int(row["estimated_people_index"]))

        historical_weekday_map: dict[str, list[float]] = defaultdict(list)
        for row in history:
            try:
                weekday = datetime.strptime(str(row["date"]), "%Y-%m-%d").strftime("%A")
            except ValueError:
                continue
            historical_weekday_map[weekday].append(float(row["footfall"]))

        current_daily_values = list(current_daily_index_map.values())
        historical_daily_values = [float(row["footfall"]) for row in history]
        current_avg_daily_index = mean(current_daily_values) if current_daily_values else 0.0
        historical_avg_daily_visits = mean(historical_daily_values) if historical_daily_values else 0.0
        ratio_to_historical = (
            current_avg_daily_index / historical_avg_daily_visits if historical_avg_daily_visits else 0.0
        )
        weekday_comparison = []
        for weekday in WEEKDAY_ORDER:
            current_value = mean(current_weekday_index_map[weekday]) if current_weekday_index_map[weekday] else 0.0
            historical_value = mean(historical_weekday_map[weekday]) if historical_weekday_map[weekday] else 0.0
            weekday_comparison.append(
                {
                    "weekday": weekday,
                    "current_index": _round(current_value),
                    "historical_visits": _round(historical_value),
                    "delta_percent": _round(
                        ((current_value / historical_value) - 1.0) * 100.0 if historical_value else 0.0
                    ),
                }
            )

        current_peak_day = max(current_daily_index_map, key=current_daily_index_map.get) if current_daily_index_map else None
        historical_peak_day = max(history, key=lambda row: float(row["footfall"]))["date"] if history else None

        return {
            "temples": temples,
            "selected_temple": selected,
            "history_last_60": [
                {"date": str(row["date"]), "footfall": float(row["footfall"]), "is_festival": int(row.get("is_festival", 0))}
                for row in last_60
            ],
            "forecast_21d": forecast_cards,
            "forecast_summary": {
                "baseline": _round(baseline),
                "peak_p50": _round(max((float(row["pred_p50"]) for row in forecast), default=0.0)),
                "peak_p90": _round(max((float(row["pred_p90"]) for row in forecast), default=0.0)),
                "surge_days": len(surge_days),
                "first_surge_date": str(surge_days[0]["date"]) if surge_days else None,
                "surge_threshold": _round(SURGE_MULTIPLIER * baseline) if baseline else 0.0,
            },
            "hourly_forecast": {
                "days_shown": len(selected_dates),
                "heatmap": heatmap,
                "tomorrow_profile": tomorrow_profile,
                "peak_hour": peak_hour,
                "peak_value": _round(peak_row["pred_p50"]) if peak_row else 0.0,
                "tomorrow_total": _round(sum(row["pred_p50"] for row in tomorrow_profile)),
            },
            "comparison": {
                "dataset_window": {"start": summary.start_date, "end": summary.end_date},
                "historical_window": {
                    "start": str(history[0]["date"]) if history else None,
                    "end": str(history[-1]["date"]) if history else None,
                },
                "current_avg_daily_index": _round(current_avg_daily_index),
                "historical_avg_daily_visits": _round(historical_avg_daily_visits),
                "ratio_to_historical": _round(ratio_to_historical),
                "current_peak_daily_index": _round(max(current_daily_values, default=0.0)),
                "historical_peak_daily_visits": _round(max(historical_daily_values, default=0.0)),
                "current_peak_hour": int(summary.peak_hour),
                "historical_peak_day": str(historical_peak_day) if historical_peak_day else None,
                "current_peak_day": str(current_peak_day) if current_peak_day else None,
                "weekday_comparison": weekday_comparison,
                "insight": (
                    f"The archive dataset spans {summary.start_date} to {summary.end_date} with an average "
                    f"daily people index of {_round(current_avg_daily_index)}. Historical records for "
                    f"{selected.replace('_', ' ')} average {_round(historical_avg_daily_visits)} daily visits."
                ),
                "note": (
                    "Current archive values are image-derived people index estimates, while historical values "
                    "come from the reference footfall dataset."
                ),
            },
        }

    def overview(self, temple_id: str | None = None, days: int = 7) -> dict[str, Any]:
        records = self.load()
        summary = self.summary()
        attendance = self.load_attendance_summary()
        traffic = self.load_traffic_summary()

        daily_map: dict[str, dict[str, Any]] = defaultdict(
            lambda: {"scores": [], "estimated_people_index": 0, "frame_count": 0}
        )
        hourly_map: dict[str, dict[int, list[float]]] = defaultdict(lambda: defaultdict(list))
        for row in records:
            date_bucket = daily_map[str(row["date"])]
            date_bucket["scores"].append(float(row["crowd_score"]))
            date_bucket["estimated_people_index"] += int(row["estimated_people_index"])
            date_bucket["frame_count"] += 1
            hourly_map[str(row["weekday"])][int(row["hour"])].append(float(row["crowd_score"]))

        timeline = []
        for date in sorted(daily_map):
            bucket = daily_map[date]
            scores = bucket["scores"]
            timeline.append(
                {
                    "date": date,
                    "avg_score": _round(mean(scores)),
                    "peak_score": _round(max(scores)),
                    "estimated_people_index": int(bucket["estimated_people_index"]),
                    "frame_count": int(bucket["frame_count"]),
                }
            )

        heatmap = []
        for weekday in WEEKDAY_ORDER:
            row_values = []
            for hour in range(24):
                scores = hourly_map[weekday].get(hour, [])
                row_values.append(_round(mean(scores)) if scores else 0.0)
            heatmap.append({"weekday": weekday, "values": row_values})

        top_frames = []
        for row in sorted(records, key=lambda item: (-float(item["crowd_score"]), item["shot_at"]))[:12]:
            top_frames.append(
                {
                    "id": int(row["id"]),
                    "filename": str(row["filename"]),
                    "date": str(row["date"]),
                    "hour": int(row["hour"]),
                    "crowd_score": _round(float(row["crowd_score"])),
                    "crowd_label": str(row["crowd_label"]),
                    "estimated_people_index": int(row["estimated_people_index"]),
                    "width": int(row["width"]),
                    "height": int(row["height"]),
                }
            )

        return {
            "summary": asdict(summary),
            "live_monitor": self.build_live_monitor(),
            "timeline": timeline,
            "hourly_heatmap": heatmap,
            "top_frames": top_frames,
            "forecast": self.forecast(days=7),
            "footfall": self.footfall_view(temple_id=temple_id, days=days),
            "attendance": attendance,
            "traffic": traffic,
        }

    def forecast(self, days: int = 7) -> list[dict[str, Any]]:
        records = self.load()
        by_date: dict[str, list[float]] = defaultdict(list)
        by_weekday: dict[str, list[float]] = defaultdict(list)
        by_hour: dict[int, list[float]] = defaultdict(list)

        for row in records:
            score = float(row["crowd_score"])
            by_date[str(row["date"])].append(score)
            by_weekday[str(row["weekday"])].append(score)
            by_hour[int(row["hour"])].append(score)

        daily_scores = []
        for date in sorted(by_date):
            daily_scores.append((datetime.strptime(date, "%Y-%m-%d"), mean(by_date[date])))

        baseline = mean(score for _, score in daily_scores)
        recent_scores = [score for _, score in daily_scores[-10:]]
        recent_factor = (mean(recent_scores) / baseline) if baseline else 1.0
        peak_hour = max(by_hour, key=lambda hour: mean(by_hour[hour]))

        start = daily_scores[-1][0] + timedelta(days=1)
        predictions = []
        for offset in range(days):
            current = start + timedelta(days=offset)
            weekday = current.strftime("%A")
            weekday_score = mean(by_weekday[weekday]) if by_weekday[weekday] else baseline
            predicted_score = _round(weekday_score * recent_factor)
            predictions.append(
                {
                    "date": current.date().isoformat(),
                    "weekday": weekday,
                    "predicted_score": predicted_score,
                    "predicted_people_index": int(round(predicted_score * 2.5)),
                    "risk": _density_label(predicted_score),
                    "peak_hour": int(peak_hour),
                }
            )
        return predictions

    def list_images(self, limit: int = 24, sort_by: str = "crowd_score") -> list[dict[str, Any]]:
        records = self.load()
        if sort_by == "shot_at":
            ordered = sorted(records, key=lambda item: item["shot_at"])[:limit]
        else:
            ordered = sorted(records, key=lambda item: float(item["crowd_score"]), reverse=True)[:limit]

        items = []
        for row in ordered:
            items.append(
                {
                    "id": int(row["id"]),
                    "filename": str(row["filename"]),
                    "date": str(row["date"]),
                    "hour": int(row["hour"]),
                    "weekday": str(row["weekday"]),
                    "crowd_score": _round(float(row["crowd_score"])),
                    "crowd_label": str(row["crowd_label"]),
                    "estimated_people_index": int(row["estimated_people_index"]),
                    "width": int(row["width"]),
                    "height": int(row["height"]),
                }
            )
        return items

    def image_bytes(self, image_id: int) -> tuple[bytes, str]:
        records = self.load()
        match = next((row for row in records if int(row["id"]) == image_id), None)
        if match is None:
            raise KeyError(image_id)

        dataset_zip = self._require_zip()
        with ZipFile(dataset_zip) as archive:
            image_bytes = archive.read(str(match["zip_path"]))

        suffix = Path(str(match["zip_path"])).suffix.lower()
        media_type = "image/png" if suffix == ".png" else "image/jpeg"
        return image_bytes, media_type


@lru_cache
def get_service() -> CrowdDatasetService:
    return CrowdDatasetService()


app = FastAPI(
    title="SmartDarshan Crowd Analytics",
    description="Crowd monitoring and footfall-style insights built from the provided archive(1).zip dataset.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if FRONTEND_DIR.exists():
    app.mount("/app", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")


@app.get("/")
async def root() -> RedirectResponse:
    return RedirectResponse(url="/app")


@app.get("/health")
async def health() -> dict[str, Any]:
    service = get_service()
    try:
        summary = service.summary()
        return {
            "status": "ok",
            "dataset_loaded": True,
            "dataset_path": summary.dataset_path,
            "images": summary.total_images,
        }
    except Exception as exc:  # pragma: no cover
        return {"status": "degraded", "dataset_loaded": False, "detail": str(exc)}


@app.get("/api/v1/dashboard")
async def dashboard(
    temple_id: str | None = Query(default=None),
    days: int = Query(default=7, ge=1, le=21),
) -> dict[str, Any]:
    try:
        return get_service().overview(temple_id=temple_id, days=days)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/v1/images")
async def images(
    limit: int = Query(default=24, ge=1, le=60),
    sort_by: str = Query(default="crowd_score"),
) -> dict[str, Any]:
    try:
        return {"items": get_service().list_images(limit=limit, sort_by=sort_by)}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/v1/images/{image_id}")
async def image_file(image_id: int) -> StreamingResponse:
    try:
        image_bytes, media_type = get_service().image_bytes(image_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Image not found") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return StreamingResponse(io.BytesIO(image_bytes), media_type=media_type)
