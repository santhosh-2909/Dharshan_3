"""Centralised, idempotent logging configuration.

Called once during application startup (and by the standalone ``live_view.py``
script). Safe to call multiple times — only the first call configures handlers.
"""

import logging

_CONFIGURED = False


def configure_logging(level: int = logging.INFO) -> None:
    """Install a single, consistent log format for the whole process."""
    global _CONFIGURED
    if _CONFIGURED:
        return
    logging.basicConfig(
        level=level,
        format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    _CONFIGURED = True
