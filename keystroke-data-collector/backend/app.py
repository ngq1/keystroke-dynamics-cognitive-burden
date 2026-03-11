from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import json
import csv
import os
from datetime import datetime
from io import StringIO, BytesIO
from pathlib import Path
from keystroke_features import extract_keystroke_features, normalize_features

app = Flask(__name__)
CORS(app)

# Data storage directories
DATA_DIR = Path('data')
PARTICIPANTS_FILE = DATA_DIR / 'participants.json'
SESSIONS_FILE = DATA_DIR / 'sessions.json'
NASA_TLX_FILE = DATA_DIR / 'nasa_tlx.json'
COGNITIVE_BURDEN_LABELS_FILE = DATA_DIR / 'cognitive_burden_labels.json'

# Create data directory and files if they don't exist
DATA_DIR.mkdir(exist_ok=True)

def ensure_files():
    """Ensure all data files exist"""
    PARTICIPANTS_FILE.touch(exist_ok=True)
    if PARTICIPANTS_FILE.stat().st_size == 0:
        PARTICIPANTS_FILE.write_text('{}')
    
    SESSIONS_FILE.touch(exist_ok=True)
    if SESSIONS_FILE.stat().st_size == 0:
        SESSIONS_FILE.write_text('[]')
    
    NASA_TLX_FILE.touch(exist_ok=True)
    if NASA_TLX_FILE.stat().st_size == 0:
        NASA_TLX_FILE.write_text('[]')
    
    COGNITIVE_BURDEN_LABELS_FILE.touch(exist_ok=True)
    if COGNITIVE_BURDEN_LABELS_FILE.stat().st_size == 0:
        COGNITIVE_BURDEN_LABELS_FILE.write_text('[]')

ensure_files()

def load_participants():
    """Load participants from JSON file"""
    try:
        data = json.loads(PARTICIPANTS_FILE.read_text())
        if isinstance(data, dict):
            return data
        return {}
    except:
        return {}

def save_participants(data):
    """Save participants to JSON file"""
    PARTICIPANTS_FILE.write_text(json.dumps(data, indent=2))

def load_sessions():
    """Load sessions from JSON file"""
    try:
        data = json.loads(SESSIONS_FILE.read_text())
        if isinstance(data, list):
            return data
        return []
    except:
        return []

def save_sessions(data):
    """Save sessions to JSON file"""
    SESSIONS_FILE.write_text(json.dumps(data, indent=2))

def load_nasa_tlx():
    """Load NASA-TLX responses from JSON file"""
    try:
        data = json.loads(NASA_TLX_FILE.read_text())
        if isinstance(data, list):
            return data
        return []
    except:
        return []

def save_nasa_tlx(data):
    """Save NASA-TLX responses to JSON file"""
    NASA_TLX_FILE.write_text(json.dumps(data, indent=2))

def load_cognitive_burden_labels():
    """Load cognitive burden labels from JSON file"""
    try:
        data = json.loads(COGNITIVE_BURDEN_LABELS_FILE.read_text())
        if isinstance(data, list):
            return data
        return []
    except:
        return []

def save_cognitive_burden_labels(data):
    """Save cognitive burden labels to JSON file"""
    COGNITIVE_BURDEN_LABELS_FILE.write_text(json.dumps(data, indent=2))

# ==================== PARTICIPANT ENDPOINTS ====================

@app.route('/api/participant/register', methods=['POST'])
def register_participant():
    """Register a new participant"""
    try:
        data = request.json
        user_id = data.get('userId')
        
        participants = load_participants()
        
        if user_id in participants:
            return jsonify({'error': 'User ID already exists'}), 400
        
        participants[user_id] = {
            'userId': user_id,
            'age': data.get('age'),
            'gender': data.get('gender'),
            'educationLevel': data.get('educationLevel'),
            'typingHabits': data.get('typingHabits'),
            'professionalTyping': data.get('professionalTyping', False),
            'created_at': datetime.utcnow().isoformat()
        }
        
        save_participants(participants)
        
        return jsonify({
            'success': True,
            'message': 'Participant registered successfully',
            'userId': user_id
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/participant/<user_id>', methods=['GET'])
def get_participant(user_id):
    """Get participant information"""
    try:
        participants = load_participants()
        if user_id not in participants:
            return jsonify({'error': 'Participant not found'}), 404
        
        return jsonify(participants[user_id]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== TYPING SESSION ENDPOINTS ====================

@app.route('/api/typing-session/start', methods=['POST'])
def start_typing_session():
    """Initialize a new typing session"""
    try:
        data = request.json
        session_id = f"{data['userId']}_session_{datetime.utcnow().timestamp()}"
        
        session = {
            'sessionId': session_id,
            'userId': data['userId'],
            'taskType': data.get('taskType', 'fixed_text'),
            'textPrompt': data.get('textPrompt', ''),
            'typedText': '',
            'keystrokeData': [],
            'duration': 0,
            'created_at': datetime.utcnow().isoformat()
        }
        
        sessions = load_sessions()
        sessions.append(session)
        save_sessions(sessions)
        
        return jsonify({
            'sessionId': session_id,
            'message': 'Session started'
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/typing-session/submit', methods=['POST'])
def submit_typing_session():
    """Submit completed typing session with keystroke data"""
    try:
        data = request.json
        session_id = data.get('sessionId')
        
        sessions = load_sessions()
        session = next((s for s in sessions if s['sessionId'] == session_id), None)
        
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        session['typedText'] = data.get('typedText')
        session['keystrokeData'] = data.get('keystrokes', [])
        session['keystrokeFeatures'] = data.get('keystrokeFeatures', {})  # Store extracted features
        session['duration'] = data.get('duration', 0)
        session['cognitiveLoadLevel'] = data.get('cognitiveLoadLevel', 'Low')  # Store cognitive load level
        session['dualTaskData'] = data.get('dualTaskData', {})  # Store dual-task data
        
        save_sessions(sessions)
        
        return jsonify({
            'success': True,
            'message': 'Typing session submitted',
            'sessionId': session_id
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/typing-session/<session_id>', methods=['GET'])
def get_typing_session(session_id):
    """Get typing session details"""
    try:
        sessions = load_sessions()
        session = next((s for s in sessions if s['sessionId'] == session_id), None)
        
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        return jsonify(session), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== NASA-TLX ENDPOINTS ====================

@app.route('/api/nasa-tlx/submit', methods=['POST'])
def submit_nasa_tlx():
    """Submit NASA-TLX questionnaire responses"""
    try:
        data = request.json
        
        nasa_response = {
            'sessionId': data.get('sessionId'),
            'userId': data.get('userId'),
            'mentalDemand': data.get('mentalDemand'),
            'physicalDemand': data.get('physicalDemand'),
            'temporalDemand': data.get('temporalDemand'),
            'performance': data.get('performance'),
            'effort': data.get('effort'),
            'frustration': data.get('frustration'),
            'created_at': datetime.utcnow().isoformat()
        }
        
        nasa_tlx = load_nasa_tlx()
        nasa_tlx.append(nasa_response)
        save_nasa_tlx(nasa_tlx)
        
        return jsonify({
            'success': True,
            'message': 'NASA-TLX submitted',
            'sessionId': data.get('sessionId')
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/nasa-tlx/<session_id>', methods=['GET'])
def get_nasa_tlx(session_id):
    """Get NASA-TLX responses for a session"""
    try:
        nasa_tlx = load_nasa_tlx()
        response = next((n for n in nasa_tlx if n['sessionId'] == session_id), None)
        
        if not response:
            return jsonify({'error': 'NASA-TLX data not found'}), 404
        
        return jsonify(response), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== COGNITIVE BURDEN LABELING ENDPOINTS ====================

@app.route('/api/cognitive-burden-labels/submit', methods=['POST'])
def submit_cognitive_burden_labels():
    """Submit cognitive burden labels and validation report"""
    try:
        data = request.json
        
        label_entry = {
            'userId': data.get('userId'),
            'sessionId': data.get('sessionId'),
            'cognitiveLoadLevel': data.get('cognitiveLoadLevel'),
            'labels': data.get('labels'),
            'validationReport': data.get('validationReport'),
            'timestamp': data.get('timestamp', datetime.utcnow().isoformat()),
            'created_at': datetime.utcnow().isoformat()
        }
        
        labels = load_cognitive_burden_labels()
        labels.append(label_entry)
        save_cognitive_burden_labels(labels)
        
        return jsonify({
            'success': True,
            'message': 'Cognitive burden labels submitted',
            'sessionId': data.get('sessionId')
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/cognitive-burden-labels/<session_id>', methods=['GET'])
def get_cognitive_burden_labels(session_id):
    """Get cognitive burden labels for a session"""
    try:
        labels = load_cognitive_burden_labels()
        response = next((l for l in labels if l['sessionId'] == session_id), None)
        
        if not response:
            return jsonify({'error': 'Cognitive burden labels not found'}), 404
        
        return jsonify(response), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/cognitive-burden-labels/user/<user_id>', methods=['GET'])
def get_user_cognitive_burden_labels(user_id):
    """Get all cognitive burden labels for a user"""
    try:
        labels = load_cognitive_burden_labels()
        user_labels = [l for l in labels if l['userId'] == user_id]
        
        return jsonify(user_labels), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== KEYSTROKE FEATURES ENDPOINTS ====================

@app.route('/api/keystroke-features/analyze/<session_id>', methods=['GET'])
def analyze_keystroke_features(session_id):
    """Extract and analyze keystroke features for a session"""
    try:
        sessions = load_sessions()
        session = next((s for s in sessions if s['sessionId'] == session_id), None)
        
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        keystroke_data = session.get('keystrokeData', [])
        typed_text = session.get('typedText', '')
        prompt_text = session.get('textPrompt', '')
        
        # Extract keystroke features
        features = extract_keystroke_features(keystroke_data, typed_text, prompt_text)
        
        return jsonify({
            'sessionId': session_id,
            'features': features,
            'cognitiveLoadLevel': session.get('cognitiveLoadLevel', 'low'),
            'duration': session.get('duration', 0),
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/keystroke-features/compare', methods=['POST'])
def compare_keystroke_features():
    """Compare keystroke features between two sessions (current vs baseline)"""
    try:
        data = request.json
        current_session_id = data.get('currentSessionId')
        baseline_session_id = data.get('baselineSessionId')
        
        sessions = load_sessions()
        
        current_session = next((s for s in sessions if s['sessionId'] == current_session_id), None)
        baseline_session = next((s for s in sessions if s['sessionId'] == baseline_session_id), None)
        
        if not current_session or not baseline_session:
            return jsonify({'error': 'One or both sessions not found'}), 404
        
        # Extract features from both sessions
        current_features = extract_keystroke_features(
            current_session.get('keystrokeData', []),
            current_session.get('typedText', ''),
            current_session.get('textPrompt', '')
        )
        
        baseline_features = extract_keystroke_features(
            baseline_session.get('keystrokeData', []),
            baseline_session.get('typedText', ''),
            baseline_session.get('textPrompt', '')
        )
        
        # Normalize current features against baseline
        normalized = normalize_features(current_features, baseline_features)
        
        return jsonify({
            'currentSessionId': current_session_id,
            'baselineSessionId': baseline_session_id,
            'currentFeatures': current_features,
            'baselineFeatures': baseline_features,
            'normalizedFeatures': normalized,
            'currentCognitiveLoad': current_session.get('cognitiveLoadLevel', 'low'),
            'baselineCognitiveLoad': baseline_session.get('cognitiveLoadLevel', 'low'),
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/keystroke-features/user/<user_id>', methods=['GET'])
def get_user_keystroke_features(user_id):
    """Get keystroke features for all sessions of a user"""
    try:
        sessions = load_sessions()
        user_sessions = [s for s in sessions if s['userId'] == user_id]
        
        user_features = []
        for session in user_sessions:
            keystroke_data = session.get('keystrokeData', [])
            typed_text = session.get('typedText', '')
            prompt_text = session.get('textPrompt', '')
            
            features = extract_keystroke_features(keystroke_data, typed_text, prompt_text)
            
            user_features.append({
                'sessionId': session['sessionId'],
                'cognitiveLoadLevel': session.get('cognitiveLoadLevel', 'low'),
                'duration': session.get('duration', 0),
                'features': features,
                'created_at': session.get('created_at'),
            })
        
        return jsonify(user_features), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== DATA EXPORT ENDPOINTS ====================

@app.route('/api/export/participants-csv', methods=['GET'])
def export_participants_csv():
    """Export all participants to CSV"""
    try:
        participants = load_participants()
        
        output = StringIO()
        writer = csv.DictWriter(output, fieldnames=[
            'userId', 'age', 'gender', 'educationLevel', 'typingHabits', 'professionalTyping'
        ], delimiter=';')
        
        writer.writeheader()
        for user_id, participant in participants.items():
            row = {
                'userId': participant.get('userId'),
                'age': participant.get('age'),
                'gender': participant.get('gender'),
                'educationLevel': participant.get('educationLevel'),
                'typingHabits': participant.get('typingHabits'),
                'professionalTyping': participant.get('professionalTyping')
            }
            writer.writerow(row)
        
        output.seek(0)
        csv_bytes = BytesIO(output.getvalue().encode('utf-8'))
        
        return send_file(
            csv_bytes,
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'Participants_Information_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/export/typing-sessions-csv', methods=['GET'])
def export_typing_sessions_csv():
    """Export all typing sessions to CSV"""
    try:
        sessions = load_sessions()
        
        output = StringIO()
        writer = csv.DictWriter(output, fieldnames=[
            'sessionId', 'userId', 'taskType', 'textPrompt', 'typedText', 'duration'
        ], delimiter=';')
        
        writer.writeheader()
        for session in sessions:
            row = {
                'sessionId': session.get('sessionId'),
                'userId': session.get('userId'),
                'taskType': session.get('taskType'),
                'textPrompt': session.get('textPrompt'),
                'typedText': session.get('typedText'),
                'duration': session.get('duration')
            }
            writer.writerow(row)
        
        output.seek(0)
        csv_bytes = BytesIO(output.getvalue().encode('utf-8'))
        
        return send_file(
            csv_bytes,
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'Typing_Sessions_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/export/keystroke-data-json', methods=['GET'])
def export_keystroke_data_json():
    """Export all keystroke data as JSON"""
    try:
        sessions = load_sessions()
        
        data = []
        for session in sessions:
            session_data = {
                'sessionId': session.get('sessionId'),
                'userId': session.get('userId'),
                'taskType': session.get('taskType'),
                'textPrompt': session.get('textPrompt'),
                'typedText': session.get('typedText'),
                'duration': session.get('duration'),
                'created_at': session.get('created_at'),
                'keystrokes': session.get('keystrokeData', [])
            }
            data.append(session_data)
        
        json_str = json.dumps(data, indent=2)
        json_bytes = BytesIO(json_str.encode('utf-8'))
        
        return send_file(
            json_bytes,
            mimetype='application/json',
            as_attachment=True,
            download_name=f'Keystroke_Data_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/export/keystroke-features-csv', methods=['GET'])
def export_keystroke_features_csv():
    """Export detailed keystroke features to CSV for analysis"""
    try:
        sessions = load_sessions()
        nasa_tlx = load_nasa_tlx()
        
        # Create mapping of sessionId to NASA-TLX data
        nasa_map = {n['sessionId']: n for n in nasa_tlx}
        
        output = StringIO()
        fieldnames = [
            'sessionId', 'userId', 'taskType', 'duration',
            # Cognitive load fields
            'cognitiveLoadLevel', 'dualTaskType', 'dualTaskData', 'dualTaskAnswer', 'dualTaskCorrect',
            # Hold time features
            'holdTime_mean', 'holdTime_std', 'holdTime_min', 'holdTime_max',
            # Flight time D1U2
            'flightTime_D1U2_mean', 'flightTime_D1U2_std', 'flightTime_D1U2_min', 'flightTime_D1U2_max',
            # Flight time D1D2
            'flightTime_D1D2_mean', 'flightTime_D1D2_std', 'flightTime_D1D2_min', 'flightTime_D1D2_max',
            # Flight time U1D2
            'flightTime_U1D2_mean', 'flightTime_U1D2_std', 'flightTime_U1D2_min', 'flightTime_U1D2_max',
            # Flight time U1U2
            'flightTime_U1U2_mean', 'flightTime_U1U2_std', 'flightTime_U1U2_min', 'flightTime_U1U2_max',
            # Pause features
            'pause_count', 'pause_mean', 'pause_std', 'pause_min', 'pause_max',
            # Error features
            'backspaceCount', 'errorCorrections', 'correctionRate',
            # Overall
            'totalKeystrokes',
            # NASA-TLX scores (if available)
            'mentalDemand', 'physicalDemand', 'temporalDemand', 'performance', 'effort', 'frustration'
        ]
        
        writer = csv.DictWriter(output, fieldnames=fieldnames, delimiter=';')
        writer.writeheader()
        
        for session in sessions:
            features = session.get('keystrokeFeatures', {})
            nasa_data = nasa_map.get(session.get('sessionId'), {})
            dual_task = session.get('dualTaskData', {})
            
            row = {
                'sessionId': session.get('sessionId'),
                'userId': session.get('userId'),
                'taskType': session.get('taskType'),
                'duration': session.get('duration'),
                # Cognitive load
                'cognitiveLoadLevel': session.get('cognitiveLoadLevel', 'Low'),
                'dualTaskType': dual_task.get('type', 'none'),
                'dualTaskData': dual_task.get('data', ''),
                'dualTaskAnswer': dual_task.get('answer', ''),
                'dualTaskCorrect': dual_task.get('isCorrect', ''),
                # Hold time
                'holdTime_mean': features.get('holdTime', {}).get('mean', 0),
                'holdTime_std': features.get('holdTime', {}).get('std', 0),
                'holdTime_min': features.get('holdTime', {}).get('min', 0),
                'holdTime_max': features.get('holdTime', {}).get('max', 0),
                # Flight time D1U2
                'flightTime_D1U2_mean': features.get('flightTime_D1U2', {}).get('mean', 0),
                'flightTime_D1U2_std': features.get('flightTime_D1U2', {}).get('std', 0),
                'flightTime_D1U2_min': features.get('flightTime_D1U2', {}).get('min', 0),
                'flightTime_D1U2_max': features.get('flightTime_D1U2', {}).get('max', 0),
                # Flight time D1D2
                'flightTime_D1D2_mean': features.get('flightTime_D1D2', {}).get('mean', 0),
                'flightTime_D1D2_std': features.get('flightTime_D1D2', {}).get('std', 0),
                'flightTime_D1D2_min': features.get('flightTime_D1D2', {}).get('min', 0),
                'flightTime_D1D2_max': features.get('flightTime_D1D2', {}).get('max', 0),
                # Flight time U1D2
                'flightTime_U1D2_mean': features.get('flightTime_U1D2', {}).get('mean', 0),
                'flightTime_U1D2_std': features.get('flightTime_U1D2', {}).get('std', 0),
                'flightTime_U1D2_min': features.get('flightTime_U1D2', {}).get('min', 0),
                'flightTime_U1D2_max': features.get('flightTime_U1D2', {}).get('max', 0),
                # Flight time U1U2
                'flightTime_U1U2_mean': features.get('flightTime_U1U2', {}).get('mean', 0),
                'flightTime_U1U2_std': features.get('flightTime_U1U2', {}).get('std', 0),
                'flightTime_U1U2_min': features.get('flightTime_U1U2', {}).get('min', 0),
                'flightTime_U1U2_max': features.get('flightTime_U1U2', {}).get('max', 0),
                # Pauses
                'pause_count': features.get('pauses', {}).get('count', 0),
                'pause_mean': features.get('pauses', {}).get('mean', 0),
                'pause_std': features.get('pauses', {}).get('std', 0),
                'pause_min': features.get('pauses', {}).get('min', 0),
                'pause_max': features.get('pauses', {}).get('max', 0),
                # Errors
                'backspaceCount': features.get('errorMetrics', {}).get('backspaceCount', 0),
                'errorCorrections': features.get('errorMetrics', {}).get('errorCorrections', 0),
                'correctionRate': features.get('errorMetrics', {}).get('correctionRate', 0),
                # Overall
                'totalKeystrokes': features.get('totalKeystrokes', 0),
                # NASA-TLX
                'mentalDemand': nasa_data.get('mentalDemand', ''),
                'physicalDemand': nasa_data.get('physicalDemand', ''),
                'temporalDemand': nasa_data.get('temporalDemand', ''),
                'performance': nasa_data.get('performance', ''),
                'effort': nasa_data.get('effort', ''),
                'frustration': nasa_data.get('frustration', '')
            }
            
            writer.writerow(row)
        
        output.seek(0)
        csv_bytes = BytesIO(output.getvalue().encode('utf-8'))
        
        return send_file(
            csv_bytes,
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'Keystroke_Features_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/export/nasa-tlx-csv', methods=['GET'])
def export_nasa_tlx_csv():
    """Export all NASA-TLX responses to CSV"""
    try:
        nasa_tlx = load_nasa_tlx()
        
        output = StringIO()
        writer = csv.DictWriter(output, fieldnames=[
            'sessionId', 'userId', 'mentalDemand', 'physicalDemand', 
            'temporalDemand', 'performance', 'effort', 'frustration'
        ], delimiter=';')
        
        writer.writeheader()
        for response in nasa_tlx:
            row = {
                'sessionId': response.get('sessionId'),
                'userId': response.get('userId'),
                'mentalDemand': response.get('mentalDemand'),
                'physicalDemand': response.get('physicalDemand'),
                'temporalDemand': response.get('temporalDemand'),
                'performance': response.get('performance'),
                'effort': response.get('effort'),
                'frustration': response.get('frustration')
            }
            writer.writerow(row)
        
        output.seek(0)
        csv_bytes = BytesIO(output.getvalue().encode('utf-8'))
        
        return send_file(
            csv_bytes,
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'NASA_TLX_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== STATISTICS ENDPOINTS ====================

@app.route('/api/stats/summary', methods=['GET'])
def get_summary_stats():
    """Get summary statistics"""
    try:
        participants = load_participants()
        sessions = load_sessions()
        nasa_tlx = load_nasa_tlx()
        
        return jsonify({
            'totalParticipants': len(participants),
            'totalSessions': len(sessions),
            'totalNasaTLXResponses': len(nasa_tlx),
            'timestamp': datetime.utcnow().isoformat()
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== HEALTH CHECK ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'timestamp': datetime.utcnow().isoformat()}), 200

# ==================== INITIALIZATION ====================

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
