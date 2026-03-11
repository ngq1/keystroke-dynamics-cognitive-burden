import React from 'react';
import KeystrokeFeatureAnalysis from './KeystrokeFeatureAnalysis';

function Summary({ participantData, sessionData, nasaTLXData, labelingData, onReset }) {
  return (
    <div className="summary-container">
      <div className="success-icon">✓</div>
      <h2 style={{ textAlign: 'center', color: '#28a745', marginTop: 0 }}>
        Session Complete!
      </h2>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem' }}>
        Thank you for completing this data collection session
      </p>

      <div className="summary-section">
        <h3>Participant Information</h3>
        <div className="summary-item">
          <strong>User ID:</strong>
          <span>{participantData.userId}</span>
        </div>
        {participantData.age && (
          <div className="summary-item">
            <strong>Age:</strong>
            <span>{participantData.age}</span>
          </div>
        )}
        {participantData.gender && (
          <div className="summary-item">
            <strong>Gender:</strong>
            <span>{participantData.gender}</span>
          </div>
        )}
        {participantData.educationLevel && (
          <div className="summary-item">
            <strong>Education:</strong>
            <span>{participantData.educationLevel}</span>
          </div>
        )}
      </div>

      <div className="summary-section">
        <h3>Typing Task Results</h3>
        {['low', 'medium', 'high'].map(level => (
          <div key={level} style={{ marginBottom: '1rem' }}>
            <h4 style={{ textTransform: 'capitalize' }}>{level} Cognitive Load Task</h4>
            <div className="summary-item">
              <strong>Session ID:</strong>
              <span>{sessionData[level].sessionId}</span>
            </div>
            <div className="summary-item">
              <strong>Duration:</strong>
              <span>{sessionData[level].duration.toFixed(1)} seconds</span>
            </div>
            <div className="summary-item">
              <strong>Keystrokes Recorded:</strong>
              <span>{sessionData[level].keystrokeCount}</span>
            </div>
            <div className="summary-item">
              <strong>Words Per Minute (WPM):</strong>
              <span>
                {(
                  (sessionData[level].typedText.split(' ').length / sessionData[level].duration) *
                  60
                ).toFixed(1)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="summary-section">
        <h3>Cognitive Load Assessment</h3>
        {['low', 'medium', 'high'].map(level => (
          <div key={level} style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ textTransform: 'capitalize' }}>{level} Cognitive Load Assessment</h4>
            <div className="summary-item">
              <strong>Mental Demand:</strong>
              <span>{nasaTLXData[level].mentalDemand}/100</span>
            </div>
            <div className="summary-item">
              <strong>Physical Demand:</strong>
              <span>{nasaTLXData[level].physicalDemand}/100</span>
            </div>
            <div className="summary-item">
              <strong>Temporal Demand:</strong>
              <span>{nasaTLXData[level].temporalDemand}/100</span>
            </div>
            <div className="summary-item">
              <strong>Performance:</strong>
              <span>{nasaTLXData[level].performance}/100</span>
            </div>
            <div className="summary-item">
              <strong>Effort:</strong>
              <span>{nasaTLXData[level].effort}/100</span>
            </div>
            <div className="summary-item">
              <strong>Frustration:</strong>
              <span>{nasaTLXData[level].frustration}/100</span>
            </div>
            <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #e0e0e0' }}>
              <div className="summary-item">
                <strong>Overall Cognitive Load:</strong>
                <span style={{ color: '#667eea', fontWeight: 'bold' }}>
                  {(
                    (nasaTLXData[level].mentalDemand +
                     nasaTLXData[level].physicalDemand +
                     nasaTLXData[level].temporalDemand +
                     nasaTLXData[level].performance +
                     nasaTLXData[level].effort +
                     nasaTLXData[level].frustration) / 6
                  ).toFixed(1)}/100
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="summary-section">
        <h3>Cognitive Burden Labeling & Validation</h3>
        {['low', 'medium', 'high'].map(level => {
          const labeling = labelingData[level];
          if (!labeling) return null;
          
          return (
            <div key={level} style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '5px', border: '1px solid #dee2e6' }}>
              <h4 style={{ textTransform: 'capitalize', margin: '0 0 1rem 0' }}>{level} Cognitive Load - Cognitive Burden Label</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div className="summary-item">
                    <strong>Induced Load:</strong>
                    <span style={{ textTransform: 'capitalize', color: '#667eea' }}>{labeling.labels.inducedCognitiveLoad}</span>
                  </div>
                  <div className="summary-item">
                    <strong>Perceived Load:</strong>
                    <span style={{ textTransform: 'capitalize', color: '#667eea' }}>{labeling.labels.perceivedCognitiveLoad}</span>
                  </div>
                  <div className="summary-item">
                    <strong>Alignment:</strong>
                    <span style={{ 
                      textTransform: 'capitalize', 
                      fontWeight: 'bold',
                      color: labeling.labels.cognitiveLoadAlignment === 'aligned' ? '#28a745' : '#dc3545'
                    }}>{labeling.labels.cognitiveLoadAlignment}</span>
                  </div>
                </div>
                
                <div>
                  <div className="summary-item">
                    <strong>Overall Burden:</strong>
                    <span style={{ textTransform: 'capitalize' }}>{labeling.labels.overallBurdenLabel}</span>
                  </div>
                  <div className="summary-item">
                    <strong>Performance Level:</strong>
                    <span style={{ textTransform: 'capitalize' }}>{labeling.labels.performanceLevel}</span>
                  </div>
                  <div className="summary-item">
                    <strong>Task Complexity:</strong>
                    <span>{labeling.labels.taskComplexityScore}/100</span>
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '4px', border: '1px solid #e0e0e0' }}>
                <h5 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>Performance Metrics</h5>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <div><strong>Typing Accuracy:</strong> {labeling.labels.metrics.typingAccuracy}%</div>
                  <div><strong>Error Rate:</strong> {labeling.labels.metrics.errorRate}%</div>
                  <div><strong>WPM:</strong> {labeling.labels.metrics.wordsPerMinute}</div>
                  <div><strong>Secondary Task Accuracy:</strong> {labeling.labels.metrics.secondaryTaskAccuracy}%</div>
                  <div><strong>Consistency Score:</strong> {labeling.labels.metrics.consistencyScore}/100</div>
                  <div><strong>NASA-TLX Score:</strong> {labeling.labels.nasaTLXScore}/100</div>
                </div>
              </div>

              {labeling.validationReport && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '0.75rem', 
                  borderRadius: '4px',
                  backgroundColor: labeling.validationReport.isValid ? '#d4edda' : '#fff3cd',
                  border: `1px solid ${labeling.validationReport.isValid ? '#c3e6cb' : '#ffc107'}`
                }}>
                  <strong style={{ color: labeling.validationReport.isValid ? '#155724' : '#856404' }}>
                    {labeling.validationReport.isValid ? '✓ Validation Passed' : '⚠ Validation Issues'}
                  </strong>
                  {labeling.validationReport.issues.length > 0 && (
                    <ul style={{ margin: '0.5rem 0 0 1.2rem', paddingLeft: 0 }}>
                      {labeling.validationReport.issues.map((issue, idx) => (
                        <li key={idx} style={{ fontSize: '0.85rem' }}>{issue}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="summary-section">
        <h3>Keystroke Dynamics Feature Analysis</h3>
        <p style={{ color: '#666', marginBottom: '1rem' }}>
          Detailed keystroke metrics analyzed at the session level and normalized against baseline performance
        </p>
        {['low', 'medium', 'high'].map(level => (
          <div key={level} style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '5px', border: '1px solid #dee2e6' }}>
            <h4 style={{ textTransform: 'capitalize', margin: '0 0 1rem 0' }}>
              {level} Cognitive Load - Keystroke Features
              {level === 'low' && ' (Baseline)'}
            </h4>
            <KeystrokeFeatureAnalysis
              sessionData={sessionData[level]}
              baselineData={level !== 'low' ? sessionData['low'] : null}
              cognitiveLoadLevel={level}
            />
          </div>
        ))}
      </div>

      <div className="button-group">
        <button type="button" className="btn-secondary" onClick={() => alert('Session ended. You can close this browser tab.')}>
          End Session
        </button>
        <button type="button" className="btn-primary" onClick={onReset}>
          Start New Session
        </button>
      </div>

      <p style={{ textAlign: 'center', color: '#999', fontSize: '0.9rem', marginTop: '1.5rem' }}>
        Your data has been securely stored with cognitive burden labels, keystroke analysis, and validation. Thank you for participating!
      </p>
    </div>
  );
}

export default Summary;
