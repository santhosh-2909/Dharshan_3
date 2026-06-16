"""Crowd service — ties the webcam and YOLO services together.

Runs a background inference loop that samples the latest frame, counts people
with YOLO, and caches the result (count, density, annotated JPEG). API endpoints
then read the cache *instantly*, decoupling request latency from inference and
giving thread-safe access. The service also bridges to the existing
footfall-forecast model to produce a live-vs-predicted occupancy comparison.
"""

from __future__ import annotations

import logging
import threading
import time
from datetime import date, datetime, timedelta
from typing import List, Optional, Tuple

# How often (seconds) to persist the cumulative count to the CCTV history.
PERSIST_INTERVAL_SECONDS = 10

from sqlalchemy.orm import Session

from .vision_config import get_vision_settings
from .webcam_service import WebcamService
from .yolo_service import Detection, YoloService

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Pure classification rules (Feature 4 + Feature 5)
# ---------------------------------------------------------------------------
def classify_density(count: int) -> str:
    """Map a raw people count to a density band."""
    if count <= 10:
        return "LOW"
    if count <= 30:
        return "MEDIUM"
    if count <= 60:
        return "HIGH"
    return "VERY_HIGH"


def classify_occupancy(current: int, predicted: int) -> Tuple[str, float]:
    """Compare the live count against the day's predicted footfall.

    Returns ``(status, occupancy_pct)``. When no prediction is available the
    ratio is undefined, so we report ``UNKNOWN``.
    """
    if predicted <= 0:
        return "UNKNOWN", 0.0
    ratio = current / predicted
    if ratio < 0.5:
        status = "NORMAL"
    elif ratio < 0.8:
        status = "BUSY"
    elif ratio <= 1.0:
        status = "CROWDED"
    else:
        status = "OVERCAPACITY"
    return status, round(ratio * 100, 1)


class CrowdService:
    """Background people-counter with a thread-safe result cache."""

    def __init__(self) -> None:
        self._settings = get_vision_settings()
        self._webcam = WebcamService()
        self._yolo = YoloService.instance()

        # Cached results, guarded by ``_lock``.
        self._lock = threading.Lock()
        self._count = 0                 # people currently in frame
        self._in_frame = 0              # alias of _count, kept for clarity
        self._total = 0                 # cumulative unique people counted today
        self._seen_ids: set[int] = set()  # track ids counted this session
        self._base_total = 0            # carried over from earlier today (restart-safe)
        self._count_date: Optional[date] = None
        self._boxes: List[Detection] = []
        self._annotated_jpeg: Optional[bytes] = None
        self._last_update: Optional[datetime] = None

        # Inference thread control.
        self._stop = threading.Event()
        self._thread: Optional[threading.Thread] = None
        self._started = False
        self._start_lock = threading.Lock()
        self._last_persist = 0.0

    # ---- state ------------------------------------------------------------
    @property
    def is_running(self) -> bool:
        return self._thread is not None and self._thread.is_alive()

    # ---- lifecycle --------------------------------------------------------
    def ensure_started(self) -> None:
        """Lazily warm up YOLO, open the camera and start the inference loop.

        Idempotent and thread-safe. Raises ``RuntimeError`` if the model cannot
        be loaded (e.g. vision extras missing); the camera itself fails softly
        and the loop will keep retrying to (re)connect.
        """
        if self._started and self.is_running:
            return
        with self._start_lock:
            if self._started and self.is_running:
                return
            self._yolo.warmup()          # may raise RuntimeError if deps missing
            self._restore_today_total()  # continue today's running count across restarts
            self._webcam.start()
            self._stop.clear()
            self._thread = threading.Thread(
                target=self._loop, name="crowd-inference", daemon=True
            )
            self._thread.start()
            self._started = True
            logger.info("Crowd inference loop started.")

    def _restore_today_total(self) -> None:
        """Seed the cumulative count from today's highest stored value."""
        from sqlalchemy import func

        from ..db import SessionLocal
        from ..models import CCTVCount

        db = SessionLocal()
        try:
            start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            highest = (
                db.query(func.max(CCTVCount.people_count))
                .filter(CCTVCount.recorded_at >= start, CCTVCount.camera_id == "webcam-yolo")
                .scalar()
            )
            with self._lock:
                self._base_total = int(highest or 0)
                self._total = self._base_total
                self._seen_ids = set()
                self._count_date = date.today()
        except Exception as exc:
            logger.warning("Could not restore today's count: %s", exc)
        finally:
            db.close()

    def shutdown(self) -> None:
        """Stop inference and release the camera. Safe if never started."""
        if not self._started:
            return
        logger.info("Shutting down crowd service ...")
        self._stop.set()
        if self._thread is not None:
            self._thread.join(timeout=5.0)
        self._thread = None
        self._webcam.stop()
        self._started = False

    # ---- background inference loop ---------------------------------------
    def _loop(self) -> None:
        frame_index = 0
        skip = max(1, self._settings.frame_skip)
        while not self._stop.is_set():
            frame = self._webcam.read_latest()
            if frame is None:
                # Camera not ready yet — wait briefly and retry.
                self._stop.wait(0.1)
                continue

            frame_index += 1
            if frame_index % skip != 0:        # frame skipping (Feature 13)
                self._stop.wait(self._settings.inference_interval)
                continue

            try:
                # Track (not just detect) so each person keeps an identity and
                # we can tally UNIQUE people over time — a cumulative footfall.
                detections = self._yolo.track_persons(frame)
            except Exception as exc:           # tracking must never kill loop
                logger.exception("Tracking error: %s", exc)
                self._stop.wait(self._settings.inference_interval)
                continue

            ids = [d.track_id for d in detections if d.track_id is not None]
            today = date.today()
            with self._lock:
                if self._count_date != today:   # new day → reset the running tally
                    self._count_date = today
                    self._seen_ids = set()
                    self._base_total = 0
                self._seen_ids.update(ids)
                self._total = self._base_total + len(self._seen_ids)
                self._in_frame = len(detections)
                self._count = self._in_frame
                self._boxes = detections
                total_now = self._total

            annotated = self._annotate(frame, detections, total_now)
            with self._lock:
                self._annotated_jpeg = annotated
                self._last_update = datetime.now()

            # Persist the cumulative count so the dashboard / prediction page
            # show the rising footfall (and it survives a restart).
            monotonic = time.monotonic()
            if monotonic - self._last_persist >= PERSIST_INTERVAL_SECONDS:
                self._persist_count(total_now)
                self._last_persist = monotonic

            self._stop.wait(self._settings.inference_interval)

    def _persist_count(self, total: int) -> None:
        """Store the cumulative count under camera id 'webcam-yolo'."""
        from ..db import SessionLocal
        from ..models import CCTVCount

        db = SessionLocal()
        try:
            db.add(CCTVCount(camera_id="webcam-yolo", people_count=total, recorded_at=datetime.now()))
            db.commit()
        except Exception as exc:  # never let persistence kill the loop
            logger.warning("Failed to persist count: %s", exc)
            db.rollback()
        finally:
            db.close()

    def _annotate(self, frame, detections: List[Detection], total: int) -> Optional[bytes]:
        """Draw tracked boxes + the cumulative and in-frame counts as JPEG."""
        try:
            import cv2
        except ImportError:
            return None
        img = frame.copy()
        for d in detections:
            cv2.rectangle(img, (d.x1, d.y1), (d.x2, d.y2), (0, 200, 0), 2)
            tag = f"#{d.track_id}" if d.track_id is not None else f"{d.confidence:.0%}"
            cv2.putText(
                img, tag, (d.x1, max(12, d.y1 - 6)),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 200, 0), 1, cv2.LINE_AA,
            )
        label = f"Counted today: {total}   In frame: {len(detections)}"
        cv2.rectangle(img, (0, 0), (440, 42), (0, 0, 0), -1)
        cv2.putText(
            img, label, (10, 28), cv2.FONT_HERSHEY_SIMPLEX,
            0.7, (255, 255, 255), 2, cv2.LINE_AA,
        )
        ok, buffer = cv2.imencode(".jpg", img)
        return buffer.tobytes() if ok else None

    # ---- read APIs --------------------------------------------------------
    def get_live(self) -> dict:
        """Cumulative people counted today + people currently in frame."""
        self.ensure_started()
        with self._lock:
            total = self._total
            in_frame = self._in_frame
            ts = self._last_update or datetime.now()
        return {
            "people_count": total,          # cumulative footfall today (rising)
            "in_frame": in_frame,           # people visible right now
            "density": classify_density(in_frame),
            "timestamp": ts.isoformat(timespec="seconds"),
        }

    def get_annotated_jpeg(self) -> Optional[bytes]:
        """Most recent annotated frame as JPEG bytes (for the MJPEG stream)."""
        self.ensure_started()
        with self._lock:
            return self._annotated_jpeg

    def get_status(self, db: Session) -> dict:
        """Live count vs. the day's forecast → occupancy status (Feature 5)."""
        self.ensure_started()
        with self._lock:
            current = self._count
            ts = self._last_update or datetime.now()
        predicted = self._predict_today(db)
        status, occupancy_pct = classify_occupancy(current, predicted)
        return {
            "current_count": current,
            "predicted_count": predicted,
            "expected_remaining": max(0, predicted - current),
            "occupancy_pct": occupancy_pct,
            "occupancy_status": status,
            "density": classify_density(current),
            "timestamp": ts.isoformat(timespec="seconds"),
        }

    def _predict_today(self, db: Session) -> int:
        """Today's forecast, reusing the existing model's pure helpers.

        This calls the *same* seasonal-trend logic that powers
        ``POST /api/v1/predict`` (importing its module-level helpers), but skips
        that endpoint's deliberate ~2.4s "thinking" delay so ``/status`` stays
        snappy when polled. Swap the forecast model in one place and both paths
        follow.
        """
        # Imported lazily to avoid any import-ordering coupling between the
        # services layer and the routers layer.
        from ..models import FootfallHistory
        from ..routers.prediction import (
            _seasonal_factors,
            _weighted_baseline,
            _yearly_trend,
        )

        today = date.today()
        cutoff = today - timedelta(days=365 * 5 + 30)
        history = (
            db.query(FootfallHistory)
            .filter(FootfallHistory.occurred_on >= cutoff)
            .all()
        )
        if not history:
            return 0

        prev_year_rows = [
            r for r in history
            if r.occurred_on.month == today.month and r.occurred_on.day == today.day
        ]
        weighted = _weighted_baseline(prev_year_rows)
        weekday_f, month_f, festival_factor_global = _seasonal_factors(history)
        yearly_baseline = _yearly_trend(history, today.year)
        seasonal = weekday_f.get(today.weekday(), 1.0) * month_f.get(today.month, 1.0)

        is_festival = any(r.is_festival for r in prev_year_rows)
        festival_factor = festival_factor_global if is_festival else 1.0

        if len(history) >= 200 and yearly_baseline > 0:
            value = yearly_baseline * seasonal * festival_factor
        else:
            value = weighted * (festival_factor if is_festival else 1.0)
        return max(0, int(round(value)))


# ---------------------------------------------------------------------------
# Process-wide singleton accessor
# ---------------------------------------------------------------------------
_service: Optional[CrowdService] = None
_service_lock = threading.Lock()


def get_crowd_service() -> CrowdService:
    """Return the shared :class:`CrowdService` (created on first use)."""
    global _service
    if _service is None:
        with _service_lock:
            if _service is None:
                _service = CrowdService()
    return _service
