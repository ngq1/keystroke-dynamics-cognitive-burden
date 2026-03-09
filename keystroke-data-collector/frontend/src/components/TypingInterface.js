import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Extended typing prompts by cognitive load level - longer texts for sustained engagement
const TYPING_TASKS = {
  low: [
    "Keystroke dynamics is a behavioral biometric technology that measures the unique patterns in how individuals type. Each person develops a distinctive typing rhythm through years of habit and muscle memory. This rhythm includes the time intervals between key presses, known as dwell time, and the time between releasing one key and pressing the next, known as flight time. Modern security systems increasingly use keystroke dynamics as an additional layer of authentication alongside traditional passwords. The technology works by analyzing typing speed, pressure patterns, and the duration of key presses. These measurements can be used to create a unique profile for each user. Keystroke dynamics is particularly useful because it provides continuous authentication throughout a user session rather than only at login."
  ],
  medium: [
    "Cognitive load refers to the amount of working memory resources required to perform a task. When individuals engage in typing while simultaneously processing external information, their cognitive capacity becomes divided between these two activities. Research has shown that concurrent tasks significantly influence typing behavior, with measurable changes in keystroke timing patterns observable during periods of high cognitive demand. Participants often demonstrate increased dwell times and irregular flight times when attention is divided between typing and other cognitive demands. The impact of cognitive load on keystroke dynamics has important implications for security systems that rely on typing patterns for authentication. Understanding how cognitive burden affects typing behavior is crucial for developing robust keystroke-based biometric systems. In practical scenarios, users frequently type while engaged in conversation, receiving instructions, or multitasking, making it essential to study keystroke dynamics under realistic conditions of divided attention and cognitive load."
  ],
  high: [
    "The relationship between cognitive burden and keystroke dynamics represents a critical area of research in behavioral biometrics and human-computer interaction. As cognitive demands increase through concurrent activities such as active conversation, problem-solving, and attention switching, typing patterns exhibit measurable deviations from baseline behavior. These deviations manifest as increased keystroke latency, reduced typing speed, and irregular rhythm patterns. Participants performing complex concurrent tasks show statistically significant changes in their keystroke timing profiles compared to their baseline patterns recorded under minimal cognitive demand conditions. The implications of these findings extend to authentication systems, user experience design, and understanding stress responses in human-computer interaction. Furthermore, the relationship between real-time cognitive load assessment and keystroke dynamics offers potential applications in adaptive interfaces that adjust difficulty or pacing based on user cognitive state. Future research should investigate whether keystroke dynamics can serve as an objective measure of cognitive burden in educational technology, workplace monitoring systems, and human factors research. Understanding these relationships requires detailed analysis of keystroke features including dwell time, flight time, key hold duration, and inter-keystroke intervals across different levels of cognitive engagement and multitasking complexity."
  ]
};

// Secondary tasks/concurrent activities to introduce cognitive burden
const SECONDARY_TASKS = {
  low: {
    description: "No interruptions or secondary activities",
    activities: [],
    instructions: "Please focus entirely on typing the text below in a quiet environment."
  },
  medium: {
    description: "Light concurrent activities - simple questions and brief conversation",
    activities: [
      { time: 5000, type: "question", content: "What is the capital of France?" },
      { time: 12000, type: "question", content: "Name three colors of the rainbow." },
      { time: 20000, type: "instruction", content: "Slow down your typing pace and emphasize accuracy." },
      { time: 28000, type: "question", content: "How many days are in a week?" }
    ],
    instructions: "While typing, you will receive simple questions and instructions. Try to answer or follow them while maintaining your typing."
  },
  high: {
    description: "High cognitive demands - complex questions, arithmetic, and task switching",
    activities: [
      { time: 5000, type: "arithmetic", content: "What is 47 + 38? Remember your answer." },
      { time: 65000, type: "question", content: "Describe your favorite book or movie in detail." },
      { time: 125000, type: "recall", content: "What was the arithmetic answer you calculated earlier?" },
      { time: 185000, type: "arithmetic", content: "Calculate 156 ÷ 12. Remember this number." },
      { time: 245000, type: "question", content: "Name 5 countries in Europe without repeating any." },
      { time: 305000, type: "instruction", content: "Speed up your typing while maintaining accuracy." }
    ],
    instructions: "While typing, you will receive complex questions, arithmetic problems, and instructions. Answer them aloud or record them mentally while continuing to type. This simulates real-world multitasking scenarios."
  }
};

function TypingInterface({ participantData, cognitiveLoadLevel, onSubmit }) {
  const [prompt, setPrompt] = useState(TYPING_TASKS[cognitiveLoadLevel][0]);
  const [typedText, setTypedText] = useState('');
  const [keystrokes, setKeystrokes] = useState([]);
  const [sessionId, setSessionId] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentSecondaryTask, setCurrentSecondaryTask] = useState(null);
  const [secondaryTaskResponse, setSecondaryTaskResponse] = useState('');
  const [secondaryTasksCompleted, setSecondaryTasksCompleted] = useState([]);
  const textInputRef = useRef(null);

  // Initialize session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        const response = await axios.post(`${API_BASE_URL}/typing-session/start`, {
          userId: participantData.userId,
          taskType: 'fixed_text',
          textPrompt: prompt,
          cognitiveLoad: cognitiveLoadLevel,
          secondaryTasksCount: SECONDARY_TASKS[cognitiveLoadLevel].activities.length,
        });
        setSessionId(response.data.sessionId);
        setStartTime(Date.now());
      } catch (err) {
        setError('Error initializing typing session');
      }
    };

    initSession();
  }, [prompt, cognitiveLoadLevel, participantData.userId]);

  // Secondary task scheduler - trigger tasks at specified intervals
  useEffect(() => {
    if (!startTime || cognitiveLoadLevel === 'low') return;

    const activities = SECONDARY_TASKS[cognitiveLoadLevel].activities;
    const timers = activities.map((activity) => {
      return setTimeout(() => {
        setCurrentSecondaryTask(activity);
      }, activity.time);
    });

    return () => timers.forEach(timer => clearTimeout(timer));
  }, [startTime, cognitiveLoadLevel]);

  // Update prompt when cognitive load level changes
  useEffect(() => {
    const prompts = TYPING_TASKS[cognitiveLoadLevel];
    setPrompt(prompts[Math.floor(Math.random() * prompts.length)]);
  }, [cognitiveLoadLevel]);

  const handleKeyDown = (e) => {
    if (!startTime) return;

    const keystrokeData = {
      key: e.key,
      keyCode: e.keyCode,
      timestamp: Date.now() - startTime,
      ctrlKey: e.ctrlKey,
      shiftKey: e.shiftKey,
      type: 'keydown',
    };

    setKeystrokes((prev) => [...prev, keystrokeData]);
  };

  const handleKeyUp = (e) => {
    if (!startTime) return;

    const keystrokeData = {
      key: e.key,
      keyCode: e.keyCode,
      timestamp: Date.now() - startTime,
      type: 'keyup',
    };

    setKeystrokes((prev) => [...prev, keystrokeData]);
  };

  const handleChange = (e) => {
    setTypedText(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!typedText.trim()) {
      setError('Please type something before submitting');
      setLoading(false);
      return;
    }

    try {
      const duration = (Date.now() - startTime) / 1000; // Duration in seconds

      const response = await axios.post(`${API_BASE_URL}/typing-session/submit`, {
        sessionId,
        typedText,
        keystrokes,
        duration,
        cognitiveLoad: cognitiveLoadLevel,
        secondaryTasksCompleted,
        secondaryTasksCount: SECONDARY_TASKS[cognitiveLoadLevel].activities.length,
      });

      if (response.status === 200) {
        setSubmitted(true);
        onSubmit({
          sessionId,
          userId: participantData.userId,
          taskType: 'fixed_text',
          textPrompt: prompt,
          typedText,
          duration,
          keystrokeCount: keystrokes.length,
          cognitiveLoad: cognitiveLoadLevel,
          secondaryTasksCompleted,
          keystrokes: keystrokes, // Include keystroke data for feature analysis
        });
      }
    } catch (err) {
      setError(
        err.response?.data?.error || 'Error submitting typing session. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setTypedText('');
    setKeystrokes([]);
    setStartTime(Date.now());
  };

  const accuracy = typedText
    ? (
        ((typedText.split('').filter((char, i) => char === prompt[i]).length) /
          prompt.length) *
        100
      ).toFixed(1)
    : 0;

  const wpm =
    startTime && typedText.split(' ').length > 0
      ? (
          (typedText.split(' ').length / ((Date.now() - startTime) / 1000)) *
          60
        ).toFixed(1)
      : 0;

  const duration = startTime ? ((Date.now() - startTime) / 1000).toFixed(1) : 0;

  return (
    <div className="typing-container">
      <h2>Step 2: Typing Task</h2>

      {error && <div className="error-message">{error}</div>}

      {submitted && (
        <div className="success-message">
          Typing session submitted successfully! Moving to next step...
        </div>
      )}

      <div className="typing-prompt">
        <h3>Instructions:</h3>
        <p>{SECONDARY_TASKS[cognitiveLoadLevel].instructions}</p>
        <h3 style={{ marginBottom: '0.5rem', marginTop: '1rem' }}>Cognitive Load Level: {cognitiveLoadLevel.charAt(0).toUpperCase() + cognitiveLoadLevel.slice(1)}</h3>
        <p style={{ fontSize: '0.9rem', color: '#666' }}>{SECONDARY_TASKS[cognitiveLoadLevel].description}</p>
        <h3 style={{ marginBottom: '0.5rem', marginTop: '1rem' }}>Text to Type:</h3>
        <p>{prompt}</p>
      </div>

      {currentSecondaryTask && (
        <div style={{
          backgroundColor: '#fff3cd',
          border: '2px solid #ffc107',
          borderRadius: '5px',
          padding: '1rem',
          marginBottom: '1rem',
          animation: 'pulse 0.5s'
        }}>
          <h4 style={{ marginTop: 0, color: '#856404' }}>⚡ Secondary Task:</h4>
          <p style={{ fontSize: '1.1rem', color: '#000', marginBottom: '0.5rem' }}>
            {currentSecondaryTask.content}
          </p>
          {(currentSecondaryTask.type === 'question' || currentSecondaryTask.type === 'arithmetic' || currentSecondaryTask.type === 'recall') && (
            <input
              type="text"
              placeholder="Answer here or continue typing..."
              value={secondaryTaskResponse}
              onChange={(e) => setSecondaryTaskResponse(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && secondaryTaskResponse.trim()) {
                  setSecondaryTasksCompleted([...secondaryTasksCompleted, {
                    task: currentSecondaryTask,
                    response: secondaryTaskResponse,
                    timestamp: Date.now() - startTime
                  }]);
                  setCurrentSecondaryTask(null);
                  setSecondaryTaskResponse('');
                }
              }}
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
              autoFocus
            />
          )}
          {currentSecondaryTask.type === 'instruction' && (
            <button
              type="button"
              onClick={() => {
                setSecondaryTasksCompleted([...secondaryTasksCompleted, {
                  task: currentSecondaryTask,
                  response: 'Instruction acknowledged',
                  timestamp: Date.now() - startTime
                }]);
                setCurrentSecondaryTask(null);
              }}
              style={{ padding: '0.5rem 1rem', marginTop: '0.5rem' }}
            >
              Acknowledged
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="typing-area">
          <label htmlFor="typingInput">Your Text:</label>
          <textarea
            id="typingInput"
            ref={textInputRef}
            value={typedText}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            placeholder="Click here and start typing..."
            disabled={submitted}
            autoFocus
          />
        </div>

        <div className="typing-stats">
          <div className="stat-card">
            <h4>Accuracy</h4>
            <div className="value">{accuracy}%</div>
          </div>
          <div className="stat-card">
            <h4>WPM</h4>
            <div className="value">{wpm}</div>
          </div>
          <div className="stat-card">
            <h4>Duration</h4>
            <div className="value">{duration}s</div>
          </div>
          <div className="stat-card">
            <h4>Keystrokes</h4>
            <div className="value">{keystrokes.length}</div>
          </div>
        </div>

        <div className="button-group">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleReset}
            disabled={submitted || loading}
          >
            Clear & Reset
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || submitted || !typedText.trim()}
          >
            {loading ? 'Submitting...' : 'Submit Task'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default TypingInterface;
