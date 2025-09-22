# SafeGuard-Web-Protector

Chrome Extension powered by ML to classify URLs as malicious or benign using trained models. Integrates Google Safe Browsing & VirusTotal APIs. Includes Child Mode to block inappropriate content for safer browsing.

## Backend integration

This extension can call your project's FastAPI backend (in `backend/`) to get ML predictions and to let the backend log blocked URLs to Postgres.

### 1) Configure backend URL

- Edit `extension/background.js` and change the `this.backendUrl` value (default: `http://localhost:8000`) to your backend host.

### 2) Backend contract

- Endpoint: POST {backendUrl}/predict-url
- Request body: { url: string, child_mode: bool, strict_mode: bool, real_time?: bool, immediate_scan?: bool }
- Response: JSON with at least: `prediction` ("malicious"|"safe"|"blocked"), `confidence` (number), `reason` (string). The extension will treat `malicious` or `blocked` as block decisions.

### 3) Running the backend

- The main backend is a FastAPI app in `backend/main.py`. It expects Postgres credentials via environment variables (see `backend/database.py`): `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`.
- Example (PowerShell):

```powershell
# From repository root
python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

### 4) Optional ML-only test server

- A small Flask ML test server lives at `extension/scripts/ml_api_server.py` and runs on port 5000 for quick experiments.

### 5) Security notes

- Do not embed sensitive API keys or DB passwords in extension code. Use environment variables and secure backend endpoints.
- Consider requiring authentication for the backend API and validate incoming requests from the extension.

### 6) Fallback behavior

- If the backend is unreachable, the extension will fall back to Google Safe Browsing and VirusTotal checks.

Enjoy testing and reach out if you want me to wire authentication or add a settings UI to change backend URL from the extension popup.
