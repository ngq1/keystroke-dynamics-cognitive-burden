# Cognitive Load Data Collection Guide

## Overview

This enhanced data collection system implements **three levels of cognitive load** with dual-task scenarios for keystroke dynamics research.

## Cognitive Load Task Levels

### 🟢 Low Load: Simple Typing Task
**Description:** Basic typing task with no additional cognitive burden.

**Task Design:**
- Type the provided text exactly as shown
- No secondary tasks
- Focus entirely on typing accuracy and speed

**Expected Characteristics:**
- Lower error rates
- More consistent typing rhythm
- Shorter pause durations
- Better typing fluency

**Use Case:** Baseline measurements for comparison

---

### 🟡 Medium Load: Typing + Memory Task
**Description:** Typing while maintaining a number sequence in working memory.

**Task Design:**
- Memorize a 6-digit number sequence
- Type the provided text
- Recall the number sequence after typing

**Dual-Task Component:**
- **Type:** Number Sequence Memory
- **Example:** "Remember this sequence: 472938"
- **Validation:** Participant must enter the sequence after typing

**Expected Characteristics:**
- Increased pause durations (memory retrieval)
- More variable typing rhythm
- Moderate increase in error rate
- Occasional longer inter-key intervals

**Cognitive Demands:**
- Working memory maintenance
- Task switching between typing and memory rehearsal
- Divided attention

---

### 🔴 High Load: Typing + Logic Puzzle
**Description:** Typing while simultaneously solving logic puzzles or mathematical problems.

**Task Design:**
- Read and solve a logic puzzle
- Type the provided text
- Provide the puzzle answer after typing

**Dual-Task Component:**
- **Type:** Logic Puzzle / Math Problem
- **Examples:**
  - "If A=1, B=2, C=3, what is the sum of 'CAB'?" (Answer: 6)
  - "What number comes next? 2, 4, 8, 16, __" (Answer: 32)
  - "If 5 apples cost $10, how much do 3 apples cost?" (Answer: 6)
  - "What is 15% of 200?" (Answer: 30)

**Expected Characteristics:**
- Significantly increased pause durations
- Irregular typing patterns
- Higher error rates
- More backspace usage (error corrections)
- Reduced typing speed (WPM)

**Cognitive Demands:**
- Problem-solving and reasoning
- Executive function engagement
- Significant working memory load
- Complex task switching

---

## Data Collected

### 1. Participant Information
- Auto-generated unique User ID (format: `USER_timestamp_random`)
- Demographics (age, gender, education)
- Typing habits
- **Selected cognitive load level**

### 2. Keystroke Dynamics Features
Automatically extracted from typing session:

#### Timing Features
- **Hold Time (H.x):** Duration between keydown and keyup
- **Flight Times:**
  - D1U2: Time from first key down to second key up
  - D1D2: Time from first key down to second key down
  - U1D2: Time from first key up to second key down
  - U1U2: Time from first key up to second key up

#### Behavioral Features
- **Pause Metrics:** Count, duration, and distribution of pauses (>500ms)
- **Error Corrections:** Backspace count, correction rate
- **Typing Speed:** Characters per minute (CPM), words per minute (WPM)

#### Statistical Aggregations
For each feature: mean, standard deviation, min, max

### 3. Dual-Task Performance
- **Task Type:** none, number_sequence, or logic_puzzle
- **Task Data:** The actual question/sequence presented
- **Participant Answer:** What they entered
- **Correctness:** Whether answer was correct (for analysis)

### 4. NASA-TLX Cognitive Load Assessment
Six dimensions (0-100 scale):
1. **Mental Demand:** How mentally demanding was the task?
2. **Physical Demand:** How physically demanding was the task?
3. **Temporal Demand:** How hurried or rushed was the pace?
4. **Performance:** How successful were you?
5. **Effort:** How hard did you have to work?
6. **Frustration:** How frustrated were you?

**Overall Score:** Automatically calculated average

---

## Experimental Design Recommendations

### Balanced Study Design

#### Within-Subjects Design (Recommended)
Each participant completes **all three cognitive load levels**:
1. Session 1: Low Load (baseline)
2. Session 2: Medium Load
3. Session 3: High Load

**Counterbalancing:** Randomize order to control for learning effects

**Advantages:**
- Controls for individual differences
- Requires fewer participants
- Direct comparison within each person

#### Between-Subjects Design (Alternative)
Participants randomly assigned to **one cognitive load level**:
- Group A: Low Load only
- Group B: Medium Load only
- Group C: High Load only

**Advantages:**
- No learning/fatigue effects
- Cleaner comparison
- Requires more participants

### Sample Size Recommendations

**Minimum:**
- Within-subjects: 30 participants (90 total sessions)
- Between-subjects: 30 per group (90 total participants)

**Recommended:**
- Within-subjects: 50 participants (150 total sessions)
- Between-subjects: 50 per group (150 total participants)

**Power Analysis:** For medium effect size (Cohen's d = 0.5), 80% power, α = 0.05

---

## Data Analysis Pipeline

### 1. Data Export
```bash
cd keystroke-data-collector
python export_data.py
```

**Exported Files:**
- `Keystroke_Features_*.csv` - Main analysis file with all features
- `Participants_Information_*.csv` - Demographics
- `Typing_Sessions_*.csv` - Session metadata
- `NASA_TLX_*.csv` - Cognitive load ratings
- `Keystroke_Data_*.json` - Raw keystroke events

### 2. Load Data for Analysis

```python
import pandas as pd

# Load keystroke features with cognitive load labels
df = pd.read_csv('exports/Keystroke_Features_YYYYMMDD_HHMMSS.csv', sep=';')

# Verify cognitive load levels
print(df['cognitiveLoadLevel'].value_counts())
# Expected output:
# Low       50
# Medium    50
# High      50

# Check dual-task performance
print(df.groupby('cognitiveLoadLevel')['dualTaskCorrect'].mean())
```

### 3. Feature Analysis

#### Compare Keystroke Features Across Load Levels

```python
import scipy.stats as stats

# Compare hold time across cognitive load levels
low = df[df['cognitiveLoadLevel'] == 'Low']['holdTime_mean']
medium = df[df['cognitiveLoadLevel'] == 'Medium']['holdTime_mean']
high = df[df['cognitiveLoadLevel'] == 'High']['holdTime_mean']

# ANOVA
f_stat, p_value = stats.f_oneway(low, medium, high)
print(f"Hold Time ANOVA: F={f_stat:.4f}, p={p_value:.4f}")

# Post-hoc pairwise comparisons
from scipy.stats import ttest_ind
t_low_high, p_low_high = ttest_ind(low, high)
print(f"Low vs High: t={t_low_high:.4f}, p={p_low_high:.4f}")
```

### 4. Classification Models

#### Binary Classification (Low vs High)

```python
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import MinMaxScaler
from sklearn import metrics

# Prepare data (Low vs High only)
df_binary = df[df['cognitiveLoadLevel'].isin(['Low', 'High'])].copy()
df_binary['label'] = (df_binary['cognitiveLoadLevel'] == 'High').astype(int)

# Feature columns
feature_cols = [col for col in df.columns if any(x in col for x in 
    ['holdTime', 'flightTime', 'pause', 'backspace', 'correction'])]

X = df_binary[feature_cols].values
y = df_binary['label'].values

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Scale features
scaler = MinMaxScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Train classifier
clf = RandomForestClassifier(n_estimators=200, max_depth=10, random_state=42)
clf.fit(X_train_scaled, y_train)

# Evaluate
y_pred = clf.predict(X_test_scaled)
print("Binary Classification Results:")
print(f"Accuracy: {metrics.accuracy_score(y_test, y_pred):.4f}")
print(f"F1-Score: {metrics.f1_score(y_test, y_pred):.4f}")
print("\nConfusion Matrix:")
print(metrics.confusion_matrix(y_test, y_pred))
```

#### Multi-class Classification (Low, Medium, High)

```python
from sklearn.preprocessing import LabelEncoder

# Encode labels
le = LabelEncoder()
y_multiclass = le.fit_transform(df['cognitiveLoadLevel'])

X_train, X_test, y_train, y_test = train_test_split(
    df[feature_cols].values, y_multiclass, 
    test_size=0.2, random_state=42, stratify=y_multiclass
)

# Scale and train
scaler = MinMaxScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

clf = RandomForestClassifier(n_estimators=200, max_depth=10, random_state=42)
clf.fit(X_train_scaled, y_train)

# Evaluate
y_pred = clf.predict(X_test_scaled)
print("Multi-class Classification Results:")
print(f"Accuracy: {metrics.accuracy_score(y_test, y_pred):.4f}")
print(f"F1-Score (Macro): {metrics.f1_score(y_test, y_pred, average='macro'):.4f}")
print("\nClassification Report:")
print(metrics.classification_report(y_test, y_pred, target_names=['Low', 'Medium', 'High']))
```

### 5. Correlation with NASA-TLX

```python
import seaborn as sns
import matplotlib.pyplot as plt

# Correlate keystroke features with NASA-TLX scores
nasa_features = ['mentalDemand', 'physicalDemand', 'temporalDemand', 
                 'performance', 'effort', 'frustration']

keystroke_features = ['holdTime_mean', 'pause_count', 'pause_mean', 
                      'backspaceCount', 'correctionRate']

# Compute correlations
correlations = {}
for kf in keystroke_features:
    correlations[kf] = {}
    for nf in nasa_features:
        corr, p_val = stats.pearsonr(df[kf], df[nf])
        correlations[kf][nf] = {'correlation': corr, 'p_value': p_val}

# Visualize correlation matrix
corr_matrix = pd.DataFrame({
    kf: {nf: correlations[kf][nf]['correlation'] for nf in nasa_features}
    for kf in keystroke_features
})

plt.figure(figsize=(10, 6))
sns.heatmap(corr_matrix.T, annot=True, fmt='.3f', cmap='coolwarm', center=0)
plt.title('Keystroke Features vs NASA-TLX Correlations')
plt.tight_layout()
plt.show()
```

---

## Expected Results & Hypotheses

### Hypothesis 1: Keystroke Timing Increases with Cognitive Load
**Prediction:** 
- Hold times: Low < Medium < High
- Pause durations: Low < Medium < High
- Pause frequency: Low < Medium < High

### Hypothesis 2: Error Rates Increase with Cognitive Load
**Prediction:**
- Backspace count: Low < Medium < High
- Error correction rate: Low < Medium < High

### Hypothesis 3: Typing Speed Decreases with Cognitive Load
**Prediction:**
- WPM: Low > Medium > High
- CPM: Low > Medium > High

### Hypothesis 4: NASA-TLX Correlates with Keystroke Features
**Prediction:**
- Mental Demand correlates with pause duration (r > 0.5)
- Effort correlates with error corrections (r > 0.4)
- Performance correlates negatively with pause count (r < -0.4)

### Hypothesis 5: Dual-Task Accuracy Decreases with Difficulty
**Prediction:**
- Medium task (number memory) accuracy: ~70-80%
- High task (logic puzzles) accuracy: ~50-60%
- Incorrect dual-task responses show more keystroke disruption

---

## Integration with Notebook

### Load Data into Analysis Notebook

```python
# In cognitive_burden_detection.ipynb

import pandas as pd
import numpy as np

# Load exported data
df = pd.read_csv('keystroke-data-collector/exports/Keystroke_Features_latest.csv', sep=';')

# Create labels using the labeling function
from cognitive_burden_detection import create_cognitive_load_labels

# Labels are already in the data!
df['cognitiveLoad_binary'] = (df['cognitiveLoadLevel'] == 'High').astype(int)

label_map = {'Low': 0, 'Medium': 1, 'High': 2}
df['cognitiveLoad_multiclass'] = df['cognitiveLoadLevel'].map(label_map)

print("Data loaded successfully!")
print(f"Total sessions: {len(df)}")
print(f"Cognitive load distribution:")
print(df['cognitiveLoadLevel'].value_counts())
```

---

## Validation & Quality Control

### Data Quality Checks

```python
# Check for missing values
print("Missing values per column:")
print(df.isnull().sum())

# Check for outliers in timing features
for col in ['holdTime_mean', 'pause_mean', 'duration']:
    Q1 = df[col].quantile(0.25)
    Q3 = df[col].quantile(0.75)
    IQR = Q3 - Q1
    outliers = ((df[col] < (Q1 - 1.5 * IQR)) | (df[col] > (Q3 + 1.5 * IQR))).sum()
    print(f"{col}: {outliers} outliers detected")

# Verify dual-task data
print("\nDual-task completion rates:")
print(df.groupby('cognitiveLoadLevel')['dualTaskAnswer'].apply(lambda x: (x != '').mean()))
```

---

## Publication-Ready Visualizations

### Figure 1: Keystroke Features Across Cognitive Load Levels

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, axes = plt.subplots(2, 3, figsize=(15, 10))
features = ['holdTime_mean', 'pause_mean', 'pause_count', 
            'backspaceCount', 'correctionRate', 'duration']
titles = ['Hold Time (ms)', 'Pause Duration (ms)', 'Pause Count',
          'Backspace Count', 'Correction Rate', 'Task Duration (s)']

for ax, feature, title in zip(axes.flat, features, titles):
    sns.boxplot(data=df, x='cognitiveLoadLevel', y=feature, 
                order=['Low', 'Medium', 'High'], ax=ax)
    ax.set_title(title)
    ax.set_xlabel('Cognitive Load Level')
    ax.set_ylabel('')

plt.tight_layout()
plt.savefig('cognitive_load_features.png', dpi=300, bbox_inches='tight')
plt.show()
```

### Figure 2: Classification Performance Comparison

```python
# After training multiple models
models = ['LogReg', 'RF', 'XGB', 'SVM', 'MLP']
accuracies = [...]  # From your results

plt.figure(figsize=(10, 6))
plt.bar(models, accuracies)
plt.xlabel('Classification Model')
plt.ylabel('Accuracy')
plt.title('Cognitive Load Classification Performance')
plt.ylim([0, 1])
plt.axhline(y=0.5, color='r', linestyle='--', label='Chance Level')
plt.legend()
plt.tight_layout()
plt.savefig('model_comparison.png', dpi=300, bbox_inches='tight')
plt.show()
```

---

## Troubleshooting

### Issue: Participants Not Completing Dual-Task
**Solution:** Add clearer instructions and validation before submission

### Issue: Low Variance in Cognitive Load
**Solution:** Adjust task difficulty - use harder puzzles for High load

### Issue: Too Many Errors in High Load
**Solution:** Acceptable - this is expected behavior under high cognitive load

### Issue: No Significant Differences Between Levels
**Possible Causes:**
1. Sample size too small (increase to 50+ per group)
2. Tasks not sufficiently different in difficulty
3. Participants too experienced with typing
4. Need to control for individual typing skill

---

## References & Further Reading

1. **NASA-TLX:** Hart, S. G., & Staveland, L. E. (1988). Development of NASA-TLX
2. **Keystroke Dynamics:** Monrose, F., & Rubin, A. D. (2000). Keystroke dynamics as a biometric
3. **Cognitive Load Theory:** Sweller, J. (1988). Cognitive load during problem solving
4. **Dual-Task Paradigm:** Pashler, H. (1994). Dual-task interference in simple tasks

---

## Contact & Support

For questions or issues with the data collection system:
1. Check this guide first
2. Review the main README.md
3. Check browser console for errors
4. Verify backend is running on port 5000
5. Verify frontend is accessible on port 3000

**System Requirements:**
- Python 3.8+
- Flask 3.0+
- Modern web browser (Chrome, Firefox, Edge)
- Stable internet connection

---

## Citation

If you use this system in your research, please cite:

```
Cognitive Load Detection through Keystroke Dynamics
Data Collection System v2.0
VGTU Master Thesis Research, 2025
```
