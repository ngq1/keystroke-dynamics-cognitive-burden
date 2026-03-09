import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Cognitive Burden Labeling & Validation Component
 * 
 * Implements a comprehensive framework for cognitive burden detection:
 * 1. Subjective self-report measures (NASA-TLX)
 * 2. Task performance indicators (typing accuracy, error rates, secondary task accuracy)
 * 3. Task complexity scores from experimental design
 * 4. Validation of alignment between induced and perceived cognitive load
 */
function CognitiveBurdenLabeling({ 
  participantData, 
  sessionData, 
  nasaTLXData, 
  cognitiveLoadLevel, 
  onSubmit 
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validated, setValidated] = useState(false);
  const [labels, setLabels] = useState({});
  const [validationReport, setValidationReport] = useState(null);

  // Calculate task performance metrics
  const calculateTaskPerformanceMetrics = () => {
    const metrics = {
      typingAccuracy: 0,
      errorRate: 0,
      wordsPerMinute: 0,
      secondaryTaskAccuracy: 0,
      consistencyScore: 0,
    };

    if (!sessionData || !sessionData.textPrompt) return metrics;

    const { typedText, textPrompt, duration, secondaryTasksCompleted } = sessionData;

    // Typing accuracy: character-level accuracy
    if (typedText && textPrompt) {
      const correctChars = typedText
        .split('')
        .filter((char, i) => char === textPrompt[i]).length;
      metrics.typingAccuracy = ((correctChars / textPrompt.length) * 100).toFixed(2);
      metrics.errorRate = (100 - metrics.typingAccuracy).toFixed(2);
    }

    // Words Per Minute
    if (typedText && duration > 0) {
      const wordCount = typedText.trim().split(/\s+/).length;
      metrics.wordsPerMinute = ((wordCount / duration) * 60).toFixed(2);
    }

    // Secondary task accuracy: percentage of attempted tasks answered correctly
    if (secondaryTasksCompleted && secondaryTasksCompleted.length > 0) {
      const correctResponses = secondaryTasksCompleted.filter(
        (task) => task.isCorrect === true
      ).length;
      metrics.secondaryTaskAccuracy = (
        (correctResponses / secondaryTasksCompleted.length) *
        100
      ).toFixed(2);
    }

    // Consistency score: lower keystroke timing variability = higher consistency
    // (This would be calculated from detailed keystroke analysis in a more sophisticated system)
    metrics.consistencyScore = 75; // Placeholder - would require keystroke analysis

    return metrics;
  };

  // Calculate NASA-TLX composite score
  const calculateNasaTLXScore = () => {
    if (!nasaTLXData) return 0;

    const dimensions = [
      'mentalDemand',
      'physicalDemand',
      'temporalDemand',
      'performance',
      'effort',
      'frustration',
    ];

    const sum = dimensions.reduce((acc, dim) => {
      return acc + (nasaTLXData[dim] || 0);
    }, 0);

    return (sum / dimensions.length).toFixed(2);
  };

  // Determine task complexity score from experimental design
  const getTaskComplexityScore = () => {
    const complexityScores = {
      low: 20,      // Minimal secondary tasks, simple text
      medium: 50,   // Moderate secondary tasks and text complexity
      high: 85,     // Complex secondary tasks, challenging text
    };
    return complexityScores[cognitiveLoadLevel] || 0;
  };

  // Generate cognitive burden labels based on metrics
  const generateLabels = () => {
    const metrics = calculateTaskPerformanceMetrics();
    const nasaTLXScore = calculateNasaTLXScore();
    const taskComplexity = getTaskComplexityScore();

    const newLabels = {
      inducedCognitiveLoad: cognitiveLoadLevel,
      perceivedCognitiveLoad: calculatePerceivedLoad(nasaTLXScore),
      performanceLevel: calculatePerformanceLevel(metrics),
      taskComplexityScore: taskComplexity,
      cognitiveLoadAlignment: calculateAlignment(cognitiveLoadLevel, calculatePerceivedLoad(nasaTLXScore)),
      overallBurdenLabel: determineBurdenLabel(metrics, nasaTLXScore),
      metrics,
      nasaTLXScore,
      timestamp: new Date().toISOString(),
    };

    setLabels(newLabels);
    return newLabels;
  };

  // Map NASA-TLX score to perceived load category
  const calculatePerceivedLoad = (nasaTLXScore) => {
    const score = parseFloat(nasaTLXScore);
    if (score < 35) return 'low';
    if (score < 65) return 'medium';
    return 'high';
  };

  // Determine performance level from metrics
  const calculatePerformanceLevel = (metrics) => {
    const accuracy = parseFloat(metrics.typingAccuracy);
    const secondaryAccuracy = parseFloat(metrics.secondaryTaskAccuracy);
    const avgAccuracy = (accuracy + (secondaryAccuracy || accuracy)) / 2;

    if (avgAccuracy >= 85) return 'excellent';
    if (avgAccuracy >= 70) return 'good';
    if (avgAccuracy >= 55) return 'fair';
    return 'poor';
  };

  // Check alignment between induced and perceived load
  const calculateAlignment = (induced, perceived) => {
    const alignmentMap = {
      'low-low': 'aligned',
      'low-medium': 'over-perceived',
      'low-high': 'over-perceived',
      'medium-low': 'under-perceived',
      'medium-medium': 'aligned',
      'medium-high': 'over-perceived',
      'high-low': 'under-perceived',
      'high-medium': 'under-perceived',
      'high-high': 'aligned',
    };
    return alignmentMap[`${induced}-${perceived}`] || 'unknown';
  };

  // Determine overall cognitive burden label
  const determineBurdenLabel = (metrics, nasaTLXScore) => {
    const accuracy = parseFloat(metrics.typingAccuracy);
    const nasaTLX = parseFloat(nasaTLXScore);

    // High load is indicated by: low accuracy + high NASA-TLX score
    if (accuracy < 70 && nasaTLX > 60) return 'high-burden';
    if (accuracy < 75 && nasaTLX > 50) return 'moderate-burden';
    if (accuracy >= 80 && nasaTLX < 50) return 'low-burden';
    return 'moderate-burden';
  };

  // Validate alignment and generate report
  const performValidation = () => {
    const generatedLabels = generateLabels();
    
    const isAligned = generatedLabels.cognitiveLoadAlignment === 'aligned';
    const performanceIsSatisfactory = generatedLabels.performanceLevel !== 'poor';
    
    const report = {
      isValid: isAligned && performanceIsSatisfactory,
      alignment: generatedLabels.cognitiveLoadAlignment,
      performanceLevel: generatedLabels.performanceLevel,
      nasaTLXScore: generatedLabels.nasaTLXScore,
      taskComplexity: generatedLabels.taskComplexityScore,
      issues: [],
      recommendations: [],
    };

    // Identify issues
    if (!isAligned) {
      report.issues.push(
        `Load perception mismatch: Induced ${generatedLabels.inducedCognitiveLoad} but perceived as ${generatedLabels.perceivedCognitiveLoad}`
      );
    }
    if (!performanceIsSatisfactory) {
      report.issues.push('Performance degradation detected');
    }

    // Generate recommendations
    if (generatedLabels.inducedCognitiveLoad === 'high' && generatedLabels.perceivedCognitiveLoad === 'low') {
      report.recommendations.push('Consider increasing secondary task complexity');
    }
    if (generatedLabels.inducedCognitiveLoad === 'low' && generatedLabels.perceivedCognitiveLoad === 'high') {
      report.recommendations.push('Consider reducing secondary task difficulty');
    }

    setValidationReport(report);
    setValidated(true);
    return generatedLabels;
  };

  // Submit labels to backend
  const handleSubmitLabels = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/cognitive-burden-labels/submit`, {
        userId: participantData.userId,
        sessionId: sessionData.sessionId,
        cognitiveLoadLevel,
        labels,
        validationReport,
        timestamp: new Date().toISOString(),
      });

      if (response.status === 201) {
        onSubmit({
          labels,
          validationReport,
          sessionId: sessionData.sessionId,
        });
      }
    } catch (err) {
      setError(
        err.response?.data?.error || 'Error submitting cognitive burden labels. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    performValidation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="form-container">
      <h2>Step 4: Cognitive Burden Labeling & Validation</h2>
      <p>
        Cognitive burden assessment based on subjective measures (NASA-TLX), task performance, and induced complexity.
      </p>

      {error && <div className="error-message">{error}</div>}

      {validated && labels && validationReport && (
        <>
          {/* Validation Status */}
          <div style={{
            padding: '1rem',
            borderRadius: '5px',
            marginBottom: '1.5rem',
            border: `2px solid ${validationReport.isValid ? '#28a745' : '#ffc107'}`,
            backgroundColor: validationReport.isValid ? '#d4edda' : '#fff3cd',
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>
              {validationReport.isValid ? '✓ Validation Passed' : '⚠ Validation Issues Detected'}
            </h3>
            {validationReport.issues.length > 0 && (
              <ul style={{ marginBottom: '0.5rem', paddingLeft: '1.2rem' }}>
                {validationReport.issues.map((issue, idx) => (
                  <li key={idx} style={{ color: '#856404' }}>{issue}</li>
                ))}
              </ul>
            )}
            {validationReport.recommendations.length > 0 && (
              <div>
                <strong style={{ color: '#856404' }}>Recommendations:</strong>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.2rem' }}>
                  {validationReport.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Cognitive Burden Labels */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}>
            {/* Induced vs Perceived Load */}
            <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '5px', border: '1px solid #dee2e6' }}>
              <h4>Cognitive Load Comparison</h4>
              <p><strong>Induced Load:</strong> <span style={{ color: '#667eea', fontSize: '1.1rem' }}>{labels.inducedCognitiveLoad.toUpperCase()}</span></p>
              <p><strong>Perceived Load:</strong> <span style={{ color: '#667eea', fontSize: '1.1rem' }}>{labels.perceivedCognitiveLoad.toUpperCase()}</span></p>
              <p><strong>Alignment:</strong> <span style={{ fontWeight: 'bold', color: labels.cognitiveLoadAlignment === 'aligned' ? '#28a745' : '#dc3545' }}>{labels.cognitiveLoadAlignment.toUpperCase()}</span></p>
            </div>

            {/* Performance Metrics */}
            <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '5px', border: '1px solid #dee2e6' }}>
              <h4>Performance Indicators</h4>
              <p><strong>Overall Burden:</strong> <span style={{ fontSize: '1.1rem' }}>{labels.overallBurdenLabel.replace('-', ' ').toUpperCase()}</span></p>
              <p><strong>Performance Level:</strong> <span style={{ fontSize: '1.1rem' }}>{labels.performanceLevel.toUpperCase()}</span></p>
              <p><strong>Task Complexity Score:</strong> <span style={{ fontSize: '1.1rem' }}>{labels.taskComplexityScore}/100</span></p>
            </div>

            {/* Typing Accuracy */}
            <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '5px', border: '1px solid #dee2e6' }}>
              <h4>Typing Performance</h4>
              <p><strong>Accuracy:</strong> {labels.metrics.typingAccuracy}%</p>
              <p><strong>Error Rate:</strong> {labels.metrics.errorRate}%</p>
              <p><strong>Words Per Minute:</strong> {labels.metrics.wordsPerMinute}</p>
            </div>

            {/* Secondary Task & NASA-TLX */}
            <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '5px', border: '1px solid #dee2e6' }}>
              <h4>Assessment Scores</h4>
              <p><strong>Secondary Task Accuracy:</strong> {labels.metrics.secondaryTaskAccuracy}%</p>
              <p><strong>NASA-TLX Composite Score:</strong> {labels.nasaTLXScore}/100</p>
              <p><strong>Consistency Score:</strong> {labels.metrics.consistencyScore}/100</p>
            </div>
          </div>

          {/* Summary */}
          <div style={{
            padding: '1rem',
            backgroundColor: '#f0f4ff',
            borderRadius: '5px',
            border: '1px solid #667eea',
            marginBottom: '1.5rem',
          }}>
            <h4>Label Summary</h4>
            <p>
              <strong>Induced Cognitive Load:</strong> The experimental task was designed as a <strong>{labels.inducedCognitiveLoad} cognitive load</strong> condition.
            </p>
            <p>
              <strong>Perceived Cognitive Load:</strong> The participant rated their experience as <strong>{labels.perceivedCognitiveLoad} cognitive load</strong> based on NASA-TLX assessment.
            </p>
            <p>
              <strong>Cognitive Burden Classification:</strong> This session is labeled as <strong>{labels.overallBurdenLabel}</strong> based on 
              typing accuracy ({labels.metrics.typingAccuracy}%), secondary task completion ({labels.metrics.secondaryTaskAccuracy}%), 
              and subjective workload ({labels.nasaTLXScore}/100).
            </p>
          </div>

          <form onSubmit={handleSubmitLabels}>
            <button
              type="submit"
              className="submit-button"
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? 'Submitting...' : 'Confirm Labels & Continue'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default CognitiveBurdenLabeling;
