"""
Data Export and Integration Script
Use this to export data from the data collection system
and integrate with your analysis pipeline
"""

import requests
import pandas as pd
import json
import os
from datetime import datetime
from pathlib import Path

API_BASE_URL = "http://localhost:5000/api"
EXPORT_DIR = "exports"

def create_export_directory():
    """Create exports directory if it doesn't exist"""
    Path(EXPORT_DIR).mkdir(exist_ok=True)
    print(f"✓ Using export directory: {EXPORT_DIR}/")

def export_participants_csv():
    """Export participants data as CSV"""
    try:
        response = requests.get(f"{API_BASE_URL}/export/participants-csv")
        if response.status_code == 200:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{EXPORT_DIR}/Participants_Information_{timestamp}.csv"
            with open(filename, 'wb') as f:
                f.write(response.content)
            print(f"✓ Exported participants: {filename}")
            return filename
    except Exception as e:
        print(f"✗ Error exporting participants: {e}")
    return None

def export_typing_sessions_csv():
    """Export typing sessions data as CSV"""
    try:
        response = requests.get(f"{API_BASE_URL}/export/typing-sessions-csv")
        if response.status_code == 200:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{EXPORT_DIR}/Typing_Sessions_{timestamp}.csv"
            with open(filename, 'wb') as f:
                f.write(response.content)
            print(f"✓ Exported typing sessions: {filename}")
            return filename
    except Exception as e:
        print(f"✗ Error exporting typing sessions: {e}")
    return None

def export_keystroke_features_csv():
    """Export keystroke features with NASA-TLX as CSV"""
    try:
        response = requests.get(f"{API_BASE_URL}/export/keystroke-features-csv")
        if response.status_code == 200:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{EXPORT_DIR}/Keystroke_Features_{timestamp}.csv"
            with open(filename, 'wb') as f:
                f.write(response.content)
            print(f"✓ Exported keystroke features: {filename}")
            return filename
    except Exception as e:
        print(f"✗ Error exporting keystroke features: {e}")
    return None

def export_nasa_tlx_csv():
    """Export NASA-TLX responses as CSV"""
    try:
        response = requests.get(f"{API_BASE_URL}/export/nasa-tlx-csv")
        if response.status_code == 200:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{EXPORT_DIR}/NASA_TLX_{timestamp}.csv"
            with open(filename, 'wb') as f:
                f.write(response.content)
            print(f"✓ Exported NASA-TLX: {filename}")
            return filename
    except Exception as e:
        print(f"✗ Error exporting NASA-TLX: {e}")
    return None

def export_keystroke_data_json():
    """Export keystroke data as JSON"""
    try:
        response = requests.get(f"{API_BASE_URL}/export/keystroke-data-json")
        if response.status_code == 200:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{EXPORT_DIR}/Keystroke_Data_{timestamp}.json"
            with open(filename, 'wb') as f:
                f.write(response.content)
            print(f"✓ Exported keystroke data: {filename}")
            return filename
    except Exception as e:
        print(f"✗ Error exporting keystroke data: {e}")
    return None

def get_summary_stats():
    """Get summary statistics from the system"""
    try:
        response = requests.get(f"{API_BASE_URL}/stats/summary")
        if response.status_code == 200:
            stats = response.json()
            print("\n📊 Summary Statistics:")
            print(f"  - Total Participants: {stats['totalParticipants']}")
            print(f"  - Total Sessions: {stats['totalSessions']}")
            print(f"  - Total NASA-TLX Responses: {stats['totalNasaTLXResponses']}")
            return stats
    except Exception as e:
        print(f"✗ Error getting statistics: {e}")
    return None

def load_and_merge_data():
    """Load and merge all exported data"""
    try:
        # Find the most recent export files
        participants_file = max(Path(EXPORT_DIR).glob("Participants_Information_*.csv"), 
                               key=lambda p: p.stat().st_mtime)
        sessions_file = max(Path(EXPORT_DIR).glob("Typing_Sessions_*.csv"), 
                           key=lambda p: p.stat().st_mtime)
        nasa_tlx_file = max(Path(EXPORT_DIR).glob("NASA_TLX_*.csv"), 
                           key=lambda p: p.stat().st_mtime)
        keystroke_file = max(Path(EXPORT_DIR).glob("Keystroke_Data_*.json"), 
                            key=lambda p: p.stat().st_mtime)
        
        # Load data
        print("\n📂 Loading exported data...")
        participants = pd.read_csv(participants_file, sep=';')
        sessions = pd.read_csv(sessions_file, sep=';')
        nasa_tlx = pd.read_csv(nasa_tlx_file, sep=';')
        
        with open(keystroke_file) as f:
            keystroke_data = json.load(f)
        
        print(f"  - Loaded {len(participants)} participants")
        print(f"  - Loaded {len(sessions)} typing sessions")
        print(f"  - Loaded {len(nasa_tlx)} NASA-TLX responses")
        print(f"  - Loaded {len(keystroke_data)} keystroke records")
        
        # Merge dataframes
        merged = sessions.merge(nasa_tlx, on=['sessionId', 'userId'], how='left')
        merged = merged.merge(participants[['userId', 'age', 'gender', 'educationLevel', 'typingHabits']], 
                             on='userId', how='left')
        
        return {
            'participants': participants,
            'sessions': sessions,
            'nasa_tlx': nasa_tlx,
            'keystroke_data': keystroke_data,
            'merged': merged
        }
    except StopIteration:
        print("✗ No export files found in exports/ directory")
        print("  Please export data first using export_all() function")
        return None
    except Exception as e:
        print(f"✗ Error loading data: {e}")
        return None

def export_all():
    """Export all data at once"""
    print("🔄 Starting data export...\n")
    create_export_directory()
    
    files = {
        'participants': export_participants_csv(),
        'typing_sessions': export_typing_sessions_csv(),
        'keystroke_features': export_keystroke_features_csv(),  # New: detailed features
        'nasa_tlx': export_nasa_tlx_csv(),
        'keystroke_data': export_keystroke_data_json(),
    }
    
    get_summary_stats()
    
    print("\n✓ Export completed!")
    print(f"✓ All files saved to: {EXPORT_DIR}/")
    print(f"\n💡 Use 'Keystroke_Features_*.csv' for direct analysis with your notebook")
    
    return files

if __name__ == "__main__":
    import sys
    
    print("=" * 60)
    print("Keystroke Data Collection System - Data Export Tool")
    print("=" * 60)
    
    # Check if backend is running
    try:
        response = requests.get(f"{API_BASE_URL}/health")
        if response.status_code == 200:
            print("✓ Backend is running\n")
        else:
            print("✗ Backend returned error")
            sys.exit(1)
    except requests.exceptions.ConnectionError:
        print("✗ Cannot connect to backend at http://localhost:5000")
        print("  Make sure the Flask server is running:")
        print("  cd backend && python app.py")
        sys.exit(1)
    
    # Export all data
    export_all()
    
    # Optionally load and show summary
    print("\n" + "=" * 60)
    print("Loading merged dataset...")
    print("=" * 60)
    
    data = load_and_merge_data()
    if data:
        print("\n📈 Merged Dataset Preview:")
        print(data['merged'].head())
        print(f"\nShape: {data['merged'].shape}")
        print(f"Columns: {list(data['merged'].columns)}")
        
        # Save merged dataset
        merged_file = f"{EXPORT_DIR}/Merged_Dataset_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        data['merged'].to_csv(merged_file, sep=';', index=False)
        print(f"\n✓ Merged dataset saved: {merged_file}")
