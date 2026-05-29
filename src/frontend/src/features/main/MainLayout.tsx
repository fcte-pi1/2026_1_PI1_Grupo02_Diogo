import { useState, useEffect } from "react";
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
  appState: AppState;
}

export default function MainLayout({
  activeSession,
}: MainLayoutProps) {
  const [currentView, setCurrentView] = useState("dashboard");
  const [viewTerminal, setViewTerminal] = useState(true);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);

  // Chamada unificada do coração de dados do WebSocket
  const { robotData, isConnected, sendRaceAction, connect, disconnect } =
    useWebSocket();

  // Toda vez que o hook receber um dado novo do robô,
  useEffect(() => {
    if (robotData) {
      const horaAtual = new Date().toLocaleTimeString();
      
      const novaLinhaLog = `[${horaAtual}] [PASSO #${robotData.stepOrder}] 📍 X:${robotData.posX} Y:${robotData.posY} | ⚡ ${robotData.voltage}V | 🔌 ${robotData.current}mA`;
      
      // Adiciona o novo log na lista (mantendo apenas os últimos 25 logs para não estourar a memória)
      setTerminalLogs((logsAnteriores) => [...logsAnteriores.slice(-25), novaLinhaLog]);
    }
  }, [robotData]); // ◄ Executa esse bloco SEMPRE que robotData mudar

  const currentSessionName = activeSession?.sessionName || "Sessão Ativa";

  // Lógica de renderização do miolo da tela baseada na Sidebar
  const renderContentView = () => {
    const connectionProps = {
      latency: robotData ? String(robotData.voltage) : "0",
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
        onRaceAction={sendRaceAction}
        isSocketConnected={isConnected}
        onConnect={connect}
        onDisconnect={disconnect}
      />

      <div className="flex flex-row flex-1 w-full overflow-hidden relative z-10">
        <Sidebar
          currentView={currentView}
          onNavigate={setCurrentView}
        />

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