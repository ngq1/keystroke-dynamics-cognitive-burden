"""
Keystroke Dynamics Feature Extraction Module
Comprehensive keystroke feature analysis including:
- Key hold time and flight time metrics
- Typing speed and rhythm indicators
- Pause duration and frequency
- Error and correction-related features
"""

import statistics
from collections import defaultdict


def extract_keystroke_features(keystroke_data, typed_text, prompt_text):
    """
    Extract keystroke metrics from raw keystroke events
    
    Args:
        keystroke_data: List of keystroke events with timestamp
        typed_text: The actual text typed by user
        prompt_text: The target text to type
        
    Returns:
        Dictionary with comprehensive keystroke metrics
    """
    if not keystroke_data:
        return get_empty_features()
    
    metrics = {
        'keyHoldTimes': calculate_key_hold_times(keystroke_data),
        'flightTimes': calculate_flight_times(keystroke_data),
        'typingSpeed': calculate_typing_speed(keystroke_data, typed_text),
        'rhythmMetrics': calculate_rhythm_metrics(keystroke_data),
        'pauses': analyze_pauses(keystroke_data),
        'errorMetrics': calculate_error_metrics(typed_text, prompt_text, keystroke_data),
        'keystrokeStats': calculate_keystroke_stats(keystroke_data, typed_text),
    }
    
    return metrics


def calculate_key_hold_times(keystroke_data):
    """Calculate key hold times (dwell time) from keydown/keyup pairs"""
    key_map = {}  # Maps key to keydown timestamp
    hold_times = []
    
    for event in keystroke_data:
        if event.get('type') == 'keydown':
            key_map[event.get('key')] = event.get('timestamp', 0)
        elif event.get('type') == 'keyup' and event.get('key') in key_map:
            down_time = key_map[event.get('key')]
            hold_time = event.get('timestamp', 0) - down_time
            if hold_time >= 0:
                hold_times.append(hold_time)
            del key_map[event.get('key')]
    
    return {
        'values': hold_times,
        'mean': statistics.mean(hold_times) if hold_times else 0,
        'median': statistics.median(hold_times) if hold_times else 0,
        'stdDev': statistics.stdev(hold_times) if len(hold_times) > 1 else 0,
        'min': min(hold_times) if hold_times else 0,
        'max': max(hold_times) if hold_times else 0,
        'count': len(hold_times),
    }


def calculate_flight_times(keystroke_data):
    """Calculate flight times (inter-keystroke intervals) from keyup to keydown"""
    flight_times = []
    last_up_time = None
    
    for event in keystroke_data:
        if event.get('type') == 'keydown' and last_up_time is not None:
            flight_time = event.get('timestamp', 0) - last_up_time
            if flight_time >= 0:
                flight_times.append(flight_time)
        if event.get('type') == 'keyup':
            last_up_time = event.get('timestamp', 0)
    
    return {
        'values': flight_times,
        'mean': statistics.mean(flight_times) if flight_times else 0,
        'median': statistics.median(flight_times) if flight_times else 0,
        'stdDev': statistics.stdev(flight_times) if len(flight_times) > 1 else 0,
        'min': min(flight_times) if flight_times else 0,
        'max': max(flight_times) if flight_times else 0,
        'count': len(flight_times),
    }


def calculate_typing_speed(keystroke_data, typed_text):
    """Calculate typing speed metrics"""
    if not keystroke_data:
        return {'wpm': 0, 'cpm': 0, 'duration': 0}
    
    first_event = keystroke_data[0]
    last_event = keystroke_data[-1]
    duration = (last_event.get('timestamp', 0) - first_event.get('timestamp', 0)) / 1000  # Convert to seconds
    
    word_count = len(typed_text.split()) if typed_text else 0
    char_count = len(typed_text) if typed_text else 0
    
    return {
        'wpm': round((word_count / duration) * 60, 2) if duration > 0 else 0,
        'cpm': round((char_count / duration) * 60, 2) if duration > 0 else 0,
        'duration': round(duration, 2),
        'keyCount': len(keystroke_data),
    }


def calculate_rhythm_metrics(keystroke_data):
    """Calculate rhythm and regularity metrics"""
    intervals = []
    last_time = None
    
    for event in keystroke_data:
        if last_time is not None:
            intervals.append(event.get('timestamp', 0) - last_time)
        last_time = event.get('timestamp', 0)
    
    if not intervals:
        return {
            'meanInterval': 0,
            'stdDevInterval': 0,
            'coefficientOfVariation': 0,
            'rhythmRegularity': 0,
        }
    
    mean = statistics.mean(intervals)
    std_dev = statistics.stdev(intervals) if len(intervals) > 1 else 0
    
    # Rhythm regularity: inverse of coefficient of variation
    cv = (std_dev / mean) if mean > 0 else 0
    rhythm_regularity = max(0, (1 - cv) * 100)
    
    return {
        'meanInterval': round(mean, 2),
        'stdDevInterval': round(std_dev, 2),
        'coefficientOfVariation': round(cv, 3),
        'rhythmRegularity': round(rhythm_regularity, 2),
    }


def analyze_pauses(keystroke_data):
    """Analyze pause patterns in typing"""
    intervals = []
    last_time = None
    
    for event in keystroke_data:
        if last_time is not None:
            intervals.append(event.get('timestamp', 0) - last_time)
        last_time = event.get('timestamp', 0)
    
    if not intervals:
        return {
            'pauseCount': 0,
            'pauseDurations': [],
            'meanPauseDuration': 0,
            'totalPauseTime': 0,
            'pauseFrequency': 0,
        }
    
    # Pause threshold: 1.5x the 75th percentile
    sorted_intervals = sorted(intervals)
    q75_index = int(len(sorted_intervals) * 0.75)
    q75 = sorted_intervals[q75_index] if q75_index < len(sorted_intervals) else sorted_intervals[-1]
    pause_threshold = q75 * 1.5
    
    pause_durations = [i for i in intervals if i > pause_threshold]
    pause_count = len(pause_durations)
    total_pause_time = sum(pause_durations) if pause_durations else 0
    mean_pause = total_pause_time / pause_count if pause_count > 0 else 0
    pause_frequency = (pause_count / len(intervals) * 100) if intervals else 0
    
    return {
        'pauseCount': pause_count,
        'pauseDurations': pause_durations,
        'meanPauseDuration': round(mean_pause, 2),
        'totalPauseTime': round(total_pause_time, 2),
        'pauseFrequency': round(pause_frequency, 2),
        'pauseThreshold': round(pause_threshold, 2),
    }


def calculate_error_metrics(typed_text, prompt_text, keystroke_data):
    """Calculate error and correction features"""
    if not typed_text or not prompt_text:
        return {
            'totalErrors': 0,
            'errorRate': 0,
            'corrections': 0,
            'errorPositions': [],
            'typingAccuracy': 0,
        }
    
    # Character-level error detection
    errors = []
    min_length = min(len(typed_text), len(prompt_text))
    
    for i in range(min_length):
        if typed_text[i] != prompt_text[i]:
            errors.append(i)
    
    # Length-based errors
    length_diff = abs(len(typed_text) - len(prompt_text))
    total_errors = len(errors) + length_diff
    
    # Correction detection (backspace count)
    backspace_count = sum(1 for event in keystroke_data if event.get('key') == 'Backspace')
    
    error_rate = (total_errors / len(prompt_text) * 100) if prompt_text else 0
    typing_accuracy = (1 - total_errors / len(prompt_text) * 100) if prompt_text else 0
    
    return {
        'totalErrors': total_errors,
        'errorRate': round(error_rate, 2),
        'errorPositions': errors,
        'corrections': backspace_count,
        'typingAccuracy': round(max(0, typing_accuracy), 2),
    }


def calculate_keystroke_stats(keystroke_data, typed_text):
    """Calculate keystroke statistics"""
    keydown_count = sum(1 for event in keystroke_data if event.get('type') == 'keydown')
    keyup_count = sum(1 for event in keystroke_data if event.get('type') == 'keyup')
    
    shift_count = sum(1 for event in keystroke_data if event.get('shiftKey'))
    ctrl_count = sum(1 for event in keystroke_data if event.get('ctrlKey'))
    backspace_count = sum(1 for event in keystroke_data if event.get('key') == 'Backspace')
    space_count = sum(1 for event in keystroke_data if event.get('key') == ' ')
    
    unique_keys = len(set(event.get('key') for event in keystroke_data))
    
    return {
        'totalKeystrokes': len(keystroke_data),
        'keydownCount': keydown_count,
        'keyupCount': keyup_count,
        'shiftKeyCount': shift_count,
        'ctrlKeyCount': ctrl_count,
        'backspaceCount': backspace_count,
        'spaceCount': space_count,
        'typedCharCount': len(typed_text) if typed_text else 0,
        'uniqueKeys': unique_keys,
    }


def normalize_features(current_features, baseline_features):
    """
    Normalize features relative to baseline
    Returns percentage change from baseline
    """
    if not baseline_features:
        return current_features
    
    def normalize_metric(current, baseline):
        if baseline == 0 or baseline is None:
            return 0
        change = ((current - baseline) / baseline) * 100
        return round(change, 2) if isinstance(change, (int, float)) else 0
    
    normalized = {
        'keyHoldTime': {
            'meanNormalized': normalize_metric(
                current_features['keyHoldTimes']['mean'],
                baseline_features['keyHoldTimes']['mean']
            ),
            'stdDevNormalized': normalize_metric(
                current_features['keyHoldTimes']['stdDev'],
                baseline_features['keyHoldTimes']['stdDev']
            ),
        },
        'flightTime': {
            'meanNormalized': normalize_metric(
                current_features['flightTimes']['mean'],
                baseline_features['flightTimes']['mean']
            ),
            'stdDevNormalized': normalize_metric(
                current_features['flightTimes']['stdDev'],
                baseline_features['flightTimes']['stdDev']
            ),
        },
        'typingSpeed': {
            'wpmNormalized': normalize_metric(
                current_features['typingSpeed']['wpm'],
                baseline_features['typingSpeed']['wpm']
            ),
            'cpmNormalized': normalize_metric(
                current_features['typingSpeed']['cpm'],
                baseline_features['typingSpeed']['cpm']
            ),
        },
        'errors': {
            'errorRateNormalized': normalize_metric(
                current_features['errorMetrics']['errorRate'],
                baseline_features['errorMetrics']['errorRate']
            ),
            'correctionNormalized': normalize_metric(
                current_features['errorMetrics']['corrections'],
                baseline_features['errorMetrics']['corrections']
            ),
        },
    }
    
    return normalized


def get_empty_features():
    """Return empty features object for initialization"""
    return {
        'keyHoldTimes': {
            'values': [],
            'mean': 0,
            'median': 0,
            'stdDev': 0,
            'min': 0,
            'max': 0,
            'count': 0,
        },
        'flightTimes': {
            'values': [],
            'mean': 0,
            'median': 0,
            'stdDev': 0,
            'min': 0,
            'max': 0,
            'count': 0,
        },
        'typingSpeed': {
            'wpm': 0,
            'cpm': 0,
            'duration': 0,
            'keyCount': 0,
        },
        'rhythmMetrics': {
            'meanInterval': 0,
            'stdDevInterval': 0,
            'coefficientOfVariation': 0,
            'rhythmRegularity': 0,
        },
        'pauses': {
            'pauseCount': 0,
            'pauseDurations': [],
            'meanPauseDuration': 0,
            'totalPauseTime': 0,
            'pauseFrequency': 0,
        },
        'errorMetrics': {
            'totalErrors': 0,
            'errorRate': 0,
            'corrections': 0,
            'errorPositions': [],
            'typingAccuracy': 0,
        },
        'keystrokeStats': {
            'totalKeystrokes': 0,
            'keydownCount': 0,
            'keyupCount': 0,
            'shiftKeyCount': 0,
            'ctrlKeyCount': 0,
            'backspaceCount': 0,
            'spaceCount': 0,
            'typedCharCount': 0,
            'uniqueKeys': 0,
        },
    }
