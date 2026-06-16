"""Thread-safe webcam capture service.

A dedicated background daemon thread continuously grabs frames from the camera
and keeps only the *most recent* one. Inference/API code reads that latest frame
without blocking the capture loop, and a lost camera is transparently
reconnected with a backoff delay. OpenCV is imported lazily so the core API does
not require it to be installed.
"""

from __future__ import annotations

import logging
import threading
from typing import TYPE_CHECKING, Optional

from .vision_config import get_vision_settings

if TYPE_CHECKING:  # pragma: no cover
    import numpy as np

logger = logging.getLogger(__name__)


class WebcamService:
    """Owns a single ``cv2.VideoCapture`` and exposes the latest frame safely."""

    def __init__(self) -> None:
        self._settings = get_vision_settings()
        self._cap = None
        self._frame = None
        self._frame_lock = threading.Lock()
        self._stop = threading.Event()
        self._thread: Optional[threading.Thread] = None
        self._connected = False

    # ---- state ------------------------------------------------------------
    @property
    def is_running(self) -> bool:
        return self._thread is not None and self._thread.is_alive()

    @property
    def is_connected(self) -> bool:
        return self._connected

    # ---- lifecycle --------------------------------------------------------
    def start(self) -> None:
        """Spawn the capture thread (idempotent)."""
        if self.is_running:
            return
        self._stop.clear()
        self._thread = threading.Thread(
            target=self._run, name="webcam-capture", daemon=True
        )
        self._thread.start()
        logger.info("Webcam capture thread started (source=%s).", self._settings.camera_source)

    def stop(self) -> None:
        """Signal the capture thread to stop and release the camera."""
        if not self.is_running:
            return
        logger.info("Stopping webcam capture ...")
        self._stop.set()
        if self._thread is not None:
            self._thread.join(timeout=5.0)
        self._thread = None

    # ---- internals --------------------------------------------------------
    def _open(self):
        """Open the configured source and apply optional resolution hints."""
        import cv2

        cap = cv2.VideoCapture(self._settings.resolved_source)
        if self._settings.capture_width:
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, self._settings.capture_width)
        if self._settings.capture_height:
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self._settings.capture_height)
        return cap

    def _run(self) -> None:
        """Capture loop: (re)connect, read frames, cache the latest one."""
        try:
            import cv2  # noqa: F401  (lazy availability check)
        except ImportError:
            logger.error(
                "opencv-python is not installed; webcam capture disabled. "
                "Install: pip install -r requirements-vision.txt"
            )
            return

        while not self._stop.is_set():
            # (Re)connect if we have no open capture handle.
            if self._cap is None or not self._cap.isOpened():
                self._connected = False
                logger.info("Opening camera %s ...", self._settings.camera_source)
                self._cap = self._open()
                if not self._cap.isOpened():
                    logger.warning(
                        "Camera unavailable; retrying in %.1fs.",
                        self._settings.reconnect_delay,
                    )
                    self._cap.release()
                    self._cap = None
                    self._stop.wait(self._settings.reconnect_delay)
                    continue
                self._connected = True
                logger.info("Camera connected.")

            ok, frame = self._cap.read()
            if not ok or frame is None:
                logger.warning("Dropped frame / camera disconnected; reconnecting.")
                self._connected = False
                self._cap.release()
                self._cap = None
                self._stop.wait(self._settings.reconnect_delay)
                continue

            with self._frame_lock:
                self._frame = frame

        # Clean shutdown.
        if self._cap is not None:
            self._cap.release()
            self._cap = None
        self._connected = False
        logger.info("Webcam capture thread stopped.")

    # ---- read -------------------------------------------------------------
    def read_latest(self) -> "Optional[np.ndarray]":
        """Return a *copy* of the most recent frame, or ``None`` if not ready."""
        with self._frame_lock:
            if self._frame is None:
                return None
            return self._frame.copy()
