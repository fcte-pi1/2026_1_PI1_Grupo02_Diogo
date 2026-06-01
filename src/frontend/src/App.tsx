import { useState, useEffect } from 'react';
import LoadingScreen from './features/main/LoadingScreen';
import MainLayout from './features/main/MainLayout';
import { useWebSocket } from './hooks/useWebSocket';

export enum AppState {
  LOADING = 'LOADING',
  RUNNING = 'RUNNING'
}

interface SessionData {
  sessionName: string;
  algorithm: string;
  mode: string;
}

function App() {
  const [currentState, setCurrentState] = useState<AppState>(AppState.LOADING);
  
  // Como o início é automático, definimos os metadados padrões da sessão passiva
  const [activeSession] = useState<SessionData>({
    sessionName: 'Telemetria em Tempo Real',
    algorithm: 'Mapeamento Ativo',
    mode: 'Cockpit'
  });

  // 🔌 O hook roda globalmente coletando a saúde do sistema
  const { isConnected } = useWebSocket();

  // Passa do Loading para o Dashboard após 3 segundos
  useEffect(() => {
    if (currentState === AppState.LOADING) {
      const timer = setTimeout(() => {
        setCurrentState(AppState.RUNNING);
      }, 2000); // 2 segundos de loading temático

      return () => clearTimeout(timer);
    }
  }, [currentState]);

  return (
    <div className="min-h-screen bg-background text-on-background">
      {/* 1º Estado: Tela de Carregamento / Handshake */}
      {currentState === AppState.LOADING && (
        <LoadingScreen 
          sessionName={activeSession.sessionName} 
          isSocketConnected={isConnected} 
        />
      )}
      
      {/* 2º Estado: Dashboard Principal */}
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