# Keystroke Dynamics Feature Utilization and Extension

## Overview

This document details the comprehensive keystroke dynamics feature extraction framework implemented in the system. The features capture the unique biometric signatures of keystroke patterns and analyze how cognitive burden affects typing behavior.

## Feature Categories

### 1. **Key Hold Time (Dwell Time) Metrics**

**Definition**: Time interval between pressing a key (keydown) and releasing it (keyup).

**Metrics Extracted**:
- **Mean Hold Time**: Average duration a key is held down
- **Median Hold Time**: Middle value of all hold times (robust to outliers)
- **Standard Deviation**: Variability in hold times
- **Min/Max**: Range of hold times
- **Count**: Total number of key presses analyzed

**Clinical Significance**:
- Longer hold times under cognitive load may indicate increased motor control
- High variability suggests inconsistent typing patterns
- Baseline hold times are participant-specific and vary by individual

**Example**:
```
Mean Hold Time: 78.5 ms
StdDev: 12.3 ms
Range: 45ms - 150ms
```

### 2. **Flight Time (Inter-Keystroke Interval) Metrics**

**Definition**: Time between releasing one key and pressing the next key.

**Metrics Extracted**:
- **Mean Flight Time**: Average time between key presses
- **Median Flight Time**: Middle value (robust to outliers)
- **Standard Deviation**: Variability in inter-keystroke intervals
- **Min/Max**: Range of intervals
- **Count**: Number of intervals analyzed

**Clinical Significance**:
- Flight times are highly sensitive to cognitive load
- Increased flight times often correlate with higher cognitive burden
- Reflects mental processing time during typing
- Can be modeled to detect pause-before-common-letters pattern

**Example**:
```
Mean Flight Time: 134.2 ms
StdDev: 58.7 ms
Range: 12ms - 450ms
```

### 3. **Typing Speed Indicators**

**Metrics Extracted**:
- **Words Per Minute (WPM)**: Standard typing speed metric
- **Characters Per Minute (CPM)**: Fine-grained speed measure
- **Session Duration**: Total time spent typing
- **Key Count**: Total keystroke events recorded

**Normalization**:
When comparing across conditions:
$$\text{Normalized Speed} = \frac{\text{Current WPM} - \text{Baseline WPM}}{\text{Baseline WPM}} \times 100\%$$

**Example Analysis**:
```
Baseline (Low Load): 60 WPM
Current (High Load): 45 WPM
Normalized Change: -25%
```

### 4. **Rhythm and Regularity Indicators**

**Core Metrics**:
- **Mean Interval**: Average time between any keystroke events
- **Coefficient of Variation (CV)**: Ratio of standard deviation to mean
  $$CV = \frac{\sigma}{\mu}$$
- **Rhythm Regularity**: Inverse of CV, expressed as percentage
  $$\text{Rhythm Regularity} = \max(0, (1 - CV) \times 100)\%$$

**Interpretation**:
- **High Regularity (>75%)**: Consistent, predictable typing pattern
- **Medium Regularity (50-75%)**: Some irregularity, moderate cognitive load
- **Low Regularity (<50%)**: Highly inconsistent pattern, high cognitive demand

**Example**:
```
Mean Interval: 95.3 ms
StdDev: 45.2 ms
CV: 0.474
Regularity: 52.6%
```

### 5. **Pause Duration and Frequency Analysis**

**Definition**: Pauses are detected as inter-keystroke intervals significantly longer than typical.

**Pause Threshold Calculation**:
$$\text{Threshold} = Q_{75} \times 1.5$$

Where $Q_{75}$ is the 75th percentile of all intervals.

**Metrics Extracted**:
- **Pause Count**: Total number of detected pauses
- **Mean Pause Duration**: Average length of pause intervals
- **Total Pause Time**: Sum of all pause durations
- **Pause Frequency**: Percentage of intervals classified as pauses

**Cognitive Load Interpretation**:
- **Low Load**: Few pauses, quick recovery after pauses
- **Medium Load**: Moderate pause frequency, longer thinking periods
- **High Load**: Frequent pauses, extended thinking time

**Example**:
```
Pause Count: 8
Mean Pause Duration: 612 ms
Total Pause Time: 4896 ms
Pause Frequency: 18.5%
Threshold: 245 ms
```

### 6. **Error and Correction-Related Features**

**Metrics Extracted**:

#### Typing Accuracy
- **Total Errors**: Sum of character mismatches and length differences
- **Error Rate**: Percentage of errors relative to prompt length
  $$\text{Error Rate} = \frac{\text{Total Errors}}{\text{Prompt Length}} \times 100\%$$
- **Typing Accuracy**: Inverse of error rate
  $$\text{Accuracy} = 100\% - \text{Error Rate}$$

#### Correction Behavior
- **Correction Count**: Number of backspace key presses
- **Error Positions**: List of character indices where errors occurred

**Performance Degradation Under Load**:
```
Low Load Accuracy: 95%
High Load Accuracy: 78%
Degradation: 17%
```

### 7. **Keystroke Statistics**

**Count Metrics**:
- **Total Keystrokes**: All keyboard events (keydown + keyup pairs)
- **Keydown Count**: Number of key presses
- **Shift Key Usage**: Count of modifier key presses
- **Backspace Usage**: Count of error corrections
- **Space Key Usage**: Word separation frequency
- **Unique Keys**: Number of distinct keys used
- **Typed Character Count**: Length of actual output

**Behavioral Insights**:
- High backspace usage correlates with cognitive load
- Shift key usage patterns can reveal stress
- Unique key count indicates vocabulary complexity

## Baseline Normalization

### Rationale

Individual typing styles vary significantly. To compare keystroke dynamics across cognitive load conditions while controlling for individual differences:

1. **Establish Baseline**: Use low cognitive load session as baseline
2. **Calculate Deviation**: Compute percentage change from baseline
3. **Normalize Metrics**: Apply normalization formula

### Normalization Formula

$$\text{Normalized Metric} = \frac{\text{Current Value} - \text{Baseline Value}}{\text{Baseline Value}} \times 100\%$$

### Interpretation

- **Positive Values**: Metric increased under cognitive load (e.g., +25% longer flight times)
- **Negative Values**: Metric decreased under cognitive load (e.g., -15% slower speed)
- **Near Zero**: No significant change from baseline

### Example Normalized Comparison

```
Metric                  | Low Load | High Load | Normalized Change
------------------------+-----------+-----------+------------------
Mean Hold Time (ms)     | 78.5      | 92.3      | +17.6%
Mean Flight Time (ms)   | 134.2     | 198.5     | +47.9%
WPM                     | 60.0      | 45.2      | -24.7%
Error Rate (%)          | 2.5       | 8.3       | +232%
Regularity (%)          | 78.5      | 42.1      | -46.4%
```

## Session-Level Analysis

### Aggregation Strategy

For each typing session:
1. Extract raw keystroke events
2. Calculate all feature categories
3. Compute aggregate statistics
4. Store with session metadata

### Data Structure

```json
{
  "sessionId": "user-123_session_1709552345",
  "features": {
    "keyHoldTimes": {
      "mean": 78.5,
      "stdDev": 12.3,
      "median": 76.2,
      "min": 45,
      "max": 150,
      "count": 2847
    },
    "flightTimes": {
      "mean": 134.2,
      "stdDev": 58.7,
      ...
    },
    "typingSpeed": {
      "wpm": 60.0,
      "cpm": 450.0,
      "duration": 45.2,
      "keyCount": 2847
    },
    "errorMetrics": {
      "totalErrors": 12,
      "errorRate": 2.5,
      "corrections": 8,
      "typingAccuracy": 97.5
    },
    ...
  }
}
```

## Feature Extensions and Future Enhancements

### Proposed Extensions

#### 1. **Key-Specific Timing Analysis**
- Hold times per key (e.g., shift key patterns)
- Flight times between specific key pairs
- Detect awkward key combination patterns

#### 2. **Digraph Analysis**
- Common two-key sequences (digraphs)
- Timing patterns for frequent digraphs
- Detect stress in common transitions

#### 3. **Pressure and Velocity Patterns** (with advanced hardware)
- Key press pressure magnitude
- Acceleration/deceleration of press
- Force variability as cognitive load indicator

#### 4. **Error Pattern Analysis**
- Sequential error patterns
- Recovery time after errors
- Correction efficiency metrics

#### 5. **Cognitive Load Signatures**
- Multi-variate pattern recognition
- Machine learning classifiers for load detection
- Real-time cognitive state assessment

## Backend Endpoints

### Extract Keystroke Features
**GET** `/api/keystroke-features/analyze/<session_id>`

Returns comprehensive keystroke features for a single session.

**Response**:
```json
{
  "sessionId": "...",
  "features": { /* all metrics */ },
  "cognitiveLoadLevel": "high",
  "duration": 45.2
}
```

### Compare Features (Baseline Normalization)
**POST** `/api/keystroke-features/compare`

Compares current session against baseline with normalization.

**Request**:
```json
{
  "currentSessionId": "...",
  "baselineSessionId": "..."
}
```

**Response**:
```json
{
  "currentFeatures": { /* metrics */ },
  "baselineFeatures": { /* metrics */ },
  "normalizedFeatures": { /* percentage changes */ }
}
```

### Get User Features
**GET** `/api/keystroke-features/user/<user_id>`

Returns keystroke features for all sessions of a user.

## Usage in Research and Applications

### Educational Settings
- Monitor student cognitive load during exams
- Detect cheating through typing pattern anomalies
- Provide real-time assistance when cognitive load is high

### Workplace Monitoring
- Assess employee task complexity and workload
- Detect stress or fatigue from typing patterns
- Optimize task scheduling based on cognitive state

### Biometric Authentication
- Continuous authentication during typing
- Detect unauthorized access through typing pattern changes
- Multi-factor authentication using keystroke dynamics

### Clinical Applications
- Detect Parkinson's disease (hand tremor patterns)
- Monitor medication effectiveness
- Assess motor control degradation over time

## References

1. Montalvao Filho, J. R., & Freitas, E. O. (2020). On the relationship between typing speed and cognitive load. Journal of Usability Studies, 15(2), 94-106.

2. Joyce, R., & Gupta, G. (1990). Identity authentication based on keystroke latencies. Communications of the ACM, 33(2), 168-176.

3. Messerman, A., Mustafić, T., & Camtepe, S. A. (2011). Keystroke dynamics with header and footer information. Biometrics and Security Technologies (ISBAST), 2011 Fifth International Symposium on IEEE.

4. Giot, R., El-Abed, M., & Rosenberger, C. (2009). GREYC keystrokes: A keystroke dynamics dataset. 15th International Conference on Image Analysis and Processing.
