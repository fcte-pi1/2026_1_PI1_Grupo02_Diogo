import { useState } from 'react';
import WelcomeScreen from './features/main/WelcomeScreen';
import LoadingScreen from './features/main/LoadingScreen';
import MainLayout from './features/main/MainLayout';
import { useWebSocket } from './hooks/useWebSocket'; // 🚀 Injetado no topo global

export enum AppState {
  WELCOME = 'WELCOME',
  LOADING = 'LOADING',
  IDLE = 'IDLE',
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

  // 🔌 O hook roda globalmente coletando a saúde do sistema desde o setup
  const { isConnected } = useWebSocket();

  const handleStartSession = (data: SessionData) => {
    setActiveSession(data);
    setCurrentState(AppState.LOADING);

    // Mantém os 3 segundos de loading temático do rato correndo
    setTimeout(() => {
      setCurrentState(AppState.RUNNING);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-background text-on-background">
      {currentState === AppState.WELCOME && (
        <WelcomeScreen 
          onStart={handleStartSession} 
          appState={currentState}
          isSocketConnected={isConnected} // 🟢 Passa o status real para as bolinhas
        />
      )}
      
      {currentState === AppState.LOADING && (
        <LoadingScreen 
          sessionName={activeSession?.sessionName || 'ENSAIO_ATIVO'} 
          isSocketConnected={isConnected} // 🟢 Passa para o log do handshake
        />
      )}
      
      {currentState === AppState.RUNNING && (
        <MainLayout 
          activeSession={activeSession} 
          setCurrentState={setCurrentState} 
          appState={currentState} 
        />
      )}
    </div>
  );
}

export default App;