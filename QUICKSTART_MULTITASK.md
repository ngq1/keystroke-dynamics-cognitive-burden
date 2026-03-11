# Quick Start Guide - Multi-Task Cognitive Load Data Collection

## System Overview

Participants complete **all three cognitive load levels** in a single session:
1. **Low Load** - Simple typing (baseline)
2. **Medium Load** - Typing + remember 6-digit number
3. **High Load** - Typing + solve logic puzzle

**Data is automatically exported to CSV after each task completion.**

---

## Step 1: Start the Backend Server

```powershell
cd keystroke-data-collector/backend
python app.py
```

**Expected Output:**
```
 * Running on http://127.0.0.1:5000
```

Keep this terminal open.

---

## Step 2: Start the Frontend Server

**Open a NEW terminal:**

```powershell
cd keystroke-data-collector
python -m http.server 3000 --directory frontend
```

**Expected Output:**
```
Serving HTTP on :: port 3000 (http://[::]:3000/) ...
```

Keep this terminal open.

---

## Step 3: Start Automatic CSV Export (Optional but Recommended)

**Open a THIRD terminal:**

```powershell
cd keystroke-data-collector
python auto_export_csv.py
```

**Expected Output:**
```
======================================================================
AUTOMATIC CSV EXPORT - KEYSTROKE DATA COLLECTION
======================================================================

📁 Export Directory: D:\...\keystroke-data-collector\exports
🔄 Check Interval: 10 seconds
🌐 Backend API: http://localhost:5000/api

======================================================================
Monitoring for new data... (Press Ctrl+C to stop)
======================================================================

No sessions yet. Waiting for data...
```

This script will:
- Monitor for new sessions every 10 seconds
- Automatically export data to `exports/Keystroke_Features_YYYYMMDD_HHMMSS.csv`
- Maintain a live file: `exports/keystroke_features_live.csv`

Keep this terminal open (or skip if you prefer manual export).

---

## Step 4: Collect Data from Participants

1. **Open browser:** http://localhost:3000

2. **Participant sees:**
   - Auto-generated User ID (e.g., `USER_1733234567890_123`)
   - Demographics form
   - Study protocol info: "You will complete **three typing tasks**"

3. **Workflow:**
   
   **Task 1 - Low Load:**
   - Simple typing task
   - Rate cognitive load (NASA-TLX)
   - ✓ Data auto-exported to CSV
   
   **Task 2 - Medium Load:**
   - Remember 6-digit number sequence
   - Type while maintaining memory
   - Enter remembered number
   - Rate cognitive load (NASA-TLX)
   - ✓ Data auto-exported to CSV
   
   **Task 3 - High Load:**
   - Read logic puzzle
   - Type while solving puzzle
   - Enter puzzle answer
   - Rate cognitive load (NASA-TLX)
   - ✓ Data auto-exported to CSV
   
4. **Completion:**
   - Summary shows all 3 completed tasks
   - Confirmation: "Data Automatically Exported"
   - Ready for next participant

---

## Step 5: Access Exported Data

### Automatic Export (if using auto_export_csv.py)

**Latest data always available at:**
```
keystroke-data-collector/exports/keystroke_features_live.csv
```

**Timestamped backups:**
```
keystroke-data-collector/exports/Keystroke_Features_20251203_143022.csv
keystroke-data-collector/exports/Keystroke_Features_20251203_143145.csv
...
```

### Manual Export (alternative)

If not using auto-export script:

```powershell
cd keystroke-data-collector
python export_data.py
```

---

## Data Structure

Each row in the CSV represents **one typing task session**.

For a participant who completed all 3 tasks, you'll see **3 rows** with the same `userId`:

```csv
sessionId;userId;taskType;duration;cognitiveLoadLevel;...
session_001;USER_1733..._123;fixed_text;45.2;Low;...
session_002;USER_1733..._123;fixed_text;52.8;Medium;...
session_003;USER_1733..._123;fixed_text;61.3;High;...
```

### Key Columns

- `userId` - Auto-generated participant ID
- `sessionId` - Unique session ID
- `cognitiveLoadLevel` - Low, Medium, or High
- `dualTaskType` - none, number_sequence, or logic_puzzle
- `dualTaskData` - The question/sequence shown
- `dualTaskAnswer` - Participant's answer
- `dualTaskCorrect` - True/False (answer correctness)
- `holdTime_mean`, `holdTime_std`, etc. - Keystroke timing features (40+ columns)
- `mentalDemand`, `physicalDemand`, etc. - NASA-TLX scores

---

## Analysis Quick Start

### Load Data into Python

```python
import pandas as pd

# Load the latest data
df = pd.read_csv('keystroke-data-collector/exports/keystroke_features_live.csv', sep=';')

# Check how many participants completed all 3 tasks
print("Participants by task completion:")
print(df.groupby('userId')['cognitiveLoadLevel'].count().value_counts())

# Expected output:
# 3    10    # 10 participants completed all 3 tasks
# Name: cognitiveLoadLevel, dtype: int64

# Verify cognitive load distribution
print("\nCognitive load distribution:")
print(df['cognitiveLoadLevel'].value_counts())
# Expected output:
# Low       10
# Medium    10
# High      10
```

### Quick Statistical Test

```python
# Compare hold time across cognitive load levels
low = df[df['cognitiveLoadLevel'] == 'Low']['holdTime_mean']
medium = df[df['cognitiveLoadLevel'] == 'Medium']['holdTime_mean']
high = df[df['cognitiveLoadLevel'] == 'High']['holdTime_mean']

from scipy.stats import f_oneway
f_stat, p_value = f_oneway(low, medium, high)
print(f"\nHold Time ANOVA: F={f_stat:.4f}, p={p_value:.4f}")
```

### Load into Analysis Notebook

```python
# In cognitive_burden_detection.ipynb

import pandas as pd

# Load data
df = pd.read_csv('../keystroke-data-collector/exports/keystroke_features_live.csv', sep=';')

# Prepare labels
label_map = {'Low': 0, 'Medium': 1, 'High': 2}
df['cognitiveLoad_multiclass'] = df['cognitiveLoadLevel'].map(label_map)
df['cognitiveLoad_binary'] = (df['cognitiveLoadLevel'] == 'High').astype(int)

print(f"✓ Loaded {len(df)} sessions from {df['userId'].nunique()} participants")
print(f"✓ {(df.groupby('userId').size() == 3).sum()} participants completed all 3 tasks")

# Now use with the analysis pipeline in the notebook
```

---

## Expected Participant Workflow Timeline

**Single Participant Session (~10 minutes):**

- **0:00** - Start: Enter demographics, auto-gen UID → "Start First Task"
- **0:30** - Task 1 (Low): Type text → Submit
- **1:30** - NASA-TLX 1 → Submit → **Auto-export CSV**
- **2:00** - Task 2 (Medium): See number sequence → Type → Enter number
- **3:30** - NASA-TLX 2 → Submit → **Auto-export CSV**
- **4:00** - Task 3 (High): See puzzle → Type → Enter answer
- **6:00** - NASA-TLX 3 → Submit → **Auto-export CSV**
- **6:30** - Summary: All 3 tasks complete → "Start New Session" (next participant)

**Result:** 3 CSV rows per participant, all with same `userId`

---

## Sample Size Planning

### For 30 Participants (Minimum)
- Total sessions: 90 (30 × 3 tasks)
- Expected time: 5-6 hours (at ~10 min/participant)
- CSV rows: 90

### For 50 Participants (Recommended)
- Total sessions: 150 (50 × 3 tasks)
- Expected time: 8-10 hours
- CSV rows: 150

### Data Collection Schedule
- **Single session:** 20-30 participants/day (3-5 hours)
- **Multi-day:** 10-15 participants/day (more comfortable pace)

---

## Troubleshooting

### Issue: Auto-export script not detecting new sessions
**Solution:** 
```powershell
# Check backend is running
curl http://localhost:5000/api/health

# Check stats
curl http://localhost:5000/api/stats/summary
```

### Issue: Participant stuck between tasks
**Solution:** Check browser console (F12) for errors. Refresh page if needed.

### Issue: Want to export immediately
**Solution:**
```powershell
# One-time export of all formats
python auto_export_csv.py --export-all
```

### Issue: CSV file is locked/in use
**Solution:** Close Excel or any program viewing the CSV, then re-export

---

## System Requirements

**Backend:**
- Python 3.8+
- Flask 3.0.0
- Flask-CORS 4.0.0

**Frontend:**
- Modern web browser (Chrome, Firefox, Edge)
- JavaScript enabled

**Auto-Export:**
- Python requests library: `pip install requests`

---

## Data Backup Recommendation

The auto-export script creates timestamped backups automatically. Additionally:

```powershell
# Backup entire exports folder periodically
Copy-Item -Path "exports" -Destination "exports_backup_$(Get-Date -Format 'yyyyMMdd')" -Recurse
```

---

## Next Steps After Data Collection

1. **Verify data quality:**
   ```python
   df = pd.read_csv('exports/keystroke_features_live.csv', sep=';')
   print("Missing values:", df.isnull().sum().sum())
   print("Participants with 3 tasks:", (df.groupby('userId').size() == 3).sum())
   ```

2. **Run analysis pipeline:**
   - Open `cognitive_burden_detection.ipynb`
   - Load your exported CSV
   - Run classification models
   - Generate visualizations

3. **Statistical tests:**
   - Compare keystroke features across load levels
   - Correlate with NASA-TLX scores
   - Analyze dual-task performance

4. **Publication figures:**
   - Use code in `COGNITIVE_LOAD_GUIDE.md`
   - Generate confusion matrices
   - Create feature importance plots

---

## Citation

If you use this system, please cite:

```
Multi-Task Cognitive Load Detection through Keystroke Dynamics
Data Collection System v2.0
VGTU Master Thesis Research, December 2025
```

---

## Support

**System Status Check:**
- Backend: http://localhost:5000/api/health
- Frontend: http://localhost:3000
- Stats: http://localhost:5000/api/stats/summary

**Export Check:**
```powershell
Get-ChildItem exports/ | Sort-Object LastWriteTime -Descending | Select-Object -First 5
```

Happy data collecting! 🚀
