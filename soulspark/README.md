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

## Windows setup and running locally (PowerShell)

This section shows exactly how to run the backend (FastAPI) and frontend (Vite + React) on Windows 10/11 using PowerShell. If you prefer WSL (Windows Subsystem for Linux), see the WSL note at the end.

### 1) Prerequisites
- Windows 10/11
- PowerShell (Windows Terminal recommended)
- Git for Windows: https://git-scm.com/download/win
- Python 3.11+ (make sure to tick "Add Python to PATH" during install): https://www.python.org/downloads/windows/
- Node.js LTS (includes npm): https://nodejs.org/en/download
- Optional: Visual Studio Code: https://code.visualstudio.com/

Verify installs in a new PowerShell window:

```powershell
python --version     # or: py --version
pip --version
node -v
npm -v
```

### 2) Get the code
If you haven't already cloned the repo:

```powershell
git clone <YOUR_REPO_URL>
cd <YOUR_REPO_FOLDER>
```

Inside the repo you should see a folder named `soulspark` that contains `backend` and `frontend`.

### 3) Backend (FastAPI) – create venv, install deps, run
We'll keep everything simple by doing all commands from the `soulspark` folder (the one that contains `backend` and `frontend`). The backend package name is `backend`, so we'll run Uvicorn as `backend.main:app` from this folder.

```powershell
# Go to the project root folder that contains the backend and frontend folders
cd soulspark

# Create a virtual environment inside the backend folder
python -m venv backend\.venv

# Activate it (if you see a policy error, see Troubleshooting at the bottom)
.\backend\.venv\Scripts\Activate

# Upgrade pip (optional but recommended)
python -m pip install --upgrade pip

# Install backend dependencies
pip install -r backend\requirements.txt
```

Optional environment variables (set them in the same PowerShell window before starting the API):

```powershell
# Enables AI-powered reflections (optional)
$env:GEMINI_API_KEY = "YOUR-GEMINI-API-KEY"

# CORS origin for the frontend dev server
$env:FRONTEND_ORIGIN = "http://localhost:5173"

# Daily verse prefetch schedule (UTC time)
$env:VERSE_SCHEDULE_HOUR = "7"
$env:VERSE_SCHEDULE_MINUTE = "0"

# Optional: override SQLite path (defaults to ./soulspark.db in current folder)
# Examples:
# $env:SOULSPARK_DB_PATH = "sqlite:///./soulspark.db"
# $env:SOULSPARK_DB_PATH = "sqlite:///C:/data/soulspark.db"
```

Start the API (keep this window open):

```powershell
python -m uvicorn backend.main:app --reload --port 8000
```

Quick check in another PowerShell window or your browser:

```powershell
curl http://localhost:8000/health
```

You should see: `{"ok": true}`

Note: The SQLite database file is created where you start Uvicorn (default: `./soulspark.db`).

### 4) Frontend (Vite + React) – install deps, run dev server
Open a new PowerShell window, then:

```powershell
cd <YOUR_REPO_FOLDER>\soulspark\frontend

# Install Node dependencies
npm install

# Optional: create a .env file to point to your local API and/or OneSignal
# File: soulspark/frontend/.env
# ---------------------------------
# VITE_API_URL=http://localhost:8000
# VITE_ONESIGNAL_APP_ID=YOUR-ONESIGNAL-APP-ID
# ---------------------------------

# Start dev server (keep this running)
npm run dev
```

Open http://localhost:5173 in your browser. The frontend will call the backend at http://localhost:8000 (configure via `VITE_API_URL`).

### 5) Common Windows issues (Troubleshooting)
- Virtualenv activation policy error
  - If you see an error like "Activate.ps1 cannot be loaded because running scripts is disabled...":
    ```powershell
    Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
    ```
    Close and reopen PowerShell, then activate again:
    ```powershell
    .\backend\.venv\Scripts\Activate
    ```
- Port already in use (8000 or 5173)
  - Find the process and kill it:
    ```powershell
    netstat -ano | findstr :8000
    taskkill /PID <PID_FROM_PREVIOUS_COMMAND> /F
    ```
- "python" or "pip" not recognized
  - Open a new PowerShell window after install, or reinstall Python and check "Add Python to PATH" during installation. You can also try `py -m pip ...` instead of `pip`.
- CORS errors in browser
  - Make sure you set:
    ```powershell
    $env:FRONTEND_ORIGIN = "http://localhost:5173"
    ```
    and restart the backend so it picks up the variable.
- Firewall prompts
  - Allow both Node (vite dev server) and Python (uvicorn) to accept connections on localhost.

### 6) WSL (optional)
If you use Windows Subsystem for Linux (Ubuntu), you can follow the Linux/macOS instructions exactly inside your WSL shell. The ports 8000 and 5173 will be accessible from Windows via `http://localhost:8000` and `http://localhost:5173` by default.

### 7) Stopping the servers
- In each terminal window where a server is running, press Ctrl + C.
