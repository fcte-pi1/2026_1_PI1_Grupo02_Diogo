import { useState, useEffect } from "react";
import { AppState } from "../../App";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import Footer from "../../components/Footer";
import { useWebSocket } from "../../hooks/useWebSocket";
import type { SessionData } from "../../App";

import Dashboard from "../telemetry/DashboardScreen";
import ConnectView from "../network/ConnectView";
import HistoryScreen from "../history/HistoryScreen";
import TerminalWidget from "../telemetry/components/TerminalWidget";
import TestView from "../tests/testView";

interface MainLayoutProps {
  activeSession: SessionData | null;
  appState: AppState;
}

export default function MainLayout({ activeSession }: MainLayoutProps) {
  const [currentView, setCurrentView] = useState("dashboard");
  const [viewTerminal, setViewTerminal] = useState(true);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);

  const { robotData, sessionSteps, isConnected, connect, disconnect } = useWebSocket();

  useEffect(() => {
    if (robotData) {
      const horaAtual = new Date().toLocaleTimeString();
      const novaLinhaLog = `[${horaAtual}] [PASSO #${robotData.stepOrder}] 📍 X:${robotData.posX} Y:${robotData.posY} | ⚡ ${robotData.voltage}V | 🔌 ${robotData.current}mA`;

      setTerminalLogs((logsAnteriores) => [
        ...logsAnteriores.slice(-24),
        novaLinhaLog,
      ]);
    }
  }, [robotData]);

  const currentSessionName = activeSession?.sessionName || "Sessão Ativa";

  const renderContentView = () => {
    const connectionProps = {
      latency: isConnected ? "42" : "99",
    };

    switch (currentView) {
      case "dashboard":
        return (
          <Dashboard
            activeSession={activeSession}
            currentView={currentView}
            robotData={robotData}
            sessionSteps={sessionSteps}
            isConnected={isConnected}
            connectionProps={connectionProps}
          />
        );
      case "network":
        return (
          <ConnectView
            currentView={currentView}
            connectionProps={connectionProps}
            isConnected={isConnected}
          />
        );
      case "logs":
        return <HistoryScreen />;
      case "testes":
        return (
          <TestView 
            robotData={robotData}
            sessionSteps={sessionSteps}
            isConnected={isConnected}
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

      <Navbar
        sessionName={currentSessionName}
        appState={AppState.RUNNING}
        terminal={viewTerminal}
        setViewTerminal={setViewTerminal}
        currentView={currentView}
        isSocketConnected={isConnected}
        onConnect={connect}
        onDisconnect={disconnect}
      />

      <div className="flex flex-row flex-1 w-full overflow-hidden relative z-10">
        <Sidebar currentView={currentView} onNavigate={setCurrentView} />

        <div className="flex flex-1 flex-col h-full overflow-hidden">
          
          {/* O conteúdo da view ganha rolagem independente para não quebrar com o tamanho do terminal */}
          <div className="flex-1 overflow-y-auto min-h-0 relative">
            {renderContentView()}
          </div>

          {viewTerminal && (
            <div className="p-6 pt-0 shrink-0 w-full">
              <TerminalWidget
                activeSession={activeSession}
                status={isConnected}
                logs={terminalLogs}
                onClearLogs={() => setTerminalLogs([])}
                onClose={() => setViewTerminal(false)}
              />
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}