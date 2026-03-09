# Cognitive Burden Labeling and Validation Framework

## Overview

This document describes the comprehensive cognitive burden detection and labeling framework implemented in the Keystroke Dynamics Data Collector. The framework collects and validates cognitive burden labels immediately after each typing task, ensuring alignment between induced cognitive load and participant perception.

## Framework Components

### 1. **Subjective Self-Report Measures: NASA Task Load Index (NASA-TLX)**

The NASA-TLX form is administered after each typing task to capture the participant's subjective perception of workload across six dimensions:

- **Mental Demand**: Cognitive intensity required for the task
- **Physical Demand**: Physical effort required for the task
- **Temporal Demand**: Time pressure and pacing
- **Performance**: Self-assessment of success in completing the task
- **Effort**: How hard the participant had to work
- **Frustration**: Emotional state (stress, annoyance, irritation)

**Implementation**: `NasaTLXForm.js` component collects ratings on a 0-100 scale for each dimension.

**Composite Score**: Average of all six dimensions provides an overall cognitive load perception score (0-100).

### 2. **Task Performance Indicators**

Objective measures derived from actual typing and secondary task performance during the experiment:

#### Typing Performance Metrics
- **Typing Accuracy**: Character-level accuracy (%) comparing typed text to the prompt
- **Error Rate**: Percentage of incorrectly typed characters
- **Words Per Minute (WPM)**: Typing speed adjusted for cognitive load effects
- **Consistency Score**: Stability of keystroke timing patterns (affected by cognitive load)

#### Secondary Task Performance
- **Secondary Task Accuracy**: Percentage of correctly answered concurrent task questions/arithmetic
- **Task Completion Rate**: Number of secondary tasks addressed vs. total presented
- **Response Time**: Duration to answer secondary tasks (indicates attention division)

**Implementation**: `TypingInterface.js` computes these metrics during typing task execution and stores responses for secondary task questions.

### 3. **Task Complexity Scores (Experimental Design)**

Pre-determined complexity levels assigned based on the induced cognitive load condition:

- **Low Cognitive Load**: Complexity Score = 20/100
  - Minimal secondary tasks
  - Simple reading-to-typing task
  - No external interruptions
  
- **Medium Cognitive Load**: Complexity Score = 50/100
  - Moderate secondary task load (simple questions)
  - More complex text material
  - Scheduled interruptions (~every 6-8 seconds)
  
- **High Cognitive Load**: Complexity Score = 85/100
  - Complex secondary tasks (arithmetic, recall, listing)
  - Challenging text material
  - Frequent interruptions (~every 60 seconds)

**Implementation**: Defined in `CognitiveBurdenLabeling.js`, mapped from the induced cognitive load level.

## Label Generation Process

### Step 1: Metric Calculation
When a typing task is completed, the system calculates:
1. Typing accuracy and error rate
2. Secondary task accuracy
3. Words per minute
4. Consistency score
5. NASA-TLX composite score

### Step 2: Load Classification
Based on NASA-TLX score (0-100):
- **Low Perceived Load**: NASA-TLX < 35
- **Medium Perceived Load**: NASA-TLX 35-65
- **High Perceived Load**: NASA-TLX > 65

### Step 3: Performance Level Assessment
Categorized based on overall accuracy:
- **Excellent**: ≥85% average accuracy
- **Good**: 70-84% average accuracy
- **Fair**: 55-69% average accuracy
- **Poor**: <55% average accuracy

### Step 4: Cognitive Burden Label Assignment
Combined classification based on typing accuracy and NASA-TLX score:

| Typing Accuracy | NASA-TLX Score | Label |
|---|---|---|
| <70% | >60 | **High Burden** |
| <75% | 50-60 | **Moderate Burden** |
| ≥80% | <50 | **Low Burden** |
| Other | Other | **Moderate Burden** |

## Alignment Validation

### Alignment Checks
The system validates the alignment between:
- **Induced Load** (experimental condition assigned by researchers)
- **Perceived Load** (participant's self-rated cognitive load)

**Alignment Status**:
- **Aligned**: Induced and perceived loads match (low-low, medium-medium, high-high)
- **Over-Perceived**: Participant perceived higher load than induced
- **Under-Perceived**: Participant perceived lower load than induced

### Validation Report
For each session, a validation report is generated indicating:
- Whether alignment is achieved
- Performance level adequacy
- Identified issues (mismatches, performance degradation)
- Recommendations for task adjustments

**Example**:
```
Validation Status: Passed ✓
Alignment: Aligned (High-High)
Performance Level: Good (82% accuracy)
Secondary Task Accuracy: 75%
NASA-TLX Score: 68/100
Issues: None
```

## Data Collection and Storage

### Frontend Data Flow

1. **Participant Registration** → Collect demographics
2. **Typing Task** → Record keystroke dynamics, typing metrics, secondary task responses
3. **NASA-TLX Form** → Collect subjective workload ratings
4. **Cognitive Burden Labeling** → Automatic label generation and validation
5. **Summary** → Display complete session results with labels

### Backend Storage Structure

#### cognitive_burden_labels.json
```json
{
  "userId": "user-12345",
  "sessionId": "session-uuid",
  "cognitiveLoadLevel": "high",
  "labels": {
    "inducedCognitiveLoad": "high",
    "perceivedCognitiveLoad": "high",
    "performanceLevel": "good",
    "taskComplexityScore": 85,
    "cognitiveLoadAlignment": "aligned",
    "overallBurdenLabel": "moderate-burden",
    "metrics": {
      "typingAccuracy": 78.5,
      "errorRate": 21.5,
      "wordsPerMinute": 45.2,
      "secondaryTaskAccuracy": 75.0,
      "consistencyScore": 75
    },
    "nasaTLXScore": 65.8,
    "timestamp": "2026-03-04T12:34:56Z"
  },
  "validationReport": {
    "isValid": true,
    "alignment": "aligned",
    "performanceLevel": "good",
    "nasaTLXScore": 65.8,
    "taskComplexity": 85,
    "issues": [],
    "recommendations": []
  }
}
```

## API Endpoints

### Submit Cognitive Burden Labels
**POST** `/api/cognitive-burden-labels/submit`

Request body:
```json
{
  "userId": "user-12345",
  "sessionId": "session-uuid",
  "cognitiveLoadLevel": "high",
  "labels": { /* label object */ },
  "validationReport": { /* report object */ },
  "timestamp": "2026-03-04T12:34:56Z"
}
```

### Retrieve Labels by Session
**GET** `/api/cognitive-burden-labels/<session_id>`

### Retrieve All Labels for User
**GET** `/api/cognitive-burden-labels/user/<user_id>`

## Label Interpretation

### For Researchers
- **Alignment Status** indicates whether induced cognitive load was successfully perceived by participants
- **Performance Degradation** under cognitive load validates the manipulations
- **Labels** provide objective classification for machine learning model training

### For Participants
- **Burden Label** provides feedback on perceived cognitive load during the task
- **Performance Level** shows typing and task-solving accuracy
- **Validation Status** confirms task difficulty was appropriate

## Key Features

✅ **Real-time Label Generation**: Labels are created immediately after each task

✅ **Comprehensive Metrics**: Combines subjective and objective measures

✅ **Validation Framework**: Checks alignment between induced and perceived loads

✅ **Performance Tracking**: Detailed metrics for analysis

✅ **User-Friendly Display**: Clear presentation in summary view

✅ **Backend Integration**: Persistent storage with query APIs

## Future Enhancements

1. **Advanced Keystroke Analysis**: Implement detailed timing variability analysis for consistency scoring
2. **Machine Learning Models**: Use labeled data to train cognitive burden classifiers
3. **Real-time Adaptation**: Adjust task difficulty during sessions based on performance
4. **Comparative Analysis**: Track changes in labels across multiple sessions
5. **Statistical Validation**: Implement inter-rater reliability checks for label consistency

## References

Hart, S. G., & Staveland, L. E. (1988). Development of NASA-TLX (Task Load Index): Results of empirical and theoretical research. In P. A. Hancock & N. Meshkati (Eds.), Human mental workload, 139-183.

Cogniton, T. & Dynamics, K. (2026). Keystroke dynamics for cognitive burden detection in educational and workplace settings.
