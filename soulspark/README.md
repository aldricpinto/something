# SoulSpark

An AI-powered Christian encouragement app that delivers daily Bible verses, uplifting reflections, and personalized guidance based on user emotions.

## Tech Stack
- Frontend: React + Vite + TailwindCSS + Framer Motion
- Backend: FastAPI (Python) + SQLite (SQLModel)
- AI: Gemini 2.5 Flash (optional; falls back to heuristics if `GEMINI_API_KEY` is missing)
- Bible API: OurManna (https://beta.ourmanna.com/api/v1/get/?format=text)
- Notifications: OneSignal (optional)

## Local Development

### Backend
1. Create a Python virtualenv and install requirements:

   ```bash
   cd soulspark/backend
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

2. Optionally set environment variables:
   - `GEMINI_API_KEY` – to enable AI-generated reflections/encouragement
   - `FRONTEND_ORIGIN` – for CORS (e.g., `http://localhost:5173`)
   - `VERSE_SCHEDULE_HOUR` and `VERSE_SCHEDULE_MINUTE` – daily verse prefetch schedule (default 07:00 UTC)

3. Run the API:

   ```bash
   uvicorn soulspark.backend.main:app --reload --port 8000
   ```

### Frontend
1. Install dependencies and run dev server:

   ```bash
   cd soulspark/frontend
   npm install
   npm run dev
   ```

2. Create a `.env` file (optional) to configure OneSignal or API URL:

   ```env
   VITE_API_URL=http://localhost:8000
   VITE_ONESIGNAL_APP_ID=YOUR-ONESIGNAL-APP-ID
   ```

3. Open http://localhost:5173

## Production Deployment
- Frontend: Deploy `soulspark/frontend` to Vercel
- Backend: Deploy `soulspark/backend` to Render (or any FastAPI-friendly host)

Ensure these environment variables are configured in production:
- Backend: `GEMINI_API_KEY`, `FRONTEND_ORIGIN` (point to your Vercel domain)
- Frontend: `VITE_API_URL` (point to your Render backend), `VITE_ONESIGNAL_APP_ID`

## API Overview
- `GET /verse/today` → Fetches today's verse + AI reflection/encouragement (cached daily)
- `POST /encouragement { mood, text? }` → AI verse, message, encouragement
- `GET /journal` → List entries (query: `include_private`)
- `POST /journal` → Create entry
- `GET /journal/{id}` → Read entry
- `PUT /journal/{id}` → Update entry
- `DELETE /journal/{id}` → Delete entry

## Notes
- If `GEMINI_API_KEY` is not provided, the app still works with meaningful, curated fallback messages.
- A background scheduler pre-fetches a daily verse and stores it in SQLite.
- Styling uses glassmorphism and animated particle background for an Apple-like aesthetic.
