# Cognitive Burden Detection - Implementation Guide

This document outlines the implementation phases for adapting EmoSurv for cognitive burden detection using keystroke dynamics.

## Overview

The adaptation involves four main phases:
1. **Data Structure & Labeling Framework** - Replace emotion labels with cognitive load measures
2. **Feature Extraction** - Capture keystroke features sensitive to cognitive demands
3. **Model Pipeline Extension** - Implement cognitive burden prediction models
4. **Baseline Experiments** - Evaluate model performance with confusion matrices

---

## Phase 1: Data Structure & Labeling Framework

### 1.1 Cognitive Load Measures

Replace emotion labels (N, H, C, S, A) with validated cognitive load measures:

#### NASA-TLX (Task Load Index)
- **Subjective self-report** on 0-100 scale
- Six dimensions:
  - Mental Demand
  - Physical Demand
  - Temporal Demand
  - Performance
  - Effort
  - Frustration
- **Collection**: After each typing task session
- **Usage**: Convert to discrete levels (Low, Medium, High) using percentiles

#### Dual-Task Performance Metrics
- **Primary task accuracy**: Typing task performance
- **Secondary task accuracy**: Memory/calculation task performance
- **Task interference score**: Difference between single-task and dual-task performance

#### Task Complexity Scores
- **Low**: Simple typing task (baseline)
- **Medium**: Typing with simple distraction (e.g., remember number sequence)
- **High**: Typing with complex multi-tasking (e.g., solve logic puzzles while typing)

### 1.2 Label Mapping Strategy

**Binary Classification:**
- Low vs High cognitive load
- Threshold: Median NASA-TLX score or task complexity-based

**Multi-Class Classification:**
- Low, Medium, High cognitive load
- Thresholds: 33rd and 67th percentiles of NASA-TLX scores

### 1.3 Implementation

See `cognitive_burden_detection.ipynb` for the `create_cognitive_load_labels()` function that:
- Accepts NASA-TLX scores or task complexity levels
- Creates binary and multi-class labels
- Stores raw scores for analysis

---

## Phase 2: Feature Extraction

### 2.1 Keystroke Features (Same as EmoSurv)

All features from EmoSurv are retained as they are sensitive to both emotional and cognitive demands:

#### Hold Time (H.x)
- **D1U1**: Time a key is pressed down
- **Mean and standard deviation** per typing session

#### Flight Time
- **D1U2**: Time between key down events
- **D1D2**: Time between consecutive key presses
- **U1D2**: Time from key release to next key press
- **U1U2**: Time between key release events
- **Mean and standard deviation** for each metric

#### Error/Correction Rates
- **Edit Distance**: Number of typos compared to target text
- **Deletion Frequency**: Number of backspace/delete keystrokes
- **Correction Rate**: Ratio of corrections to total keystrokes

#### Typing Speed
- **Characters Per Minute (CPM)**: Total characters / time in minutes
- **Words Per Minute (WPM)**: Total words / time in minutes

#### Pause Duration and Frequency
- **Pause Count**: Number of pauses > threshold (e.g., 500ms)
- **Mean Pause Duration**: Average pause length
- **Max Pause Duration**: Longest pause in session
- **Pause Frequency**: Pauses per minute

### 2.2 Implementation

The notebook includes:
- `extract_pause_features()`: Extracts pause-related metrics
- `extract_typing_speed()`: Calculates CPM and WPM
- Existing feature extraction from EmoSurv (hold time, flight time, edit distance)

---

## Phase 3: Model Pipeline Extension

### 3.1 Models to Implement

#### Random Forest
- **Use case**: Tabular feature classification
- **Advantages**: Handles non-linear relationships, feature importance
- **Configuration**: 200 estimators, max_depth=10

#### Support Vector Machine (SVM)
- **Use case**: Binary and multi-class classification
- **Kernel**: RBF (Radial Basis Function)
- **Advantages**: Good for high-dimensional data

#### XGBoost
- **Use case**: Tabular features with gradient boosting
- **Advantages**: High performance, handles missing values
- **Configuration**: Binary logistic or multi-class softmax

#### Long Short-Term Memory (LSTM)
- **Use case**: Sequence patterns in keystroke timing
- **Architecture**: 
  - LSTM(128) → Dropout(0.2) → LSTM(64) → Dropout(0.2) → Dense(32) → Output
- **Input**: Sequences of keystroke timing features
- **Note**: Requires sequence preparation from raw keystroke data

### 3.2 Model Configuration

**Binary Classification:**
- Objective: Binary logistic (XGBoost) or binary crossentropy (LSTM)
- Evaluation: Accuracy, Precision, Recall, F1-score

**Multi-Class Classification:**
- Objective: Multi-class softmax
- Evaluation: Accuracy, Macro-averaged Precision/Recall/F1

### 3.3 Implementation

See `cognitive_burden_detection.ipynb` for:
- Model definitions for binary and multi-class classification
- LSTM model creation function
- Evaluation functions with confusion matrices

---

## Phase 4: Baseline Experiments & Evaluation

### 4.1 Experimental Design

#### Task Design for Varying Cognitive Load

**Low Cognitive Load:**
- Simple typing task
- No distractions
- Familiar text
- Single task focus

**Medium Cognitive Load:**
- Typing with simple distraction
- Example: Remember a 7-digit number sequence, then type paragraph
- Dual-task interference

**High Cognitive Load:**
- Typing with complex multi-tasking
- Example: Solve arithmetic problems while typing
- Example: Remember and recall word lists while typing
- High cognitive demand

### 4.2 Evaluation Metrics

#### Classification Metrics
- **Accuracy**: Overall correct predictions
- **Precision**: True positives / (True positives + False positives)
- **Recall**: True positives / (True positives + False negatives)
- **F1-Score**: Harmonic mean of precision and recall
- **Macro-Averaged F1**: Average F1 across all classes

#### Confusion Matrices
- **Binary**: Low vs High cognitive load
- **Multi-Class**: Low, Medium, High cognitive load
- **Normalized**: Show percentage of predictions per true class

### 4.3 Baseline Comparisons

1. **Low vs High Cognitive Load Sessions**
   - Compare model performance on clearly separated load levels
   - Expected: Higher accuracy for binary classification

2. **Multi-Class Performance**
   - Evaluate Low, Medium, High classification
   - Analyze confusion patterns (e.g., Medium often confused with Low/High)

3. **Feature Importance Analysis**
   - Identify which keystroke features are most predictive
   - Compare with emotion recognition feature importance

4. **Cross-Validation**
   - 10-fold cross-validation for robust performance estimates
   - Stratified sampling to maintain class distribution

### 4.4 Implementation

The notebook provides:
- Binary and multi-class classification pipelines
- Cross-validation evaluation
- Confusion matrix visualization
- Feature importance analysis

---

## Implementation Checklist

### Data Collection
- [ ] Design controlled tasks with varying cognitive load
- [ ] Collect NASA-TLX scores after each typing task
- [ ] Implement dual-task scenarios (memory, math problems)
- [ ] Record task complexity levels

### Data Preparation
- [ ] Load keystroke data (adapt from `data_analysis_fixed_text.ipynb`)
- [ ] Create cognitive load labels using `create_cognitive_load_labels()`
- [ ] Extract all keystroke features (hold time, flight time, errors, speed, pauses)
- [ ] Preprocess categorical features
- [ ] Handle missing values

### Model Training
- [ ] Split data into train/test sets (80/20, stratified)
- [ ] Scale features (MinMaxScaler or StandardScaler)
- [ ] Train binary classification models (RF, SVM, XGBoost)
- [ ] Train multi-class classification models
- [ ] Implement LSTM sequence preparation (if using LSTM)
- [ ] Fine-tune hyperparameters

### Evaluation
- [ ] Evaluate binary classification (Low vs High)
- [ ] Evaluate multi-class classification (Low, Medium, High)
- [ ] Generate confusion matrices
- [ ] Perform 10-fold cross-validation
- [ ] Analyze feature importance
- [ ] Compare model performance

### Analysis
- [ ] Statistical significance tests
- [ ] Compare with baseline emotion recognition performance
- [ ] Identify most predictive features
- [ ] Document findings

---

## File Structure

```
.
├── cognitive_burden_detection.ipynb    # Main implementation notebook
├── data_analysis_fixed_text.ipynb      # Original emotion recognition (reference)
├── data_analysis_free_text.ipynb       # Original emotion recognition (reference)
├── IMPLEMENTATION_GUIDE.md            # This file
└── data/                               # Data directory (not included)
    ├── fixed_text_typing_dataset.csv
    ├── frequency_dataset.csv
    └── participants_information.csv
```

---

## Next Steps

1. **Collect Real Data**: Replace synthetic labels with actual NASA-TLX scores or task complexity measurements
2. **Adapt Data Loading**: Modify data loading section from original notebooks to work with your cognitive load labels
3. **Implement LSTM Sequences**: Create sequence preparation function for LSTM models from raw keystroke timing data
4. **Hyperparameter Tuning**: Use grid search or random search to optimize model parameters
5. **Statistical Analysis**: Conduct significance tests and compare with emotion recognition baseline

---

## References

- **NASA-TLX**: Hart, S. G., & Staveland, L. E. (1988). Development of NASA-TLX (Task Load Index): Results of empirical and theoretical research.
- **EmoSurv Dataset**: Available at https://ieee-dataport.org/open-access/emosurv-typing-biometric-keystroke-dynamics-dataset-emotion-labels-created-using
- **Keystroke Dynamics**: Research on typing patterns and cognitive/emotional states

---

## Notes

- The current implementation uses **synthetic labels** based on typing patterns (edit distance, pauses) for demonstration
- **Replace these with real cognitive load measurements** from your experiments
- LSTM models require sequence data preparation from raw keystroke timing - this is a placeholder that needs implementation based on your data structure
- All feature extraction functions are ready to use once you have the keystroke data loaded

