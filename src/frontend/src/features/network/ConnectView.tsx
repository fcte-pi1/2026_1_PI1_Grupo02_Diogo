import { useState } from "react";
import { ConnectWidget } from "../../components/connectWidgets"; 
import { VisualizeDiv } from "../../components/VisualizeDiv";
import { Wifi, WifiOff, Battery, RefreshCw } from "lucide-react";
import { useWebSocket } from "../../hooks/useWebSocket"; 

interface ConnectViewProps {
  currentView: string;
  connectionProps: {
    latency: string;
  } | null;
  isConnected: boolean;
}

export default function ConnectView({
  currentView,
  connectionProps,
  isConnected,
}: ConnectViewProps) {
  const [latency, setLatency] = useState(42);
  const currentLatency = isConnected ? latency : 99;

  const { robotData } = useWebSocket();

  // Fallbacks defensivos para a posição iniciar em [0,0] se o robô estiver desligado
  const x = robotData?.posX ?? 0;
  const y = robotData?.posY ?? 0;

  return (
    <main className="w-full h-full p-6 flex flex-col gap-4 overflow-hidden bg-background select-none">
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-4 gap-4 overflow-y-auto">
        
        {/* COLUNA 1: Nós de Conexão Reativos */}
        <div className="flex flex-col gap-4 xl:col-span-1">
          <ConnectWidget
            title="Operator_Station"
            subtitle="Interface Operador > Servidor"
            status={isConnected ? "CONNECTED" : "DISCONNECTED"}
            txRate={isConnected ? "44.2KB/s" : "0.0KB/s"}
            rxRate={isConnected ? "12.8KB/s" : "0.0KB/s"}
            logs={isConnected ? ["ENTRY_44219_COORDINATES", "ENTRY_44220_HEARTBEAT"] : []}
          />
          <ConnectWidget
            title="UAV-Mouse-01"
            subtitle="ESP32 Firmware > Broker MQTT"
            status={isConnected ? "CONNECTED" : "DISCONNECTED"}
            txRate={isConnected ? "8.4KB/s" : "0.0KB/s"}
            rxRate={isConnected ? "42.1KB/s" : "0.0KB/s"}
            logs={isConnected ? ["SENSOR_ARRAY_STREAM", "MOTOR_FEEDBACK_RPM"] : []}
          />
          <ConnectWidget
            title="Banco_de_Dados_Central"
            subtitle="ORM Prisma > PostgreSQL"
            status={isConnected ? "CONNECTED" : "DISCONNECTED"}
            txRate={isConnected ? "1.2KB/s" : "0.0KB/s"}
            rxRate={isConnected ? "0.4KB/s" : "0.0KB/s"}
            logs={isConnected ? ["SESSION_LOG_PERSIST", "METRIC_AGGREGATION"] : []}
          />
        </div>

        <VisualizeDiv
          activeSession={null} 
          currentView={currentView}
          connectionProps={connectionProps ?? { latency: String(currentLatency) }} 
          isConnected={isConnected} 
          posX={x}
          posY={y}
        />

        {/* COLUNA 4: Telemetria de Infraestrutura Lateral Reativa */}
        <div className="flex flex-col gap-4 xl:col-span-1 font-mono">
          
          {/* Card de Força do Sinal Dinâmico */}
          <div className="bg-surface-container-low/60 border border-outline-variant/30 p-4">
            <div className="border-b border-outline-variant/20 mb-3">
              <h2 className="text-label-caps text-xs mb-3 font-bold text-on-surface-variant tracking-widest uppercase flex items-center gap-2">
                {isConnected ? (
                  <Wifi className="w-3.5 h-3.5 text-primary" data-testid="wifi-on-icon" strokeWidth={2} />
                ) : (
                  <WifiOff className="w-3.5 h-3.5 text-red-400" data-testid="wifi-off-icon" strokeWidth={2} />
                )}
                Sinal
              </h2>
            </div>

            <div className="flex items-end gap-2 mb-3 opacity-90">
              <div className={`w-full h-8 transition-all ${isConnected ? 'bg-emerald-500' : 'bg-surface-variant/20 border border-outline-variant/10'}`} data-testid="signal-bar"></div>
              <div className={`w-full h-10 transition-all ${isConnected ? 'bg-emerald-500' : 'bg-surface-variant/20 border border-outline-variant/10'}`} data-testid="signal-bar"></div>
              <div className={`w-full h-12 transition-all ${isConnected ? 'bg-emerald-500' : 'bg-surface-variant/20 border border-outline-variant/10'}`} data-testid="signal-bar"></div>
              <div className={`w-full h-14 transition-all ${isConnected ? 'bg-emerald-500' : 'bg-surface-variant/20 border border-outline-variant/10'}`} data-testid="signal-bar"></div>
              <div className={`w-full h-16 transition-all ${isConnected ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]' : 'bg-surface-variant/20 border border-outline-variant/10'}`} data-testid="signal-bar"></div>
            </div>
            
            <div className="flex justify-between text-[11px] font-bold pt-1">
              {isConnected ? (
                <span className="text-emerald-400 animate-pulse">STRONG</span>
              ) : (
                <span className="text-red-400">NO SIGNAL</span>
              )}
              <span className="text-outline">-{currentLatency} DBM</span>
            </div>
          </div>

          {/* Card de Célula de Energia */}
          <div className="bg-surface-container-low/60 border border-outline-variant/30 p-4 flex-1 flex flex-col justify-between">
            <div>
              <div className="border-b border-outline-variant/20 mb-3">
                <h2 className="text-label-caps text-xs mb-3 font-bold text-on-surface-variant tracking-widest uppercase flex items-center gap-2">
                  <Battery className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
                  POWER_ARRAY
                </h2>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-[10px] mb-1">
                  <span>PRIMARY_CELL</span>
                  <span className={isConnected ? "text-emerald-400" : "text-outline"}>{isConnected ? "92%" : "0%"}</span>
                </div>
                <div className="w-full h-1.5 bg-surface-container-high/40 border border-outline-variant/10">
                  <div
                    className={`h-full transition-all duration-500 ${isConnected ? 'bg-emerald-500' : 'bg-transparent'}`}
                    style={{ width: isConnected ? "92%" : "0%" }}
                    data-testid="primary-cell-bar"
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span>AUX_BUFFER</span>
                  <span className={isConnected ? "text-cyan-400" : "text-outline"}>{isConnected ? "45%" : "0%"}</span>
                </div>
                <div className="w-full h-1.5 bg-surface-container-high/40 border border-outline-variant/10">
                  <div
                    className={`h-full transition-all duration-500 ${isConnected ? 'bg-cyan-500' : 'bg-transparent'}`}
                    style={{ width: isConnected ? "45%" : "0%" }}
                    data-testid="aux-buffer-bar"
                  ></div>
                </div>
              </div>
            </div>

            <button
              disabled={!isConnected}
              onClick={() => setLatency(Math.floor(Math.random() * (60 - 30) + 30))}
              className={`w-full bg-transparent border text-[11px] font-bold uppercase tracking-widest py-2 mt-4 flex items-center justify-center gap-2 transition-all ${
                isConnected 
                  ? 'border-outline-variant hover:border-primary text-on-surface-variant hover:text-primary cursor-pointer' 
                  : 'border-outline-variant/20 text-outline/30 cursor-not-allowed'
              }`}
            >
              <RefreshCw className="w-3 h-3" /> Reestabelecer Redes
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}