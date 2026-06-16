"""YOLOv8 person-detection service.

Wraps Ultralytics YOLO behind a thread-safe singleton so the (expensive) model
weights load exactly once for the whole process. Ultralytics and its torch
dependency are imported *lazily* inside the loader, so importing this module
never drags the heavy CV stack into the core API process — important for cloud
deployments where the vision extras are not installed.
"""

from __future__ import annotations

import logging
import threading
from dataclasses import dataclass
from typing import TYPE_CHECKING, List

from .vision_config import get_vision_settings

if TYPE_CHECKING:  # pragma: no cover - hints only, no runtime numpy dependency
    import numpy as np

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class Detection:
    """A single detected person bounding box (pixel coords) + confidence.

    ``track_id`` is set when the detection comes from the tracker (used to
    count unique people over time); it is ``None`` for plain detection.
    """

    x1: int
    y1: int
    x2: int
    y2: int
    confidence: float
    track_id: int | None = None


class YoloService:
    """Process-wide singleton that loads YOLO once and detects persons."""

    _instance: "YoloService | None" = None
    _singleton_lock = threading.Lock()

    def __init__(self) -> None:
        self._model = None
        self._model_lock = threading.Lock()
        self._settings = get_vision_settings()

    # ---- singleton access -------------------------------------------------
    @classmethod
    def instance(cls) -> "YoloService":
        """Return the shared instance, creating it on first use (thread-safe)."""
        if cls._instance is None:
            with cls._singleton_lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    # ---- model lifecycle --------------------------------------------------
    def _ensure_model(self):
        """Load the model on first use (double-checked locking)."""
        if self._model is not None:
            return self._model
        with self._model_lock:
            if self._model is None:
                try:
                    from ultralytics import YOLO  # lazy: heavy import
                except ImportError as exc:
                    raise RuntimeError(
                        "ultralytics is not installed. Install the vision extras: "
                        "pip install -r requirements-vision.txt"
                    ) from exc
                logger.info("Loading YOLO model '%s' ...", self._settings.yolo_model)
                self._model = YOLO(self._settings.yolo_model)
                logger.info("YOLO model '%s' loaded.", self._settings.yolo_model)
        return self._model

    def warmup(self) -> None:
        """Eagerly load the model (e.g. before opening the camera)."""
        self._ensure_model()

    # ---- detection --------------------------------------------------------
    def detect_persons(self, frame: "np.ndarray") -> List[Detection]:
        """Run YOLO on a BGR frame and return only ``person`` detections."""
        model = self._ensure_model()
        # ``classes=[0]`` restricts inference to the person class; ``verbose``
        # is silenced so we don't flood logs every frame.
        results = model.predict(
            source=frame,
            conf=self._settings.confidence_threshold,
            classes=[self._settings.person_class_id],
            verbose=False,
        )

        detections: List[Detection] = []
        if not results:
            return detections

        boxes = results[0].boxes
        if boxes is None:
            return detections

        for box in boxes:
            x1, y1, x2, y2 = (int(v) for v in box.xyxy[0].tolist())
            confidence = float(box.conf[0]) if box.conf is not None else 0.0
            detections.append(Detection(x1, y1, x2, y2, confidence))
        return detections

    def track_persons(self, frame: "np.ndarray") -> List[Detection]:
        """Detect + track persons across frames, returning per-person track ids.

        Uses Ultralytics' built-in tracker with ``persist=True`` so identities
        are maintained between successive frames. This must be called
        sequentially from a single thread (the inference loop does exactly
        that), since the tracker keeps state on the model instance. Counting
        unique track ids over time yields a cumulative footfall count.
        """
        model = self._ensure_model()
        results = model.track(
            source=frame,
            persist=True,
            conf=self._settings.confidence_threshold,
            classes=[self._settings.person_class_id],
            verbose=False,
        )

        detections: List[Detection] = []
        if not results:
            return detections
        boxes = results[0].boxes
        if boxes is None:
            return detections

        ids = boxes.id
        id_list = ids.int().tolist() if ids is not None else [None] * len(boxes)
        for box, track_id in zip(boxes, id_list):
            x1, y1, x2, y2 = (int(v) for v in box.xyxy[0].tolist())
            confidence = float(box.conf[0]) if box.conf is not None else 0.0
            detections.append(Detection(x1, y1, x2, y2, confidence, track_id))
        return detections
