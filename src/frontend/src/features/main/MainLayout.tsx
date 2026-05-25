import { useState } from "react";
import { AppState } from "../../App";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import Footer from "../../components/Footer";

// Importação das suas visualizações modulares
import Dashboard from "../telemetry/DashboardScreen";
import ConnectView from "../network/ConnectView";
import TerminalWidget from "../telemetry/components/TerminalWidget";
// import ConnectView from '../network/ConnectView';
// import ConfigView from '../config/ConfigView';

interface MainLayoutProps {
  activeSession: {
    sessionName: string;
    algorithm: string;
    mode: string;
  } | null;
  setCurrentState: React.Dispatch<React.SetStateAction<AppState>>;
  appState: AppState;
  connectionProps: {
    latency: string;
  } | null;
}

export default function MainLayout({
  activeSession,
  setCurrentState,
  connectionProps,
}: MainLayoutProps) {
  // O ESTADO DE NAVEGAÇÃO INTERNA NASCEU AQUI:
  const [currentView, setCurrentView] = useState("dashboard");
  const [viewTerminal, setViewTerminal] = useState(true);

  const currentSessionName = activeSession?.sessionName || "Sessão Ativa";

  // Lógica de renderização do miolo da tela baseada na Sidebar
  const renderContentView = () => {
    switch (currentView) {
      case "dashboard":
        return (
          <Dashboard
            activeSession={activeSession}
            viewTerminal={viewTerminal}
            currentView={currentView} // 🚀 Passa o estado dinâmico (não a string fixa)
            connectionProps={connectionProps}
          />
        );
      case "network":
        return (
          <ConnectView
            currentView={currentView} // 🚀 Passa o estado dinâmico ("network")
            connectionProps={connectionProps}
          />
        );
      case "logs":
        return "AOBA";
      case "config":
        return (
          <div className="p-container-padding text-space text-headline-md text-tertiary-fixed-dim">
            [ TELA DE CONFIGURAÇÕES: Calibração de PID dos Motores ]
          </div>
        );
      default:
        return (
          <Dashboard
            activeSession={activeSession}
            viewTerminal={viewTerminal}
            currentView={currentView}
            connectionProps={connectionProps}
          />
        );
    }
  };

  return (
    <div className="h-screen w-full bg-background bg-grid flex flex-col overflow-hidden text-on-background relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,#111317_100%)] pointer-events-none z-0" />

      {/* 1. Navbar fixa no topo */}
      <Navbar
        sessionName={currentSessionName}
        appState={AppState.RUNNING}
        terminal={viewTerminal}
        setViewTerminal={setViewTerminal}
        currentView={currentView}
      />

      {/* 2. Corpo do Meio: Ocupa o espaço restante entre o Header e o seu novo Footer */}
      <div className="flex flex-row flex-1 w-full overflow-hidden relative z-10">
        <Sidebar
          currentView={currentView}
          onNavigate={setCurrentView}
          setCurrentState={setCurrentState}
        />

        <div className="flex flex-1 flex-col justify-between h-full">
          <div className="flex-1 overflow-hidden">{renderContentView()}</div>

          {/* Terminal acoplado na base da visualização */}
          {viewTerminal && (
            <div className="p-6 pt-0">
              <TerminalWidget activeSession={activeSession} status={false} />
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
