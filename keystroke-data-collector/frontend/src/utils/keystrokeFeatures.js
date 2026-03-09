/**
 * Keystroke Dynamics Feature Extraction
 * 
 * Comprehensive keystroke feature analysis including:
 * - Key hold time and flight time metrics
 * - Typing speed and rhythm indicators
 * - Pause duration and frequency
 * - Error and correction-related features
 * 
 * Features are normalized against participant-specific baselines
 */

/**
 * Extract keystroke metrics from raw keystroke events
 * @param {Array} keystrokesData - Array of keystroke events with timestamp
 * @param {string} typedText - The actual text typed by user
 * @param {string} promptText - The target text to type
 * @returns {Object} Comprehensive keystroke metrics
 */
export function extractKeystrokeFeatures(keystrokesData, typedText, promptText) {
  if (!keystrokesData || keystrokesData.length === 0) {
    return getEmptyFeatures();
  }

  // Core metrics
  const metrics = {
    // Key Hold Time Metrics
    keyHoldTimes: calculateKeyHoldTimes(keystrokesData),
    
    // Flight Time Metrics (inter-keystroke interval)
    flightTimes: calculateFlightTimes(keystrokesData),
    
    // Typing Speed Indicators
    typingSpeed: calculateTypingSpeed(keystrokesData, typedText),
    
    // Rhythm and Regularity
    rhythmMetrics: calculateRhythmMetrics(keystrokesData),
    
    // Pause Analysis
    pauses: analyzePauses(keystrokesData),
    
    // Error and Correction Features
    errorMetrics: calculateErrorMetrics(typedText, promptText, keystrokesData),
    
    // Keystroke Statistics
    keystrokeStats: calculateKeystrokeStats(keystrokesData, typedText),
  };

  return metrics;
}

/**
 * Calculate key hold times (dwell time)
 * Time between keydown and corresponding keyup
 */
function calculateKeyHoldTimes(keystrokesData) {
  const keyMap = new Map(); // Map of key to keydown timestamp

  const holdTimes = [];

  for (const event of keystrokesData) {
    if (event.type === 'keydown') {
      keyMap.set(event.key, event.timestamp);
    } else if (event.type === 'keyup' && keyMap.has(event.key)) {
      const downTime = keyMap.get(event.key);
      const holdTime = event.timestamp - downTime;
      if (holdTime >= 0) {
        holdTimes.push(holdTime);
      }
      keyMap.delete(event.key);
    }
  }

  return {
    values: holdTimes,
    mean: holdTimes.length > 0 ? holdTimes.reduce((a, b) => a + b, 0) / holdTimes.length : 0,
    median: calculateMedian(holdTimes),
    stdDev: calculateStdDev(holdTimes),
    min: holdTimes.length > 0 ? Math.min(...holdTimes) : 0,
    max: holdTimes.length > 0 ? Math.max(...holdTimes) : 0,
    count: holdTimes.length,
  };
}

/**
 * Calculate flight times (inter-keystroke intervals)
 * Time between keyup of one key and keydown of next
 */
function calculateFlightTimes(keystrokesData) {
  let lastUpTime = null;
  const flightTimes = [];

  for (const event of keystrokesData) {
    if (event.type === 'keydown' && lastUpTime !== null) {
      const flightTime = event.timestamp - lastUpTime;
      if (flightTime >= 0) {
        flightTimes.push(flightTime);
      }
    }
    if (event.type === 'keyup') {
      lastUpTime = event.timestamp;
    }
  }

  return {
    values: flightTimes,
    mean: flightTimes.length > 0 ? flightTimes.reduce((a, b) => a + b, 0) / flightTimes.length : 0,
    median: calculateMedian(flightTimes),
    stdDev: calculateStdDev(flightTimes),
    min: flightTimes.length > 0 ? Math.min(...flightTimes) : 0,
    max: flightTimes.length > 0 ? Math.max(...flightTimes) : 0,
    count: flightTimes.length,
  };
}

/**
 * Calculate typing speed metrics
 */
function calculateTypingSpeed(keystrokesData, typedText) {
  if (!keystrokesData || keystrokesData.length === 0) {
    return { wpm: 0, cpm: 0, duration: 0 };
  }

  const firstEvent = keystrokesData[0];
  const lastEvent = keystrokesData[keystrokesData.length - 1];
  const duration = (lastEvent.timestamp - firstEvent.timestamp) / 1000; // Convert to seconds

  const wordCount = typedText ? typedText.trim().split(/\s+/).length : 0;
  const charCount = typedText ? typedText.length : 0;

  return {
    wpm: duration > 0 ? ((wordCount / duration) * 60).toFixed(2) : 0,
    cpm: duration > 0 ? ((charCount / duration) * 60).toFixed(2) : 0,
    duration: duration.toFixed(2),
    keyCount: keystrokesData.length,
  };
}

/**
 * Calculate rhythm and regularity metrics
 */
function calculateRhythmMetrics(keystrokesData) {
  // Get all interval times (combined hold + flight times)
  const intervals = [];
  let lastTime = null;

  for (const event of keystrokesData) {
    if (lastTime !== null) {
      intervals.push(event.timestamp - lastTime);
    }
    lastTime = event.timestamp;
  }

  const stdDev = calculateStdDev(intervals);
  const mean = intervals.length > 0 ? intervals.reduce((a, b) => a + b, 0) / intervals.length : 0;

  // Rhythm regularity: inverse of coefficient of variation
  const coefficientOfVariation = mean > 0 ? (stdDev / mean) : 0;
  const rhythmRegularity = Math.max(0, (1 - coefficientOfVariation) * 100).toFixed(2); // 0-100%

  return {
    meanInterval: mean.toFixed(2),
    stdDevInterval: stdDev.toFixed(2),
    coefficientOfVariation: coefficientOfVariation.toFixed(3),
    rhythmRegularity: rhythmRegularity, // Higher = more regular
  };
}

/**
 * Analyze pause patterns
 * Pauses defined as intervals significantly longer than typical inter-keystroke time
 */
function analyzePauses(keystrokesData) {
  // Calculate inter-keystroke intervals
  const intervals = [];
  let lastTime = null;

  for (const event of keystrokesData) {
    if (lastTime !== null) {
      intervals.push(event.timestamp - lastTime);
    }
    lastTime = event.timestamp;
  }

  if (intervals.length === 0) {
    return {
      pauseCount: 0,
      pauseDurations: [],
      meanPauseDuration: 0,
      totalPauseTime: 0,
      pauseFrequency: 0,
    };
  }

  // Pause threshold: 1.5x the 75th percentile of intervals
  const sortedIntervals = [...intervals].sort((a, b) => a - b);
  const q75 = sortedIntervals[Math.floor(sortedIntervals.length * 0.75)];
  const pauseThreshold = q75 * 1.5;

  const pauseDurations = intervals.filter(i => i > pauseThreshold);
  const pauseCount = pauseDurations.length;
  const totalPauseTime = pauseDurations.reduce((a, b) => a + b, 0);
  const meanPauseDuration = pauseCount > 0 ? totalPauseTime / pauseCount : 0;

  return {
    pauseCount,
    pauseDurations,
    meanPauseDuration: meanPauseDuration.toFixed(2),
    totalPauseTime: totalPauseTime.toFixed(2),
    pauseFrequency: (pauseCount / intervals.length * 100).toFixed(2), // Percentage of intervals that are pauses
    pauseThreshold: pauseThreshold.toFixed(2),
  };
}

/**
 * Calculate error and correction features
 */
function calculateErrorMetrics(typedText, promptText, keystrokesData) {
  if (!typedText || !promptText) {
    return {
      totalErrors: 0,
      errorRate: 0,
      corrections: 0,
      errorPositions: [],
    };
  }

  // Character-level error detection
  const errors = [];
  const minLength = Math.min(typedText.length, promptText.length);

  for (let i = 0; i < minLength; i++) {
    if (typedText[i] !== promptText[i]) {
      errors.push(i);
    }
  }

  // Additional length-based errors
  const lengthDiff = Math.abs(typedText.length - promptText.length);
  const totalErrors = errors.length + lengthDiff;

  // Correction detection (simple heuristic: look for backspace events)
  const backspaceCount = keystrokesData.filter(k => k.key === 'Backspace').length;

  return {
    totalErrors,
    errorRate: ((totalErrors / promptText.length) * 100).toFixed(2),
    errorPositions: errors,
    corrections: backspaceCount,
    typingAccuracy: ((1 - totalErrors / promptText.length) * 100).toFixed(2),
  };
}

/**
 * Calculate keystroke statistics
 */
function calculateKeystrokeStats(keystrokesData, typedText) {
  const keydownCount = keystrokesData.filter(k => k.type === 'keydown').length;
  const keyupCount = keystrokesData.filter(k => k.type === 'keyup').length;

  // Special key analysis
  const shiftKeyCount = keystrokesData.filter(k => k.shiftKey).length;
  const ctrlKeyCount = keystrokesData.filter(k => k.ctrlKey).length;
  const backspaceCount = keystrokesData.filter(k => k.key === 'Backspace').length;
  const spaceCount = keystrokesData.filter(k => k.key === ' ').length;

  return {
    totalKeystrokes: keystrokesData.length,
    keydownCount,
    keyupCount,
    shiftKeyCount,
    ctrlKeyCount,
    backspaceCount,
    spaceCount,
    typedCharCount: typedText ? typedText.length : 0,
    uniqueKeys: new Set(keystrokesData.map(k => k.key)).size,
  };
}

/**
 * Normalize features relative to baseline
 * Baseline is typically the low cognitive load session or user's average
 */
export function normalizeFeatures(currentFeatures, baselineFeatures) {
  if (!baselineFeatures) {
    return currentFeatures; // Return unnormalized if no baseline
  }

  const normalized = {
    keyHoldTime: {
      meanNormalized: normalizeMetric(
        currentFeatures.keyHoldTimes.mean,
        baselineFeatures.keyHoldTimes.mean
      ),
      stdDevNormalized: normalizeMetric(
        currentFeatures.keyHoldTimes.stdDev,
        baselineFeatures.keyHoldTimes.stdDev
      ),
    },
    flightTime: {
      meanNormalized: normalizeMetric(
        currentFeatures.flightTimes.mean,
        baselineFeatures.flightTimes.mean
      ),
      stdDevNormalized: normalizeMetric(
        currentFeatures.flightTimes.stdDev,
        baselineFeatures.flightTimes.stdDev
      ),
    },
    typingSpeed: {
      wpmNormalized: normalizeMetric(
        parseFloat(currentFeatures.typingSpeed.wpm),
        parseFloat(baselineFeatures.typingSpeed.wpm)
      ),
      cpmNormalized: normalizeMetric(
        parseFloat(currentFeatures.typingSpeed.cpm),
        parseFloat(baselineFeatures.typingSpeed.cpm)
      ),
    },
    rhythm: {
      regularityNormalized: normalizeMetric(
        parseFloat(currentFeatures.rhythmMetrics.rhythmRegularity),
        parseFloat(baselineFeatures.rhythmMetrics.rhythmRegularity)
      ),
    },
    pauses: {
      pauseCountNormalized: normalizeMetric(
        currentFeatures.pauses.pauseCount,
        baselineFeatures.pauses.pauseCount
      ),
      pauseDurationNormalized: normalizeMetric(
        parseFloat(currentFeatures.pauses.meanPauseDuration),
        parseFloat(baselineFeatures.pauses.meanPauseDuration)
      ),
    },
    errors: {
      errorRateNormalized: normalizeMetric(
        parseFloat(currentFeatures.errorMetrics.errorRate),
        parseFloat(baselineFeatures.errorMetrics.errorRate)
      ),
      correctionNormalized: normalizeMetric(
        currentFeatures.errorMetrics.corrections,
        baselineFeatures.errorMetrics.corrections
      ),
    },
  };

  return normalized;
}

/**
 * Normalize a metric: (current - baseline) / baseline
 * Positive value = increase from baseline
 * Negative value = decrease from baseline
 * Returns percentage change
 */
function normalizeMetric(current, baseline) {
  if (baseline === 0 || baseline === null || baseline === undefined) {
    return 0;
  }
  const change = ((current - baseline) / baseline) * 100;
  return isFinite(change) ? parseFloat(change.toFixed(2)) : 0;
}

/**
 * Helper: Calculate median
 */
function calculateMedian(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Helper: Calculate standard deviation
 */
function calculateStdDev(values) {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Get empty features object (for initialization)
 */
function getEmptyFeatures() {
  return {
    keyHoldTimes: {
      values: [],
      mean: 0,
      median: 0,
      stdDev: 0,
      min: 0,
      max: 0,
      count: 0,
    },
    flightTimes: {
      values: [],
      mean: 0,
      median: 0,
      stdDev: 0,
      min: 0,
      max: 0,
      count: 0,
    },
    typingSpeed: { wpm: 0, cpm: 0, duration: 0, keyCount: 0 },
    rhythmMetrics: {
      meanInterval: 0,
      stdDevInterval: 0,
      coefficientOfVariation: 0,
      rhythmRegularity: 0,
    },
    pauses: {
      pauseCount: 0,
      pauseDurations: [],
      meanPauseDuration: 0,
      totalPauseTime: 0,
      pauseFrequency: 0,
    },
    errorMetrics: {
      totalErrors: 0,
      errorRate: 0,
      corrections: 0,
      errorPositions: [],
      typingAccuracy: 0,
    },
    keystrokeStats: {
      totalKeystrokes: 0,
      keydownCount: 0,
      keyupCount: 0,
      shiftKeyCount: 0,
      ctrlKeyCount: 0,
      backspaceCount: 0,
      spaceCount: 0,
      typedCharCount: 0,
      uniqueKeys: 0,
    },
  };
}

/**
 * Generate summary statistics from keystroke features
 */
export function generateFeatureSummary(features) {
  return {
    typingSpeed: {
      wpm: features.typingSpeed.wpm,
      cpm: features.typingSpeed.cpm,
    },
    keyTiming: {
      avgHoldTime: features.keyHoldTimes.mean.toFixed(0),
      avgFlightTime: features.flightTimes.mean.toFixed(0),
    },
    rhythm: {
      regularity: features.rhythmMetrics.rhythmRegularity,
      consistency: (100 - parseFloat(features.rhythmMetrics.coefficientOfVariation) * 100)
        .toFixed(2),
    },
    pauses: {
      count: features.pauses.pauseCount,
      avgDuration: features.pauses.meanPauseDuration,
      frequency: features.pauses.pauseFrequency,
    },
    accuracy: {
      typing: features.errorMetrics.typingAccuracy,
      errorRate: features.errorMetrics.errorRate,
      corrections: features.errorMetrics.corrections,
    },
  };
}
