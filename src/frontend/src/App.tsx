import { useState, useEffect } from 'react';
import LoadingScreen from './features/main/LoadingScreen';
import MainLayout from './features/main/MainLayout';
import { useWebSocket } from './hooks/useWebSocket';

export enum AppState {
  LOADING = 'LOADING',
  RUNNING = 'RUNNING'
}

export interface SessionData {
  sessionName: string;
  algorithm: string;
  mode: string;
}

function App() {
  const [currentState, setCurrentState] = useState<AppState>(AppState.LOADING);
  
  const [activeSession] = useState<SessionData>({
    sessionName: 'Telemetria em Tempo Real',
    algorithm: 'Mapeamento Ativo',
    mode: 'Cockpit'
  });

  const { isConnected } = useWebSocket();

  useEffect(() => {
    if (currentState === AppState.LOADING) {
      const timer = setTimeout(() => {
        setCurrentState(AppState.RUNNING);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [currentState]);

  return (
    <div className="min-h-screen bg-background text-on-background">
      {currentState === AppState.LOADING && (
        <LoadingScreen 
          sessionName={activeSession.sessionName} 
          isSocketConnected={isConnected} 
        />
      )}
      
      {/* 🚀 CORRIGIDO: Alinhado exatamente com a assinatura de tipos de propriedades aceitas */}
      {currentState === AppState.RUNNING && (
        <MainLayout 
          activeSession={activeSession} 
          appState={currentState} 
        />
      )}
    </div>
  );
}

export default App;