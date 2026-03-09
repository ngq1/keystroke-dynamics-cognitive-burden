"""
Automatic CSV Export Script for Keystroke Data Collection

This script continuously monitors for new data and automatically exports to CSV files.
Run this script alongside the Flask backend to enable real-time data export.
"""

import requests
import time
import json
from datetime import datetime
from pathlib import Path

# Configuration
API_BASE_URL = "http://localhost:5000/api"
EXPORT_DIR = Path("exports")
CHECK_INTERVAL = 10  # seconds between checks
EXPORT_FILE = EXPORT_DIR / "keystroke_features_live.csv"

# Create export directory
EXPORT_DIR.mkdir(exist_ok=True)

# Track last export
last_session_count = 0


def get_session_count():
    """Get current number of sessions from backend"""
    try:
        response = requests.get(f"{API_BASE_URL}/stats/summary")
        if response.status_code == 200:
            stats = response.json()
            return stats.get('totalSessions', 0)
    except:
        return 0


def export_to_csv():
    """Export all data to CSV file"""
    try:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Exporting data to CSV...")
        
        response = requests.get(f"{API_BASE_URL}/export/keystroke-features-csv")
        
        if response.status_code == 200:
            # Save to timestamped file
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = EXPORT_DIR / f"Keystroke_Features_{timestamp}.csv"
            
            with open(filename, 'wb') as f:
                f.write(response.content)
            
            # Also save to "live" file (overwrite)
            with open(EXPORT_FILE, 'wb') as f:
                f.write(response.content)
            
            # Count lines in CSV (sessions)
            lines = response.content.decode('utf-8').split('\n')
            session_count = len(lines) - 2  # Subtract header and empty line
            
            print(f"  ✓ Exported {session_count} sessions to: {filename.name}")
            print(f"  ✓ Updated live file: {EXPORT_FILE.name}")
            return True
        else:
            print(f"  ✗ Export failed: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"  ✗ Export error: {e}")
        return False


def main():
    """Main monitoring loop"""
    global last_session_count
    
    print("=" * 70)
    print("AUTOMATIC CSV EXPORT - KEYSTROKE DATA COLLECTION")
    print("=" * 70)
    print(f"\n📁 Export Directory: {EXPORT_DIR.absolute()}")
    print(f"🔄 Check Interval: {CHECK_INTERVAL} seconds")
    print(f"🌐 Backend API: {API_BASE_URL}")
    print("\n" + "=" * 70)
    print("Monitoring for new data... (Press Ctrl+C to stop)")
    print("=" * 70 + "\n")
    
    # Initial export
    last_session_count = get_session_count()
    if last_session_count > 0:
        print(f"Found {last_session_count} existing sessions")
        export_to_csv()
    else:
        print("No sessions yet. Waiting for data...")
    
    try:
        while True:
            time.sleep(CHECK_INTERVAL)
            
            current_count = get_session_count()
            
            if current_count > last_session_count:
                new_sessions = current_count - last_session_count
                print(f"\n🔔 Detected {new_sessions} new session(s)")
                
                if export_to_csv():
                    last_session_count = current_count
                    print(f"📊 Total sessions now: {current_count}\n")
            
    except KeyboardInterrupt:
        print("\n\n" + "=" * 70)
        print("🛑 Auto-export stopped by user")
        print(f"📊 Final session count: {last_session_count}")
        print(f"📁 Latest export: {EXPORT_FILE}")
        print("=" * 70)


def export_all_formats():
    """Export all data formats (CSV + JSON)"""
    print("\n📦 Exporting all data formats...\n")
    
    exports = {
        'participants': '/export/participants-csv',
        'sessions': '/export/typing-sessions-csv',
        'nasa_tlx': '/export/nasa-tlx-csv',
        'keystroke_features': '/export/keystroke-features-csv',
        'keystroke_json': '/export/keystroke-data-json'
    }
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    for name, endpoint in exports.items():
        try:
            response = requests.get(f"{API_BASE_URL}{endpoint}")
            if response.status_code == 200:
                if 'json' in name:
                    filename = EXPORT_DIR / f"{name.title()}_{timestamp}.json"
                else:
                    filename = EXPORT_DIR / f"{name.title()}_{timestamp}.csv"
                
                with open(filename, 'wb') as f:
                    f.write(response.content)
                
                print(f"  ✓ Exported: {filename.name}")
        except Exception as e:
            print(f"  ✗ Failed to export {name}: {e}")
    
    print(f"\n✓ All exports complete! Saved to: {EXPORT_DIR.absolute()}\n")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == '--export-all':
        # One-time export of all formats
        export_all_formats()
    else:
        # Continuous monitoring mode
        main()
