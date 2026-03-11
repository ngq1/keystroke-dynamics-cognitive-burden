import React, { useState, useEffect } from 'react';
import {
  extractKeystrokeFeatures,
  normalizeFeatures,
  generateFeatureSummary,
} from '../utils/keystrokeFeatures';

/**
 * KeystrokeFeatureAnalysis Component
 * 
 * Displays detailed keystroke dynamics features including:
 * - Key hold times and flight times
 * - Typing speed and rhythm
 * - Pause analysis
 * - Error metrics
 * - Normalized comparison against baseline
 */
function KeystrokeFeatureAnalysis({
  sessionData,
  baselineData = null,
  cognitiveLoadLevel = 'low',
}) {
  const [features, setFeatures] = useState(null);
  const [normalizedFeatures, setNormalizedFeatures] = useState(null);
  const [summary, setSummary] = useState(null);
  const [expandedSection, setExpandedSection] = useState('summary');

  useEffect(() => {
    if (sessionData && sessionData.keystrokes && sessionData.textPrompt) {
      // Extract features from keystroke data
      const extracted = extractKeystrokeFeatures(
        sessionData.keystrokes,
        sessionData.typedText,
        sessionData.textPrompt
      );
      setFeatures(extracted);
      setSummary(generateFeatureSummary(extracted));

      // Normalize if baseline available
      if (baselineData) {
        const baseline = extractKeystrokeFeatures(
          baselineData.keystrokes,
          baselineData.typedText,
          baselineData.textPrompt
        );
        const normalized = normalizeFeatures(extracted, baseline);
        setNormalizedFeatures(normalized);
      }
    }
  }, [sessionData, baselineData]);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const renderFeatureSection = (title, section, content) => {
    const isExpanded = expandedSection === section;
    return (
      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={() => toggleSection(section)}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold',
            textAlign: 'left',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{title}</span>
          <span>{isExpanded ? '▼' : '▶'}</span>
        </button>
        {isExpanded && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#f8f9fa',
            borderLeft: '4px solid #667eea',
            borderRadius: '0 4px 4px 0',
            marginTop: '0.25rem',
          }}>
            {content}
          </div>
        )}
      </div>
    );
  };

  if (!features) {
    return <div style={{ padding: '1rem', color: '#999' }}>No keystroke data available</div>;
  }

  return (
    <div style={{ fontSize: '0.95rem' }}>
      {/* Summary Section */}
      {summary && renderFeatureSection(
        '📊 Feature Summary',
        'summary',
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>Typing Speed</h4>
            <div className="feature-metric">
              <strong>WPM:</strong> {summary.typingSpeed.wpm}
            </div>
            <div className="feature-metric">
              <strong>CPM:</strong> {summary.typingSpeed.cpm}
            </div>
          </div>
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>Typing Accuracy</h4>
            <div className="feature-metric">
              <strong>Accuracy:</strong> {summary.accuracy.typing}%
            </div>
            <div className="feature-metric">
              <strong>Error Rate:</strong> {summary.accuracy.errorRate}%
            </div>
            <div className="feature-metric">
              <strong>Corrections:</strong> {summary.accuracy.corrections}
            </div>
          </div>
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>Key Timing</h4>
            <div className="feature-metric">
              <strong>Avg Hold Time:</strong> {summary.keyTiming.avgHoldTime}ms
            </div>
            <div className="feature-metric">
              <strong>Avg Flight Time:</strong> {summary.keyTiming.avgFlightTime}ms
            </div>
          </div>
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>Rhythm & Pauses</h4>
            <div className="feature-metric">
              <strong>Regularity:</strong> {summary.rhythm.regularity}%
            </div>
            <div className="feature-metric">
              <strong>Pause Count:</strong> {summary.pauses.count}
            </div>
            <div className="feature-metric">
              <strong>Pause Frequency:</strong> {summary.pauses.frequency}%
            </div>
          </div>
        </div>
      )}

      {/* Key Hold Time Analysis */}
      {renderFeatureSection(
        '⏱️ Key Hold Time (Dwell Time)',
        'holdTime',
        <div>
          <p style={{ margin: '0 0 1rem 0', color: '#666' }}>
            Time key is pressed down before release (milliseconds)
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
            <div className="metric-box">
              <strong>Mean</strong>
              <div style={{ fontSize: '1.2rem', color: '#667eea' }}>
                {features.keyHoldTimes.mean.toFixed(0)}ms
              </div>
            </div>
            <div className="metric-box">
              <strong>Median</strong>
              <div style={{ fontSize: '1.2rem', color: '#667eea' }}>
                {features.keyHoldTimes.median.toFixed(0)}ms
              </div>
            </div>
            <div className="metric-box">
              <strong>Std Dev</strong>
              <div style={{ fontSize: '1.2rem', color: '#667eea' }}>
                {features.keyHoldTimes.stdDev.toFixed(0)}ms
              </div>
            </div>
            <div className="metric-box">
              <strong>Min - Max</strong>
              <div style={{ fontSize: '0.9rem', color: '#667eea' }}>
                {features.keyHoldTimes.min.toFixed(0)}ms - {features.keyHoldTimes.max.toFixed(0)}ms
              </div>
            </div>
          </div>
          {normalizedFeatures && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#e7f3ff', borderRadius: '4px' }}>
              <strong>vs. Baseline:</strong>
              <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                Mean: <span style={{ color: normalizedFeatures.keyHoldTime.meanNormalized > 0 ? '#dc3545' : '#28a745' }}>
                  {normalizedFeatures.keyHoldTime.meanNormalized > 0 ? '+' : ''}{normalizedFeatures.keyHoldTime.meanNormalized}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Flight Time Analysis */}
      {renderFeatureSection(
        '✈️ Flight Time (Inter-Keystroke Interval)',
        'flightTime',
        <div>
          <p style={{ margin: '0 0 1rem 0', color: '#666' }}>
            Time between key release and next key press (milliseconds)
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
            <div className="metric-box">
              <strong>Mean</strong>
              <div style={{ fontSize: '1.2rem', color: '#667eea' }}>
                {features.flightTimes.mean.toFixed(0)}ms
              </div>
            </div>
            <div className="metric-box">
              <strong>Median</strong>
              <div style={{ fontSize: '1.2rem', color: '#667eea' }}>
                {features.flightTimes.median.toFixed(0)}ms
              </div>
            </div>
            <div className="metric-box">
              <strong>Std Dev</strong>
              <div style={{ fontSize: '1.2rem', color: '#667eea' }}>
                {features.flightTimes.stdDev.toFixed(0)}ms
              </div>
            </div>
            <div className="metric-box">
              <strong>Min - Max</strong>
              <div style={{ fontSize: '0.9rem', color: '#667eea' }}>
                {features.flightTimes.min.toFixed(0)}ms - {features.flightTimes.max.toFixed(0)}ms
              </div>
            </div>
          </div>
          {normalizedFeatures && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#e7f3ff', borderRadius: '4px' }}>
              <strong>vs. Baseline:</strong>
              <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                Mean: <span style={{ color: normalizedFeatures.flightTime.meanNormalized > 0 ? '#dc3545' : '#28a745' }}>
                  {normalizedFeatures.flightTime.meanNormalized > 0 ? '+' : ''}{normalizedFeatures.flightTime.meanNormalized}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Typing Speed */}
      {renderFeatureSection(
        '⌨️ Typing Speed',
        'speed',
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
            <div className="metric-box">
              <strong>Words Per Minute</strong>
              <div style={{ fontSize: '1.2rem', color: '#667eea' }}>
                {features.typingSpeed.wpm}
              </div>
            </div>
            <div className="metric-box">
              <strong>Characters Per Minute</strong>
              <div style={{ fontSize: '1.2rem', color: '#667eea' }}>
                {features.typingSpeed.cpm}
              </div>
            </div>
            <div className="metric-box">
              <strong>Duration</strong>
              <div style={{ fontSize: '1.2rem', color: '#667eea' }}>
                {features.typingSpeed.duration}s
              </div>
            </div>
            <div className="metric-box">
              <strong>Total Keystrokes</strong>
              <div style={{ fontSize: '1.2rem', color: '#667eea' }}>
                {features.typingSpeed.keyCount}
              </div>
            </div>
          </div>
          {normalizedFeatures && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#e7f3ff', borderRadius: '4px' }}>
              <strong>vs. Baseline:</strong>
              <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                <div>WPM: <span style={{ color: normalizedFeatures.typingSpeed.wpmNormalized < 0 ? '#dc3545' : '#28a745' }}>
                  {normalizedFeatures.typingSpeed.wpmNormalized > 0 ? '+' : ''}{normalizedFeatures.typingSpeed.wpmNormalized}%
                </span></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rhythm and Regularity */}
      {renderFeatureSection(
        '🎵 Rhythm & Regularity',
        'rhythm',
        <div>
          <p style={{ margin: '0 0 1rem 0', color: '#666' }}>
            Consistency of keystroke timing patterns
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
            <div className="metric-box">
              <strong>Mean Interval</strong>
              <div style={{ fontSize: '1.2rem', color: '#667eea' }}>
                {parseFloat(features.rhythmMetrics.meanInterval).toFixed(0)}ms
              </div>
            </div>
            <div className="metric-box">
              <strong>Std Dev</strong>
              <div style={{ fontSize: '1.2rem', color: '#667eea' }}>
                {parseFloat(features.rhythmMetrics.stdDevInterval).toFixed(0)}ms
              </div>
            </div>
            <div className="metric-box">
              <strong>Rhythm Regularity</strong>
              <div style={{ fontSize: '1.2rem', color: '#667eea' }}>
                {features.rhythmMetrics.rhythmRegularity}%
              </div>
              <div style={{ fontSize: '0.75rem', color: '#999' }}>Higher = More Regular</div>
            </div>
            <div className="metric-box">
              <strong>Coefficient of Variation</strong>
              <div style={{ fontSize: '1rem', color: '#667eea' }}>
                {features.rhythmMetrics.coefficientOfVariation}
              </div>
            </div>
          </div>
          {normalizedFeatures && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#e7f3ff', borderRadius: '4px' }}>
              <strong>vs. Baseline:</strong>
              <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                Regularity: <span style={{ color: normalizedFeatures.rhythm.regularityNormalized > 0 ? '#28a745' : '#dc3545' }}>
                  {normalizedFeatures.rhythm.regularityNormalized > 0 ? '+' : ''}{normalizedFeatures.rhythm.regularityNormalized}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pause Analysis */}
      {renderFeatureSection(
        '⏸️ Pause Analysis',
        'pauses',
        <div>
          <p style={{ margin: '0 0 1rem 0', color: '#666' }}>
            Analysis of typing pauses and hesitations
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
            <div className="metric-box">
              <strong>Pause Count</strong>
              <div style={{ fontSize: '1.2rem', color: '#667eea' }}>
                {features.pauses.pauseCount}
              </div>
            </div>
            <div className="metric-box">
              <strong>Mean Duration</strong>
              <div style={{ fontSize: '1.2rem', color: '#667eea' }}>
                {parseFloat(features.pauses.meanPauseDuration).toFixed(0)}ms
              </div>
            </div>
            <div className="metric-box">
              <strong>Total Pause Time</strong>
              <div style={{ fontSize: '1.2rem', color: '#667eea' }}>
                {parseFloat(features.pauses.totalPauseTime).toFixed(0)}ms
              </div>
            </div>
            <div className="metric-box">
              <strong>Pause Frequency</strong>
              <div style={{ fontSize: '1.2rem', color: '#667eea' }}>
                {features.pauses.pauseFrequency}%
              </div>
              <div style={{ fontSize: '0.75rem', color: '#999' }}>Of Total Intervals</div>
            </div>
          </div>
          {normalizedFeatures && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#e7f3ff', borderRadius: '4px' }}>
              <strong>vs. Baseline:</strong>
              <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                <div>Pause Count: <span style={{ color: normalizedFeatures.pauses.pauseCountNormalized > 0 ? '#dc3545' : '#28a745' }}>
                  {normalizedFeatures.pauses.pauseCountNormalized > 0 ? '+' : ''}{normalizedFeatures.pauses.pauseCountNormalized}%
                </span></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error & Correction Analysis */}
      {renderFeatureSection(
        '❌ Error & Correction Analysis',
        'errors',
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
            <div className="metric-box">
              <strong>Total Errors</strong>
              <div style={{ fontSize: '1.2rem', color: '#dc3545' }}>
                {features.errorMetrics.totalErrors}
              </div>
            </div>
            <div className="metric-box">
              <strong>Error Rate</strong>
              <div style={{ fontSize: '1.2rem', color: '#dc3545' }}>
                {features.errorMetrics.errorRate}%
              </div>
            </div>
            <div className="metric-box">
              <strong>Typing Accuracy</strong>
              <div style={{ fontSize: '1.2rem', color: '#28a745' }}>
                {features.errorMetrics.typingAccuracy}%
              </div>
            </div>
            <div className="metric-box">
              <strong>Corrections (Backspace)</strong>
              <div style={{ fontSize: '1.2rem', color: '#667eea' }}>
                {features.errorMetrics.corrections}
              </div>
            </div>
          </div>
          {normalizedFeatures && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#e7f3ff', borderRadius: '4px' }}>
              <strong>vs. Baseline:</strong>
              <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                <div>Error Rate: <span style={{ color: normalizedFeatures.errors.errorRateNormalized < 0 ? '#28a745' : '#dc3545' }}>
                  {normalizedFeatures.errors.errorRateNormalized > 0 ? '+' : ''}{normalizedFeatures.errors.errorRateNormalized}%
                </span></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Keystroke Statistics */}
      {renderFeatureSection(
        '📈 Keystroke Statistics',
        'stats',
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
          <div className="metric-box">
            <strong>Total Keystrokes</strong>
            <div style={{ fontSize: '1rem', color: '#667eea' }}>
              {features.keystrokeStats.totalKeystrokes}
            </div>
          </div>
          <div className="metric-box">
            <strong>Keydown Count</strong>
            <div style={{ fontSize: '1rem', color: '#667eea' }}>
              {features.keystrokeStats.keydownCount}
            </div>
          </div>
          <div className="metric-box">
            <strong>Shift Key Usage</strong>
            <div style={{ fontSize: '1rem', color: '#667eea' }}>
              {features.keystrokeStats.shiftKeyCount}
            </div>
          </div>
          <div className="metric-box">
            <strong>Backspace Usage</strong>
            <div style={{ fontSize: '1rem', color: '#667eea' }}>
              {features.keystrokeStats.backspaceCount}
            </div>
          </div>
          <div className="metric-box">
            <strong>Space Key Usage</strong>
            <div style={{ fontSize: '1rem', color: '#667eea' }}>
              {features.keystrokeStats.spaceCount}
            </div>
          </div>
          <div className="metric-box">
            <strong>Unique Keys</strong>
            <div style={{ fontSize: '1rem', color: '#667eea' }}>
              {features.keystrokeStats.uniqueKeys}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default KeystrokeFeatureAnalysis;
