import React, { useState } from 'react';
import './App.css';
import ParticipantForm from './components/ParticipantForm';
import TypingInterface from './components/TypingInterface';
import NasaTLXForm from './components/NasaTLXForm';
import CognitiveBurdenLabeling from './components/CognitiveBurdenLabeling';
import Summary from './components/Summary';

function App() {
  const [currentStep, setCurrentStep] = useState('participant'); // participant, typing, nasa-tlx, labeling, summary
  const [participantData, setParticipantData] = useState(null);
  const [sessionData, setSessionData] = useState({});
  const [nasaTLXData, setNasaTLXData] = useState({});
  const [labelingData, setLabelingData] = useState({});
  const cognitiveLevels = ['low', 'medium', 'high'];
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);

  const handleParticipantSubmit = (data) => {
    setParticipantData(data);
    setCurrentStep('typing');
  };

  const handleTypingSubmit = (data) => {
    const level = cognitiveLevels[currentLevelIndex];
    setSessionData((prev) => ({ ...prev, [level]: data }));
    setCurrentStep('nasa-tlx');
  };

  const handleNasaTLXSubmit = (data) => {
    const level = cognitiveLevels[currentLevelIndex];
    setNasaTLXData((prev) => ({ ...prev, [level]: data }));
    setCurrentStep('labeling');
  };

  const handleLabelingSubmit = (data) => {
    const level = cognitiveLevels[currentLevelIndex];
    setLabelingData((prev) => ({ ...prev, [level]: data }));
    if (currentLevelIndex < cognitiveLevels.length - 1) {
      setCurrentLevelIndex(currentLevelIndex + 1);
      setCurrentStep('typing');
    } else {
      setCurrentStep('summary');
    }
  };

  const handleReset = () => {
    setCurrentStep('participant');
    setParticipantData(null);
    setSessionData({});
    setNasaTLXData({});
    setLabelingData({});
    setCurrentLevelIndex(0);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Keystroke Dynamics Data Collector</h1>
        <p>Cognitive Burden Detection Applying Keystroke Dynamics</p>
      </header>

      <main className="App-main">
        {currentStep === 'participant' && (
          <ParticipantForm onSubmit={handleParticipantSubmit} />
        )}

        {currentStep === 'typing' && participantData && (
          <TypingInterface
            participantData={participantData}
            cognitiveLoadLevel={cognitiveLevels[currentLevelIndex]}
            onSubmit={handleTypingSubmit}
          />
        )}

        {currentStep === 'nasa-tlx' && participantData && sessionData[cognitiveLevels[currentLevelIndex]] && (
          <NasaTLXForm
            participantData={participantData}
            sessionData={sessionData[cognitiveLevels[currentLevelIndex]]}
            cognitiveLoadLevel={cognitiveLevels[currentLevelIndex]}
            onSubmit={handleNasaTLXSubmit}
          />
        )}

        {currentStep === 'labeling' && participantData && sessionData[cognitiveLevels[currentLevelIndex]] && nasaTLXData[cognitiveLevels[currentLevelIndex]] && (
          <CognitiveBurdenLabeling
            participantData={participantData}
            sessionData={sessionData[cognitiveLevels[currentLevelIndex]]}
            nasaTLXData={nasaTLXData[cognitiveLevels[currentLevelIndex]]}
            cognitiveLoadLevel={cognitiveLevels[currentLevelIndex]}
            onSubmit={handleLabelingSubmit}
          />
        )}

        {currentStep === 'summary' && participantData && Object.keys(sessionData).length === 3 && Object.keys(nasaTLXData).length === 3 && Object.keys(labelingData).length === 3 && (
          <Summary
            participantData={participantData}
            sessionData={sessionData}
            nasaTLXData={nasaTLXData}
            labelingData={labelingData}
            onReset={handleReset}
          />
        )}
      </main>

      <footer className="App-footer">
        <p>Step {currentStep === 'participant' ? 1 : currentStep === 'typing' ? 2 : currentStep === 'nasa-tlx' ? 3 : currentStep === 'labeling' ? 4 : 5} of 5</p>
      </footer>
    </div>
  );
}

export default App;
