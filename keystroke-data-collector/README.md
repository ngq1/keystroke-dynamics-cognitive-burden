# Keystroke Dynamics Data Collection System

A complete web-based system for collecting keystroke dynamics data for emotion recognition and cognitive burden detection research.

## Features

✨ **Complete Data Collection Pipeline**
- Auto-generated unique participant IDs
- Participant demographic information registration
- Real-time keystroke capturing with millisecond precision
- NASA-TLX cognitive load assessment with numeric input fields (0-100)
- Automatic CSV export matching your existing data format

🎯 **Keystroke Metrics Captured**
- Key codes and timing
- Hold times (H.x metrics)
- Flight times (D1U1, D1U2, D1D2, U1D2, U1U2)
- Keystroke sequence information
- Pause detection and analysis

📊 **Data Export Formats**
- CSV files (matching existing datasets)
- JSON format for keystroke details
- NASA-TLX assessment responses
- Participant information database

## System Architecture

```
Keystroke Data Collector
├── Backend (Flask)
│   ├── app.py                 # Main Flask application
│   ├── requirements.txt        # Python dependencies
│   └── keystroke_data.db      # SQLite database (auto-created)
│
└── Frontend (React)
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── App.js             # Main component
    │   ├── App.css            # Styling
    │   ├── index.js           # React entry point
    │   └── components/
    │       ├── ParticipantForm.js     # Step 1: Registration
    │       ├── TypingInterface.js     # Step 2: Typing task with keystroke capture
    │       ├── NasaTLXForm.js         # Step 3: Cognitive load assessment
    │       └── Summary.js              # Step 4: Session summary
    ├── package.json
    └── .gitignore
```

## Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd keystroke-data-collector/backend
   ```

2. **Create virtual environment (recommended)**
   ```bash
   python -m venv venv
   
   # On Windows:
   venv\Scripts\activate
   
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run Flask server**
   ```bash
   python app.py
   ```
   
   The backend will start at `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd keystroke-data-collector/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start React development server**
   ```bash
   npm start
   ```
   
   The frontend will open at `http://localhost:3000`

## Usage

### Data Collection Workflow

1. **Step 1: Participant Registration**
   - User ID is auto-generated (format: USER_timestamp_random)
   - Provide demographic information (age, gender, education, typing habits)
   - Data is registered in the system

2. **Step 2: Typing Task**
   - Read the provided text prompt
   - Type the text in the textarea
   - Real-time keystroke data is captured
   - View live stats: Accuracy, WPM, Duration, Keystroke count
   - Submit when complete

3. **Step 3: NASA-TLX Assessment**
   - Rate cognitive load on 6 dimensions using numeric input (0-100):
     - Mental Demand
     - Physical Demand
     - Temporal Demand
     - Performance
     - Effort
     - Frustration
   - Overall score is calculated automatically

4. **Step 4: Summary & Review**
   - View session summary
   - Confirm all data was collected
   - Can start new session

### Data Export

Export collected data in multiple formats:

```bash
# Export as CSV files (matching existing datasets)
curl http://localhost:5000/api/export/participants-csv > Participants_Information.csv
curl http://localhost:5000/api/export/typing-sessions-csv > Typing_Sessions.csv
curl http://localhost:5000/api/export/nasa-tlx-csv > NASA_TLX.csv

# Export keystroke data as JSON
curl http://localhost:5000/api/export/keystroke-data-json > Keystroke_Data.json
```

Or use the API endpoints in your Python scripts:

```python
import requests
import pandas as pd

# Download participant data
response = requests.get('http://localhost:5000/api/export/participants-csv')
with open('Participants_Information.csv', 'wb') as f:
    f.write(response.content)

# Download typing session data
response = requests.get('http://localhost:5000/api/export/typing-sessions-csv')
with open('Typing_Sessions.csv', 'wb') as f:
    f.write(response.content)

# Download keystroke data
response = requests.get('http://localhost:5000/api/export/keystroke-data-json')
with open('Keystroke_Data.json', 'wb') as f:
    f.write(response.content)
```

## API Endpoints

### Participant Management
- `POST /api/participant/register` - Register new participant
- `GET /api/participant/<user_id>` - Get participant info

### Typing Sessions
- `POST /api/typing-session/start` - Start new typing session
- `POST /api/typing-session/submit` - Submit completed session with keystroke data
- `GET /api/typing-session/<session_id>` - Get session details

### NASA-TLX
- `POST /api/nasa-tlx/submit` - Submit NASA-TLX responses
- `GET /api/nasa-tlx/<session_id>` - Get NASA-TLX responses

### Data Export
- `GET /api/export/participants-csv` - Export participants as CSV
- `GET /api/export/typing-sessions-csv` - Export sessions as CSV
- `GET /api/export/keystroke-data-json` - Export keystroke data as JSON
- `GET /api/export/nasa-tlx-csv` - Export NASA-TLX responses as CSV

### Statistics
- `GET /api/stats/summary` - Get summary statistics
- `GET /api/health` - Health check

## Database Schema

### ParticipantInfo Table
```
userId (String, Primary Key)
age (Integer)
gender (String)
educationLevel (String)
typingHabits (String)
professionalTyping (Boolean)
created_at (DateTime)
```

### TypingSession Table
```
id (Integer, Primary Key)
userId (String, Foreign Key)
sessionId (String, Unique)
taskType (String) - 'fixed_text' or 'free_text'
textPrompt (Text)
typedText (Text)
keystrokeData (JSON)
duration (Float) - in seconds
created_at (DateTime)
```

### NasaTLX Table
```
id (Integer, Primary Key)
sessionId (String, Foreign Key)
userId (String, Foreign Key)
mentalDemand (Integer, 0-100)
physicalDemand (Integer, 0-100)
temporalDemand (Integer, 0-100)
performance (Integer, 0-100)
effort (Integer, 0-100)
frustration (Integer, 0-100)
created_at (DateTime)
```

## Keystroke Data Format

Each keystroke event includes:
```json
{
  "key": "a",
  "keyCode": 65,
  "timestamp": 1234.5,
  "ctrlKey": false,
  "shiftKey": false,
  "type": "keydown"
}
```

Timestamps are relative to session start time in milliseconds.

## Integration with Your Analysis Pipeline

### Loading Data in Python

```python
import pandas as pd
import json

# Load participant data
participants = pd.read_csv('Participants_Information.csv', sep=';')

# Load typing sessions
sessions = pd.read_csv('Typing_Sessions.csv', sep=';')

# Load keystroke data
with open('Keystroke_Data.json') as f:
    keystroke_data = json.load(f)

# Load NASA-TLX assessments
nasa_tlx = pd.read_csv('NASA_TLX.csv', sep=';')

# Merge datasets
merged = sessions.merge(nasa_tlx, on=['sessionId', 'userId'])
merged = merged.merge(participants[['userId', 'age', 'gender', 'educationLevel']], 
                      on='userId')
```

## CSV Format (Matching Existing Datasets)

### Fixed Text Typing Dataset.csv
```
sessionId;userId;taskType;textPrompt;typedText;duration
session_id;user_001;fixed_text;The quick brown fox...;The quick brown fox...;45.23
```

### NASA_TLX.csv
```
sessionId;userId;mentalDemand;physicalDemand;temporalDemand;performance;effort;frustration
session_id;user_001;65;30;45;70;60;25
```

### Participants_Information.csv
```
userId;age;gender;educationLevel;typingHabits;professionalTyping
user_001;25;Male;Bachelor;Frequently;true
```

## Configuration

### Modify Typing Prompts

Edit `frontend/src/components/TypingInterface.js`:

```javascript
const TYPING_PROMPTS = [
  "Your custom prompt here",
  "Another custom prompt",
  // Add more prompts
];
```

### Change Database Location

Edit `backend/app.py`:

```python
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///path/to/keystroke_data.db'
```

### Enable Emotion Labels

The system is ready for emotion labels. Uncomment the EmotionLabel endpoints in `backend/app.py` to enable emotion labeling after typing tasks.

## Troubleshooting

### Port Already in Use
If port 5000 or 3000 is in use:

**Flask (port 5000):**
```python
# In backend/app.py, change the last line:
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)  # Use 5001 instead
```

**React (port 3000):**
```bash
PORT=3001 npm start
```

Also update the `API_BASE_URL` in frontend components to match the new backend port.

### CORS Issues
If you see CORS errors in browser console, ensure:
1. Flask-CORS is installed: `pip install Flask-CORS`
2. CORS is enabled in `backend/app.py`: `CORS(app)` is present

### Database Errors
To reset the database:
```bash
# Delete keystroke_data.db from the backend directory
# Run app.py again - it will create a fresh database
```

## Performance Considerations

- **Keystroke Capture**: Captures all keydown/keyup events with browser-provided timestamps
- **Data Storage**: SQLite is suitable for research; for production, use PostgreSQL
- **Export Performance**: Large datasets (10,000+ sessions) may take a few seconds to export

## Security Notes

For research/production deployment:
- Use HTTPS (configure SSL certificates)
- Add authentication (Flask-Login or similar)
- Validate all input on backend
- Use environment variables for sensitive configs
- Consider data encryption at rest

## Future Enhancements

- [ ] Support for multiple typing tasks in one session
- [ ] Real-time data visualization dashboard
- [ ] Advanced keystroke feature extraction (hold times, flight times)
- [ ] Support for free-text typing tasks
- [ ] Mobile app version
- [ ] Emotion/cognitive state predictions
- [ ] A/B testing of different prompts
- [ ] Integration with psychometric instruments

## License

This project is part of the Emotion Recognition through Keystroke Dynamics research.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Verify both backend and frontend are running
3. Check browser console for errors
4. Verify database is accessible

## Citation

If you use this system in your research, please cite:
```
Emotion Recognition through Keystroke Dynamics
Research Project, VGTU Master Thesis 3
```
