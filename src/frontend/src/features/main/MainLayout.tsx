import { useState } from "react";
import { AppState } from "../../App";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import Footer from "../../components/Footer";

// Importação do hook customizado
import { useWebSocket } from "../../hooks/useWebSocket";

// Importação das suas visualizações modulares
import Dashboard from "../telemetry/DashboardScreen";
import ConnectView from "../network/ConnectView";
import TerminalWidget from "../telemetry/components/TerminalWidget";

interface MainLayoutProps {
  activeSession: {
    sessionName: string;
    algorithm: string;
    mode: string;
  } | null;
  setCurrentState: React.Dispatch<React.SetStateAction<AppState>>;
  appState: AppState;
}

export default function MainLayout({
  activeSession,
  setCurrentState,
}: MainLayoutProps) {
  const [currentView, setCurrentView] = useState("dashboard");
  const [viewTerminal, setViewTerminal] = useState(true);

  // Chamada unificada do coração de dados do WebSocket
  const { robotData, isConnected, sendRaceAction, connect, disconnect } =
    useWebSocket();

  const currentSessionName = activeSession?.sessionName || "Sessão Ativa";

  // Lógica de renderização do miolo da tela baseada na Sidebar
  const renderContentView = () => {
    // ✅ Gerado localmente com base nos dados dinâmicos do robô
    const connectionProps = {
      latency: robotData ? String(robotData.temperature) : "0",
    };

    switch (currentView) {
      case "dashboard":
        return (
          <Dashboard
            activeSession={activeSession}
            currentView={currentView}
            robotData={robotData}
            connectionProps={connectionProps}
          />
        );
      case "network":
        return (
          <ConnectView 
            currentView={currentView} 
            connectionProps={connectionProps}
            isConnected={isConnected} // 🚀 ESTA É A INJEÇÃO CRÍTICA DA PROP REAL DO HOOK!
          />
        );
      default:
        return (
          <div className="p-6 font-mono text-xs text-outline">
            [ERRO] Aba não encontrada ou não implementada.
          </div>
        );
    }
  };

  return (
    <div className="h-screen w-full bg-background bg-grid flex flex-col overflow-hidden text-on-background relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,#111317_100%)] pointer-events-none z-0" />

      {/* Navbar configurada com as ações do WebSocket */}
      <Navbar
        sessionName={currentSessionName}
        appState={AppState.RUNNING}
        terminal={viewTerminal}
        setViewTerminal={setViewTerminal}
        currentView={currentView}
        onRaceAction={sendRaceAction}
        // Novas propriedades mapeadas:
        isSocketConnected={isConnected}
        onConnect={connect}
        onDisconnect={disconnect}
      />

      <div className="flex flex-row flex-1 w-full overflow-hidden relative z-10">
        <Sidebar
          currentView={currentView}
          onNavigate={setCurrentView}
          setCurrentState={setCurrentState}
        />

        <div className="flex flex-1 flex-col justify-between h-full">
          <div className="flex-1 overflow-hidden">{renderContentView()}</div>

          {viewTerminal && (
            <div className="p-6 pt-0">
              <TerminalWidget
                activeSession={activeSession}
                status={isConnected}
              />
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
