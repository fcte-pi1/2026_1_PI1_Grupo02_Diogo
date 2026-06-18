import { useState, useEffect } from "react";
import { AppState } from "../../App";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import Footer from "../../components/Footer";
import { useWebSocket } from "../../hooks/useWebSocket";

import Dashboard from "../telemetry/DashboardScreen";
import ConnectView from "../network/ConnectView";
import HistoryScreen from "../history/HistoryScreen";
import TerminalWidget from "../telemetry/components/TerminalWidget";

interface MainLayoutProps {
  // 🚀 AJUSTADO: Mudado para aceitar a estrutura flexível/completa da sessão do Prisma
  activeSession: any;
  appState: AppState;
}

export default function MainLayout({ activeSession }: MainLayoutProps) {
  const [currentView, setCurrentView] = useState("dashboard");
  const [viewTerminal, setViewTerminal] = useState(true);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);

  // O sendRaceAction pode ser removido daqui se não for usado em outro lugar do layout
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
    // Tratamento defensivo de propriedades de rede
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

        <div className="flex flex-1 flex-col justify-between h-full">
          <div className="flex-1 overflow-hidden">{renderContentView()}</div>

          {viewTerminal && (
            <div className="p-6 pt-0">
              <TerminalWidget
                activeSession={activeSession}
                status={isConnected}
                logs={terminalLogs}
                onClearLogs={() => setTerminalLogs([])}
              />
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
