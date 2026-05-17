import { useState } from 'react';
import WelcomeScreen from './features/main/WelcomeScreen';
import LoadingScreen from './features/main/LoadingScreen';
import MainLayout from './features/main/MainLayout';

export enum AppState {
  WELCOME = 'WELCOME',
  LOADING = 'LOADING',
  RUNNING = 'RUNNING'
}

interface SessionData {
  sessionName: string;
  algorithm: string;
  mode: string;
}

function App() {
  const [currentState, setCurrentState] = useState<AppState>(AppState.WELCOME);
  const [activeSession, setActiveSession] = useState<SessionData | null>(null);

  const handleStartSession = (data: SessionData) => {
    setActiveSession(data);
    setCurrentState(AppState.LOADING);

    setTimeout(() => {
      setCurrentState(AppState.RUNNING);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-background text-on-background">
      {currentState === AppState.WELCOME && (
        <WelcomeScreen onStart={handleStartSession} appState={currentState}/>
      )}
      
      {currentState === AppState.LOADING && (
        <LoadingScreen sessionName={activeSession?.sessionName || 'ENSAIO_ATIVO'} />
      )}
      
      {currentState === AppState.RUNNING && (
        // qnd estiver rodando, chama o layout que gerencia a Sidebar e o Switch interno
        <MainLayout activeSession={activeSession} setCurrentState={setCurrentState} appState={currentState} />
      )}
    </div>
  );
}

export default App;