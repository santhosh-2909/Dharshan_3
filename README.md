# SmartDarshan Crowd Analytics

This project has been repurposed into a complete SmartDarshan-style crowd analytics application.
It reads the image dataset from `archive(1).zip`, extracts crowd-intensity features from each frame,
and shows:

- daily crowd trend from the archive
- weekday/hour hotspot heatmap
- 7-day forecast from learned archive patterns
- busiest image gallery with per-frame crowd scores

## Dataset

By default the app looks for the dataset in one of these places:

1. `SMARTDARSHAN_DATASET_ZIP` environment variable
2. `data/archive(1).zip`
3. `data/archive.zip`
4. `/Users/santhosh/Downloads/archive(1).zip`

## Run locally

```bash
pip install -r requirements.txt
python -m uvicorn backend.main:app --reload
```

Open [http://localhost:8000/app](http://localhost:8000/app).

## API

- `GET /health`
- `GET /api/v1/dashboard`
- `GET /api/v1/images`
- `GET /api/v1/images/{image_id}`

## Notes

- The provided dataset does not include ground-truth headcounts, so the app uses image-derived crowd intensity and a relative people index rather than an exact person count.
- The frontend is a static dashboard served by FastAPI from `frontend/`.
