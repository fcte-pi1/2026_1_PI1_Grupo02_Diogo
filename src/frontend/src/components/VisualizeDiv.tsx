import { useState, useEffect } from "react";
import { Database, ComponentIcon, ComputerIcon, Eye, Activity } from "lucide-react";

interface VisualizeDivProps {
  activeSession: {
    sessionName: string;
    algorithm: string;
    mode: string;
  } | null;
  currentView: string; // View padrão inicial vinda do MainLayout
  connectionProps: {
    latency: string;
  };
}

export function VisualizeDiv({
  activeSession,
  currentView,
  connectionProps,
}: VisualizeDivProps) {
  // ESTADO INTERNO INDEPENDENTE: Nasce com o valor da prop, mas pode mudar localmente
  const [internalSubView, setInternalSubView] = useState(currentView);

  // Sincroniza o estado interno se o usuário mudar de aba de verdade na Sidebar
  useEffect(() => {
    setInternalSubView(currentView);
  }, [currentView]);

  const renderContentView = () => {
    switch (internalSubView) {
      case "dashboard":
        return (
          <div className="bg-surface-container-low/60 border border-outline-variant/30 p-6 flex flex-col h-full min-h-\[350px]\ w-full relative">
            {/* Header de Coordenadas */}
            <div className="text-[10px] justify-between font-mono text-outline uppercase tracking-widest flex items-center gap-2 w-full mb-6">
              <span className="flex items-center gap-1">Mapeamento do labirinto</span>
              <div className="flex items-center gap-3">
                <span className="text-[9px] px-2 py-0.5 border border-outline-variant/30 font-mono tracking-wider text-on-surface">
                  COORDSS: X-1, Y-1
                </span>
                <button 
                  onClick={() => setInternalSubView("network")}
                  className="text-[9px] px-2 py-0.5 border border-primary/40 text-primary bg-primary/5 hover:bg-primary/10 transition-colors font-mono tracking-wider cursor-pointer flex items-center gap-1"
                >
                  <Activity className="w-2.5 h-2.5" /> Ver Rede
                </button>
              </div>
            </div>
            
            {/* Miolo do Labirinto */}
            <div className="flex flex-col items-center justify-center flex-1">
              <div className="font-mono text-xs text-center text-primary uppercase tracking-wider">
                [ LABIRINTO CENTRAL - ALGORITMO: {activeSession?.algorithm || "NENHUM"} ]
              </div>
            </div>
          </div>
        );

      case "network":
      default:
        return (
          <div className="bg-surface-container-low/60 border border-outline-variant/30 p-6 flex flex-col h-full min-h-\[350px]\ w-full min-w-\[280px]\ relative justify-between">
            {/* Header de Rede */}
            <div className="text-[10px] justify-between font-mono text-outline uppercase tracking-widest flex items-center gap-2 w-full mb-6">
              <span className="flex items-center gap-1">Topologia rede ativa</span>
              <div className="flex items-center gap-3">
                <span className="text-[9px] px-2 py-0.5 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono tracking-wider uppercase">
                  online
                </span>
                {currentView === "dashboard" && (
                  <button 
                    onClick={() => setInternalSubView("dashboard")}
                    className="text-[9px] px-2 py-0.5 border border-cyan-500/40 text-cyan-400 bg-cyan-950/20 hover:bg-cyan-950/40 transition-colors font-mono tracking-wider cursor-pointer flex items-center gap-1"
                  >
                    <Eye className="w-2.5 h-2.5" /> Ver Mapa
                  </button>
                )}
              </div>
            </div>

            {/* Mapeamento de Nós Gráficos */}
            <div className="flex items-center gap-4 md:gap-8 w-full justify-center flex-1">
              {/* Estação */}
              <div className="flex flex-col items-center text-center font-mono">
                <div className="p-4 border border-cyan-500/30 bg-cyan-950/10 text-cyan-400 mb-2">
                  <span className="text-xl">
                    <ComputerIcon />
                  </span>
                </div>
                <span className="text-[11px] font-bold text-primary tracking-wider">
                  OPERATOR_STATION
                </span>
                <span className="text-[9px] text-outline">192.168.1.1</span>
              </div>

              {/* Linha Conectora 1 */}
              <div className="h-\[1px]\ bg-outline-variant/40 flex-1 max-w-\[60px]\"></div>

              {/* Rato */}
              <div className="flex flex-col items-center text-center font-mono relative">
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                <div className="p-4 border border-emerald-500 bg-emerald-950/20 text-emerald-400 mb-2 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  <span className="text-xl">
                    <ComponentIcon />
                  </span>
                </div>
                <span className="text-[11px] font-bold text-emerald-400 tracking-wider">
                  UAV-MOUSE-01
                </span>
                <span className="text-[9px] text-outline">
                  RSSI: -{connectionProps.latency}dBm
                </span>
              </div>

              {/* Linha Conectora 2 */}
              <div className="h-\[1px]\ bg-outline-variant/40 flex-1 max-w-\[60px]\"></div>

              {/* Banco */}
              <div className="flex flex-col items-center text-center font-mono">
                <div className="p-4 border border-outline-variant/40 bg-surface-container-low text-outline mb-2">
                  <span className="text-xl">
                    <Database />
                  </span>
                </div>
                <span className="text-[11px] font-bold text-on-surface-variant tracking-wider">
                  BANCO_DE_DADOS
                </span>
                <span className="text-[9px] text-outline">
                  SINCRONIA ATIVA
                </span>
              </div>
            </div>
          </div>
        );
    }
  };

  // Envelopamento externo unificado ocupando as 2 colunas da Grid global
  return (
    <div className="flex flex-col h-full lg:col-span-2">
      {renderContentView()}
    </div>
  );
}