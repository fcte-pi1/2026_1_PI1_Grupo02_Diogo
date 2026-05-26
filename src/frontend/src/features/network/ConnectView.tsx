import { useState } from "react";
import { ConnectWidget } from "../../components/connectWidgets";
import { VisualizeDiv } from "../../components/VisualizeDiv";
import { Wifi, Battery, RefreshCw } from "lucide-react";

interface ConnectViewProps {
  currentView: string;
  connectionProps: {
    latency: string;
  } | null;
}

export default function ConnectView({
  currentView,
  connectionProps,
}: ConnectViewProps) {
  const [latency, setLatency] = useState(42);

  return (
    <main className="w-full h-full p-6 flex flex-col gap-4 overflow-hidden bg-background select-none">
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-4 gap-4 overflow-y-auto">
        {/* COLUNA 1: Nós de Conexão */}
        <div className="flex flex-col gap-4 xl:col-span-1">
          <ConnectWidget
            title="Operator_Station"
            subtitle="Interface Operador > Servidor"
            status="CONNECTED"
            txRate="44.2KB/s"
            rxRate="12.8KB/s"
            logs={["ENTRY_44219_COORDINATES", "ENTRY_44220_HEARTBEAT"]}
          />
          <ConnectWidget
            title="UAV-Mouse-01"
            subtitle="ESP32 Firmware > Broker MQTT"
            status="CONNECTED"
            txRate="8.4KB/s"
            rxRate="42.1KB/s"
            logs={["SENSOR_ARRAY_STREAM", "MOTOR_FEEDBACK_RPM"]}
          />
          <ConnectWidget
            title="Banco_de_Dados_Central"
            subtitle="ORM Prisma > PostgreSQL"
            status="CONNECTING"
            txRate="1.2KB/s"
            rxRate="0.4KB/s"
            logs={["SESSION_LOG_PERSIST", "METRIC_AGGREGATION"]}
          />
        </div>

        {/* COLUNA 2 & 3: Painel Central Inteligente Reutilizado */}
        <VisualizeDiv
          activeSession={null} // Passa null estruturado sem quebrar o objeto do tipo
          currentView={currentView}
          connectionProps={connectionProps ?? { latency: String(latency) }}
        />

        {/* COLUNA 4: Telemetria de Infraestrutura Lateral */}
        <div className="flex flex-col gap-4 xl:col-span-1 font-mono">
          {/* Card de Força do Sinal */}
          <div className="bg-surface-container-low/60 border border-outline-variant/30 p-4">
            <div className="border-b border-outline-variant/20 mb-3">
              <h2 className="text-label-caps text-xs mb-3 font-bold text-on-surface-variant tracking-widest uppercase flex items-center gap-stack-sm">
                <Wifi className="w-3.5 h-3.5" strokeWidth={2} />
                Sinal
              </h2>
            </div>

            <div className="flex items-end gap-2 mb-3">
              <div className="w-full h-8 bg-emerald-500"></div>
              <div className="w-full h-10 bg-emerald-500"></div>
              <div className="w-full h-12 bg-emerald-500"></div>
              <div className="w-full h-14 bg-emerald-500"></div>
              <div className="w-full h-16 bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]"></div>
            </div>
            <div className="flex justify-between text-[11px] font-bold pt-1">
              <span className="text-emerald-400">STRONG</span>
              <span className="text-outline">-{latency} DBM</span>
            </div>
          </div>

          {/* Card de Célula de Energia */}
          <div className="bg-surface-container-low/60 border border-outline-variant/30 p-4 flex-1 flex flex-col justify-between">
            <div>
              <div className="border-b border-outline-variant/20 mb-3">
                <h2 className="text-label-caps text-xs mb-3 font-bold text-on-surface-variant tracking-widest uppercase flex items-center gap-stack-sm">
                  <Battery className="w-3.5 h-3.5" strokeWidth={2} />
                  POWER_ARRAY
                </h2>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-[10px] mb-1">
                  <span>PRIMARY_CELL</span>
                  <span className="text-emerald-400">92%</span>
                </div>
                <div className="w-full h-1.5 bg-surface-container-high">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: "92%" }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span>AUX_BUFFER</span>
                  <span className="text-cyan-400">45%</span>
                </div>
                <div className="w-full h-1.5 bg-surface-container-high">
                  <div
                    className="h-full bg-cyan-500"
                    style={{ width: "45%" }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Ações manuais solicitadas na Issue */}
            <button
              onClick={() =>
                setLatency(Math.floor(Math.random() * (60 - 30) + 30))
              }
              className="w-full bg-transparent border border-outline-variant hover:border-primary text-on-surface-variant hover:text-primary transition-colors text-[11px] font-bold uppercase tracking-widest py-2 mt-4 flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Reestabelecer Redes
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
