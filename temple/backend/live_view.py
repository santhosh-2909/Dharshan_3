"""Standalone live webcam viewer with YOLOv8 person detection (Feature 2).

Run this locally to open the annotated OpenCV video window with bounding boxes
and a live "People Count" overlay. Press ``q`` to quit.

    cd temple/backend
    python live_view.py

NOTE: only one process can own the webcam at a time. Stop the API server (or use
its ``POST /api/crowd/camera/stop``) before running this, otherwise the camera
will be busy. This script reuses the same singleton ``YoloService`` and
``VisionSettings`` as the API, so ``CAMERA_SOURCE`` / ``YOLO_MODEL`` /
``CONFIDENCE_THRESHOLD`` from your ``.env`` apply here too.
"""

from __future__ import annotations

import logging

import cv2

from app.services.crowd_service import classify_density
from app.services.vision_config import get_vision_settings
from app.services.yolo_service import YoloService
from app.utils.logging_config import configure_logging


def main() -> None:
    configure_logging()
    log = logging.getLogger("live_view")
    settings = get_vision_settings()

    # Load YOLO once, then open the camera.
    yolo = YoloService.instance()
    yolo.warmup()

    cap = cv2.VideoCapture(settings.resolved_source)
    if not cap.isOpened():
        log.error("Could not open camera source %s", settings.camera_source)
        return

    log.info("Camera started. Press 'q' in the video window to quit.")
    try:
        while True:
            ok, frame = cap.read()
            if not ok or frame is None:
                log.warning("Failed to read frame from camera.")
                break

            detections = yolo.detect_persons(frame)
            for d in detections:
                cv2.rectangle(frame, (d.x1, d.y1), (d.x2, d.y2), (0, 200, 0), 2)
                cv2.putText(
                    frame, f"{d.confidence:.0%}", (d.x1, max(12, d.y1 - 6)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 200, 0), 1, cv2.LINE_AA,
                )

            count = len(detections)
            overlay = f"People Count: {count}  ({classify_density(count)})"
            cv2.rectangle(frame, (0, 0), (430, 42), (0, 0, 0), -1)
            cv2.putText(
                frame, overlay, (10, 30), cv2.FONT_HERSHEY_SIMPLEX,
                0.8, (255, 255, 255), 2, cv2.LINE_AA,
            )

            cv2.imshow("Aalayam - Live Crowd Detection", frame)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break
    finally:
        cap.release()
        cv2.destroyAllWindows()
        log.info("Camera stopped.")


if __name__ == "__main__":
    main()
