"""Service layer for the real-time vision subsystem.

These services are deliberately self-contained and import the heavy
computer-vision dependencies (OpenCV, Ultralytics/torch) *lazily*, so importing
this package never forces the core temple API to depend on them. That keeps the
cloud deployment lightweight while still allowing a camera-equipped machine to
run live people counting.
"""
