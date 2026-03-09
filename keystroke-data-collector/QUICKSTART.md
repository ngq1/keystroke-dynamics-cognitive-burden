# Quick Start Guide

Get the Keystroke Dynamics Data Collection System running in 5 minutes.

## One-Command Setup (Windows PowerShell)

```powershell
# Backend setup and start
cd backend; python -m venv venv; .\venv\Scripts\activate; pip install -r requirements.txt; python app.py
```

In a **new PowerShell window**:

```powershell
# Frontend setup and start
cd frontend; npm install; npm start
```

## Step-by-Step Setup

### Backend (Terminal 1)

```powershell
cd keystroke-data-collector\backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

**Expected output:**
```
WARNING in app.run with reloader and threaded=True
 * Running on http://0.0.0.0:5000
```

### Frontend (Terminal 2)

```powershell
cd keystroke-data-collector\frontend
npm install
npm start
```

**Expected output:**
```
Compiled successfully!

You can now view keystroke-data-collector-frontend in the browser.

  Local:            http://localhost:3000
```

### Access the Application

Open your browser and go to: **http://localhost:3000**

## Testing the System

1. **Register a participant**
   - User ID: `test_user_001`
   - Fill in demographic information
   - Click "Continue to Typing Task"

2. **Perform typing task**
   - Read the prompt
   - Type the text
   - Watch real-time stats
   - Click "Submit & Continue"

3. **Complete NASA-TLX**
   - Rate cognitive load on 6 scales
   - Click "Complete & View Summary"

4. **View summary**
   - Review all collected data
   - Session ID confirms data was saved

## Export Data

### Using Python (Recommended)

```python
import requests
import os
from datetime import datetime

API_URL = "http://localhost:5000/api"

# Create exports folder
os.makedirs("exports", exist_ok=True)

# Export participants
r = requests.get(f"{API_URL}/export/participants-csv")
with open(f"exports/Participants_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv", 'wb') as f:
    f.write(r.content)

# Export typing sessions
r = requests.get(f"{API_URL}/export/typing-sessions-csv")
with open(f"exports/Typing_Sessions_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv", 'wb') as f:
    f.write(r.content)

# Export NASA-TLX
r = requests.get(f"{API_URL}/export/nasa-tlx-csv")
with open(f"exports/NASA_TLX_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv", 'wb') as f:
    f.write(r.content)

# Export keystroke data (JSON)
r = requests.get(f"{API_URL}/export/keystroke-data-json")
with open(f"exports/Keystroke_Data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json", 'wb') as f:
    f.write(r.content)

print("✓ All data exported successfully to exports/ folder")
```

### Using PowerShell

```powershell
# Create exports folder
mkdir exports -Force

# Export all data
$timestamp = (Get-Date).ToString("yyyyMMdd_HHmmss")

Invoke-WebRequest -Uri "http://localhost:5000/api/export/participants-csv" `
  -OutFile "exports/Participants_$timestamp.csv"

Invoke-WebRequest -Uri "http://localhost:5000/api/export/typing-sessions-csv" `
  -OutFile "exports/Typing_Sessions_$timestamp.csv"

Invoke-WebRequest -Uri "http://localhost:5000/api/export/nasa-tlx-csv" `
  -OutFile "exports/NASA_TLX_$timestamp.csv"

Invoke-WebRequest -Uri "http://localhost:5000/api/export/keystroke-data-json" `
  -OutFile "exports/Keystroke_Data_$timestamp.json"

Write-Host "✓ All data exported to exports/ folder"
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Port 5000 in use | Change port in `app.py` last line or kill the process |
| Port 3000 in use | Run `PORT=3001 npm start` in frontend |
| Module not found | Ensure virtual env is activated and `pip install -r requirements.txt` |
| CORS errors | Restart backend, ensure Flask-CORS is installed |
| Database locked | Delete `keystroke_data.db` and restart backend |

## Load Data in Jupyter Notebook

```python
import pandas as pd
import json

# Read all exported CSVs
participants = pd.read_csv('exports/Participants_*.csv', sep=';')
sessions = pd.read_csv('exports/Typing_Sessions_*.csv', sep=';')
nasa_tlx = pd.read_csv('exports/NASA_TLX_*.csv', sep=';')

# Load keystroke JSON
with open('exports/Keystroke_Data_*.json') as f:
    keystrokes = json.load(f)

# Merge datasets
df = sessions.merge(nasa_tlx, on=['sessionId', 'userId'])
df = df.merge(participants, on='userId')

print(f"Loaded {len(df)} sessions from {len(participants)} participants")
print(df.head())
```

## Next Steps

1. Run multiple participants through the system
2. Export data regularly
3. Integrate with your analysis pipeline (Jupyter notebooks)
4. Extract keystroke features using the keystroke timing data
5. Train your emotion/cognitive burden models

## File Locations

- Backend: `keystroke-data-collector/backend/`
- Frontend: `keystroke-data-collector/frontend/`
- Database: `keystroke-data-collector/backend/keystroke_data.db`
- Exports: Wherever you run the export script

---

**Need help?** See `README.md` for detailed documentation
