import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const NASA_TLX_DIMENSIONS = [
  {
    id: 'mentalDemand',
    label: 'Mental Demand',
    description: 'How mentally demanding was the task?',
    anchor1: 'Very Low',
    anchor2: 'Very High',
  },
  {
    id: 'physicalDemand',
    label: 'Physical Demand',
    description: 'How physically demanding was the task?',
    anchor1: 'Very Low',
    anchor2: 'Very High',
  },
  {
    id: 'temporalDemand',
    label: 'Temporal Demand',
    description: 'How hurried or rushed was the pace of the task?',
    anchor1: 'Very Low',
    anchor2: 'Very High',
  },
  {
    id: 'performance',
    label: 'Performance',
    description: 'How successful do you think you were in performing the task?',
    anchor1: 'Failure',
    anchor2: 'Perfect',
  },
  {
    id: 'effort',
    label: 'Effort',
    description: 'How hard did you have to work to accomplish your level of performance?',
    anchor1: 'Very Low',
    anchor2: 'Very High',
  },
  {
    id: 'frustration',
    label: 'Frustration',
    description: 'How insecure, discouraged, irritated, stressed, and annoyed were you?',
    anchor1: 'Very Low',
    anchor2: 'Very High',
  },
];

function NasaTLXForm({ participantData, sessionData, cognitiveLoadLevel, onSubmit }) {
  const [formData, setFormData] = useState({
    mentalDemand: 50,
    physicalDemand: 50,
    temporalDemand: 50,
    performance: 50,
    effort: 50,
    frustration: 50,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSliderChange = (id, value) => {
    setFormData((prev) => ({
      ...prev,
      [id]: parseInt(value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/nasa-tlx/submit`, {
        sessionId: sessionData.sessionId,
        userId: participantData.userId,
        cognitiveLoad: cognitiveLoadLevel,
        ...formData,
      });

      if (response.status === 201) {
        onSubmit({
          sessionId: sessionData.sessionId,
          userId: participantData.userId,
          ...formData,
        });
      }
    } catch (err) {
      setError(
        err.response?.data?.error || 'Error submitting NASA-TLX. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const calculateWeightedScore = () => {
    const values = Object.values(formData);
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  };

  return (
    <div className="form-container">
      <h2>Step 3: Cognitive Load Assessment (NASA-TLX)</h2>
      <p>Please rate the <strong>{cognitiveLoadLevel.charAt(0).toUpperCase() + cognitiveLoadLevel.slice(1)} Cognitive Load</strong> typing task you just completed on the following dimensions</p>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        {NASA_TLX_DIMENSIONS.map((dimension) => (
          <div key={dimension.id} className="slider-group">
            <label htmlFor={dimension.id}>
              <strong>{dimension.label}</strong>
              <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>
                {dimension.description}
              </div>
            </label>

            <div className="slider-container">
              <span style={{ fontSize: '0.85rem', color: '#666', minWidth: '80px' }}>
                {dimension.anchor1}
              </span>
              <input
                type="range"
                id={dimension.id}
                name={dimension.id}
                min="0"
                max="100"
                value={formData[dimension.id]}
                onChange={(e) => handleSliderChange(dimension.id, e.target.value)}
              />
              <span style={{ fontSize: '0.85rem', color: '#666', minWidth: '80px', textAlign: 'right' }}>
                {dimension.anchor2}
              </span>
              <div className="slider-value">{formData[dimension.id]}</div>
            </div>
          </div>
        ))}

        <div
          style={{
            background: '#f0f4ff',
            padding: '1rem',
            borderRadius: '5px',
            marginBottom: '1.5rem',
            border: '1px solid #667eea',
          }}
        >
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#667eea' }}>
            Overall Cognitive Load Score
          </h4>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea' }}>
            {calculateWeightedScore()} / 100
          </div>
        </div>

        <div className="button-group">
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Complete & View Summary'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default NasaTLXForm;
