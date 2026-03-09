"""
Direct CSV Export - No Dependencies Required
Reads JSON data files and creates CSV exports directly
"""

import json
import csv
from pathlib import Path
from datetime import datetime

# Paths
DATA_DIR = Path('backend/data')
EXPORT_DIR = Path('exports')
EXPORT_DIR.mkdir(exist_ok=True)

def load_json(filename):
    """Load JSON data file"""
    filepath = DATA_DIR / filename
    if filepath.exists():
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {} if filename == 'participants.json' else []

def export_keystroke_features_csv():
    """Export keystroke features to CSV"""
    print("📊 Exporting Keystroke Features CSV...")
    
    sessions = load_json('sessions.json')
    nasa_tlx = load_json('nasa_tlx.json')
    
    # Create mapping of sessionId to NASA-TLX
    nasa_map = {n['sessionId']: n for n in nasa_tlx}
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = EXPORT_DIR / f"Keystroke_Features_{timestamp}.csv"
    
    fieldnames = [
        'sessionId', 'userId', 'taskType', 'duration', 'typedText',
        'cognitiveLoadLevel', 'dualTaskType', 'dualTaskData', 'dualTaskAnswer', 'dualTaskCorrect',
        'holdTime_mean', 'holdTime_std', 'holdTime_min', 'holdTime_max',
        'flightTime_D1U2_mean', 'flightTime_D1U2_std', 'flightTime_D1U2_min', 'flightTime_D1U2_max',
        'flightTime_D1D2_mean', 'flightTime_D1D2_std', 'flightTime_D1D2_min', 'flightTime_D1D2_max',
        'flightTime_U1D2_mean', 'flightTime_U1D2_std', 'flightTime_U1D2_min', 'flightTime_U1D2_max',
        'flightTime_U1U2_mean', 'flightTime_U1U2_std', 'flightTime_U1U2_min', 'flightTime_U1U2_max',
        'pause_count', 'pause_mean', 'pause_std', 'pause_min', 'pause_max',
        'backspaceCount', 'errorCorrections', 'correctionRate',
        'totalKeystrokes',
        'mentalDemand', 'physicalDemand', 'temporalDemand', 'performance', 'effort', 'frustration'
    ]
    
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, delimiter=';')
        writer.writeheader()
        
        for session in sessions:
            features = session.get('keystrokeFeatures', {})
            nasa_data = nasa_map.get(session.get('sessionId'), {})
            dual_task = session.get('dualTaskData', {})
            
            row = {
                'sessionId': session.get('sessionId', ''),
                'userId': session.get('userId', ''),
                'taskType': session.get('taskType', ''),
                'duration': session.get('duration', 0),
                'typedText': session.get('typedText', ''),
                'cognitiveLoadLevel': session.get('cognitiveLoadLevel', 'Low'),
                'dualTaskType': dual_task.get('type', 'none'),
                'dualTaskData': dual_task.get('data', ''),
                'dualTaskAnswer': dual_task.get('answer', ''),
                'dualTaskCorrect': dual_task.get('isCorrect', ''),
                'holdTime_mean': features.get('holdTime', {}).get('mean', 0),
                'holdTime_std': features.get('holdTime', {}).get('std', 0),
                'holdTime_min': features.get('holdTime', {}).get('min', 0),
                'holdTime_max': features.get('holdTime', {}).get('max', 0),
                'flightTime_D1U2_mean': features.get('flightTime_D1U2', {}).get('mean', 0),
                'flightTime_D1U2_std': features.get('flightTime_D1U2', {}).get('std', 0),
                'flightTime_D1U2_min': features.get('flightTime_D1U2', {}).get('min', 0),
                'flightTime_D1U2_max': features.get('flightTime_D1U2', {}).get('max', 0),
                'flightTime_D1D2_mean': features.get('flightTime_D1D2', {}).get('mean', 0),
                'flightTime_D1D2_std': features.get('flightTime_D1D2', {}).get('std', 0),
                'flightTime_D1D2_min': features.get('flightTime_D1D2', {}).get('min', 0),
                'flightTime_D1D2_max': features.get('flightTime_D1D2', {}).get('max', 0),
                'flightTime_U1D2_mean': features.get('flightTime_U1D2', {}).get('mean', 0),
                'flightTime_U1D2_std': features.get('flightTime_U1D2', {}).get('std', 0),
                'flightTime_U1D2_min': features.get('flightTime_U1D2', {}).get('min', 0),
                'flightTime_U1D2_max': features.get('flightTime_U1D2', {}).get('max', 0),
                'flightTime_U1U2_mean': features.get('flightTime_U1U2', {}).get('mean', 0),
                'flightTime_U1U2_std': features.get('flightTime_U1U2', {}).get('std', 0),
                'flightTime_U1U2_min': features.get('flightTime_U1U2', {}).get('min', 0),
                'flightTime_U1U2_max': features.get('flightTime_U1U2', {}).get('max', 0),
                'pause_count': features.get('pauses', {}).get('count', 0),
                'pause_mean': features.get('pauses', {}).get('mean', 0),
                'pause_std': features.get('pauses', {}).get('std', 0),
                'pause_min': features.get('pauses', {}).get('min', 0),
                'pause_max': features.get('pauses', {}).get('max', 0),
                'backspaceCount': features.get('errorMetrics', {}).get('backspaceCount', 0),
                'errorCorrections': features.get('errorMetrics', {}).get('errorCorrections', 0),
                'correctionRate': features.get('errorMetrics', {}).get('correctionRate', 0),
                'totalKeystrokes': features.get('totalKeystrokes', 0),
                'mentalDemand': nasa_data.get('mentalDemand', ''),
                'physicalDemand': nasa_data.get('physicalDemand', ''),
                'temporalDemand': nasa_data.get('temporalDemand', ''),
                'performance': nasa_data.get('performance', ''),
                'effort': nasa_data.get('effort', ''),
                'frustration': nasa_data.get('frustration', '')
            }
            
            writer.writerow(row)
    
    print(f"  ✓ Exported {len(sessions)} sessions to: {filename.name}")
    return filename

def export_participants_csv():
    """Export participants to CSV"""
    print("👥 Exporting Participants CSV...")
    
    participants = load_json('participants.json')
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = EXPORT_DIR / f"Participants_{timestamp}.csv"
    
    fieldnames = ['userId', 'age', 'gender', 'educationLevel', 'typingHabits', 'created_at']
    
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, delimiter=';')
        writer.writeheader()
        
        for user_id, data in participants.items():
            writer.writerow({
                'userId': data.get('userId', user_id),
                'age': data.get('age', ''),
                'gender': data.get('gender', ''),
                'educationLevel': data.get('educationLevel', ''),
                'typingHabits': data.get('typingHabits', ''),
                'created_at': data.get('created_at', '')
            })
    
    print(f"  ✓ Exported {len(participants)} participants to: {filename.name}")
    return filename

def export_nasa_tlx_csv():
    """Export NASA-TLX data to CSV"""
    print("📋 Exporting NASA-TLX CSV...")
    
    nasa_tlx = load_json('nasa_tlx.json')
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = EXPORT_DIR / f"NASA_TLX_{timestamp}.csv"
    
    fieldnames = ['sessionId', 'userId', 'mentalDemand', 'physicalDemand', 
                  'temporalDemand', 'performance', 'effort', 'frustration', 'created_at']
    
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, delimiter=';')
        writer.writeheader()
        
        for entry in nasa_tlx:
            writer.writerow(entry)
    
    print(f"  ✓ Exported {len(nasa_tlx)} NASA-TLX entries to: {filename.name}")
    return filename

def get_stats():
    """Display statistics"""
    participants = load_json('participants.json')
    sessions = load_json('sessions.json')
    nasa_tlx = load_json('nasa_tlx.json')
    
    print("\n📊 Data Summary:")
    print(f"  • Participants: {len(participants)}")
    print(f"  • Total Sessions: {len(sessions)}")
    print(f"  • NASA-TLX Responses: {len(nasa_tlx)}")
    
    # Count cognitive load levels
    if sessions:
        load_levels = {}
        for session in sessions:
            level = session.get('cognitiveLoadLevel', 'Low')
            load_levels[level] = load_levels.get(level, 0) + 1
        
        print(f"\n  Cognitive Load Distribution:")
        for level, count in sorted(load_levels.items()):
            print(f"    - {level}: {count}")

def main():
    print("=" * 70)
    print("DIRECT CSV EXPORT - KEYSTROKE DATA COLLECTION")
    print("=" * 70)
    print()
    
    # Export all data
    export_keystroke_features_csv()
    export_participants_csv()
    export_nasa_tlx_csv()
    
    get_stats()
    
    print("\n" + "=" * 70)
    print(f"✓ Export Complete! Files saved to: {EXPORT_DIR.absolute()}")
    print("=" * 70)
    
    # Also create a live file (latest export)
    print("\n💡 Creating live file for continuous access...")
    sessions = load_json('sessions.json')
    if sessions:
        live_file = EXPORT_DIR / "keystroke_features_live.csv"
        export_keystroke_features_csv()
        print(f"  ✓ Live file: {live_file.name}")

if __name__ == "__main__":
    main()
