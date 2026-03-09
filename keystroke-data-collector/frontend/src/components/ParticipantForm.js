import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

function ParticipantForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    userId: '',
    age: '',
    gender: '',
    educationLevel: '',
    typingHabits: '',
    professionalTyping: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const generateUserId = () => {
      return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    };
    setFormData((prev) => ({ ...prev, userId: generateUserId() }));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!formData.age || formData.age < 13 || formData.age > 120) {
      setError('Please enter a valid age between 13 and 120');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/participant/register`,
        formData
      );

      if (response.status === 201) {
        onSubmit(formData);
      }
    } catch (err) {
      setError(
        err.response?.data?.error || 'Error registering participant. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Step 1: Participant Information</h2>
      <p>Please provide your demographic information</p>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="userId">User ID (Auto-generated)</label>
          <input
            type="text"
            id="userId"
            name="userId"
            value={formData.userId}
            readOnly
            className="readonly-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="age">Age *</label>
          <input
            type="number"
            id="age"
            name="age"
            value={formData.age}
            onChange={handleChange}
            placeholder="Enter your age"
            min="13"
            max="120"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="gender">Gender</label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
          >
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="educationLevel">Education Level</label>
          <select
            id="educationLevel"
            name="educationLevel"
            value={formData.educationLevel}
            onChange={handleChange}
          >
            <option value="">Select education level</option>
            <option value="High School">High School</option>
            <option value="Bachelor">Bachelor</option>
            <option value="Master">Master</option>
            <option value="PhD">PhD</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="typingHabits">Typical Typing Usage</label>
          <select
            id="typingHabits"
            name="typingHabits"
            value={formData.typingHabits}
            onChange={handleChange}
          >
            <option value="">Select typing habits</option>
            <option value="Rarely">Rarely (less than 1 hour/day)</option>
            <option value="Occasionally">Occasionally (1-3 hours/day)</option>
            <option value="Frequently">Frequently (3-6 hours/day)</option>
            <option value="Very Frequently">Very Frequently (more than 6 hours/day)</option>
          </select>
        </div>

       
        <div className="button-group">
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Continue to Typing Task'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ParticipantForm;
