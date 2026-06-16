"""Configuration for the real-time vision (webcam + YOLO) subsystem.

Settings are read from environment variables / the backend ``.env`` file using
pydantic-settings, mirroring how :class:`app.config.Settings` works. Keeping the
vision settings in a separate model means the core temple API carries zero
dependency on the (heavy, optional) computer-vision stack.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class VisionSettings(BaseSettings):
    """Environment-driven settings for the webcam + YOLO pipeline."""

    # Ultralytics model weights. ``yolov8n.pt`` (nano) is the fastest and is
    # auto-downloaded on first load. Swap to yolov8s/m.pt for higher accuracy.
    yolo_model: str = "yolov8n.pt"

    # Video source. "0" = default laptop webcam. May also be a file path or an
    # RTSP/HTTP stream URL for a real CCTV camera.
    camera_source: str = "0"

    # Minimum detection confidence required to count a person (0–1).
    confidence_threshold: float = 0.5

    # COCO class id for "person" is 0 — we detect only this class.
    person_class_id: int = 0

    # Run inference on 1 of every ``frame_skip`` sampled frames (>=1). Higher
    # values trade detection rate for lower CPU usage.
    frame_skip: int = 2

    # Minimum seconds between two YOLO inferences (throttle to protect the CPU
    # and hold a steady, predictable inference FPS).
    inference_interval: float = 0.04

    # Seconds to wait before retrying a lost / disconnected camera.
    reconnect_delay: float = 2.0

    # Optional capture resolution (0 = keep the camera's native default).
    capture_width: int = 0
    capture_height: int = 0

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def resolved_source(self) -> "int | str":
        """Return an int camera index for "0"/"1"… or the raw URL/path string."""
        source = self.camera_source.strip()
        return int(source) if source.isdigit() else source


@lru_cache
def get_vision_settings() -> VisionSettings:
    """Cached accessor so the .env file is parsed exactly once per process."""
    return VisionSettings()
