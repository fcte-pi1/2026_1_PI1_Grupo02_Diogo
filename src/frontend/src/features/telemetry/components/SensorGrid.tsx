import { useEffect, useState } from "react";
import { Radar, ShieldAlert } from "lucide-react";

export type SensorChannel = "front" | "left" | "right";

export interface SensorReading {
  cm: number;
  /** Ex.: PAREDE, 1 PASSO, 2 PASSOS, LIVRE */
  label?: string;
  detalhe?: string;
}

interface SensorGridProps {
  sensorData: {
    left: number | SensorReading;
    front: number | SensorReading;
    right: number | SensorReading;
  };
  /** Incrementa a cada nova leitura (movimento / parede) para disparar o pulso visual. */
  scanTick?: number;
  /** Se false, só mostra estado estático (ex.: histórico sem interação). */
  interactive?: boolean;
}

const CRITICAL_DIST = 8;
const WARNING_DIST = 20;

function normalizeReading(
  value: number | SensorReading | undefined,
): SensorReading {
  if (typeof value === "number") {
    return { cm: value };
  }
  return value ?? { cm: 0 };
}

function channelTone(dist: number): "critical" | "warning" | "clear" {
  if (dist <= CRITICAL_DIST) return "critical";
  if (dist <= WARNING_DIST) return "warning";
  return "clear";
}

function channelClasses(
  tone: "critical" | "warning" | "clear",
  pinging: boolean,
) {
  const base =
    "relative overflow-hidden border text-[11px] font-mono transition-all duration-200 select-none";
  const pingRing = pinging ? " ring-2 ring-cyan-400/70 scale-[1.02]" : "";

  switch (tone) {
    case "critical":
      return `${base}${pingRing} bg-red-500/20 border-red-500 text-red-300 animate-pulse`;
    case "warning":
      return `${base}${pingRing} bg-amber-500/15 border-amber-500/60 text-amber-300`;
    default:
      return `${base}${pingRing} bg-emerald-500/10 border-emerald-500/40 text-emerald-300/90`;
  }
}

function defaultLabel(cm: number): string {
  if (cm <= CRITICAL_DIST) return "PAREDE";
  const passos = Math.max(1, Math.round(cm / 18));
  if (passos <= 1) return "1 PASSO";
  if (passos >= 4) return "LIVRE";
  return `${passos} PASSOS`;
}

export default function SensorGrid({
  sensorData,
  scanTick = 0,
  interactive = true,
}: SensorGridProps) {
  const [pinging, setPinging] = useState<Record<SensorChannel, boolean>>({
    front: false,
    left: false,
    right: false,
  });
  const [manualScan, setManualScan] = useState(0);

  const triggerPing = (channels: SensorChannel[]) => {
    setPinging((prev) => {
      const next = { ...prev };
      channels.forEach((channel) => {
        next[channel] = true;
      });
      return next;
    });

    window.setTimeout(() => {
      setPinging((prev) => {
        const next = { ...prev };
        channels.forEach((channel) => {
          next[channel] = false;
        });
        return next;
      });
    }, 450);
  };

  useEffect(() => {
    if (scanTick <= 0) return;
    triggerPing(["front", "left", "right"]);
  }, [scanTick]);

  useEffect(() => {
    if (manualScan <= 0) return;
    triggerPing(["front", "left", "right"]);
  }, [manualScan]);

  const handleChannelClick = (channel: SensorChannel) => {
    if (!interactive) return;
    triggerPing([channel]);
  };

  const handleSweep = () => {
    if (!interactive) return;
    setManualScan((n) => n + 1);
  };

  const front = normalizeReading(sensorData.front);
  const left = normalizeReading(sensorData.left);
  const right = normalizeReading(sensorData.right);

  const channels: Array<{
    id: SensorChannel;
    title: string;
    reading: SensorReading;
    layout: string;
  }> = [
    {
      id: "front",
      title: "FRENTE",
      reading: front,
      layout: "w-full p-3 text-center",
    },
    {
      id: "left",
      title: "ESQ",
      reading: left,
      layout: "p-3 flex flex-col justify-center items-center h-full",
    },
    {
      id: "right",
      title: "DIR",
      reading: right,
      layout: "p-3 flex flex-col justify-center items-center h-full",
    },
  ];

  return (
    <div
      data-testid="sensor-grid"
      className="bg-surface-container-low/60 border border-outline-variant/30 backdrop-blur-md p-stack-md flex flex-col rounded-none w-full h-full"
    >
      <div className="border-b border-outline-variant/20 shrink-0 flex items-center justify-between gap-2 pb-2">
        <h2 className="text-label-caps text-xs font-bold text-on-surface-variant tracking-widest uppercase flex items-center gap-stack-sm">
          <ShieldAlert
            className="w-3.5 h-3.5 text-tertiary-container"
            strokeWidth={2}
          />
          Sensores de proximidade
        </h2>
        {interactive && (
          <button
            type="button"
            data-testid="sensor-sweep"
            onClick={handleSweep}
            className="inline-flex items-center gap-1 border border-cyan-500/40 bg-cyan-500/10 px-2 py-1 text-[9px] uppercase tracking-wider text-cyan-300 hover:bg-cyan-500/20 transition-colors"
            title="Disparar leitura nos 3 sensores"
          >
            <Radar className="w-3 h-3" /> Scan
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-start pt-5 pb-2 font-mono overflow-y-auto">
        <div className="w-52 flex flex-col gap-2 shrink-0">
          {channels.slice(0, 1).map((channel) => {
            const tone = channelTone(channel.reading.cm);
            const label =
              channel.reading.label ?? defaultLabel(channel.reading.cm);
            return (
              <button
                key={channel.id}
                type="button"
                data-testid={`sensor-${channel.id}`}
                data-tone={tone}
                data-label={label}
                data-pinging={pinging[channel.id] ? "true" : undefined}
                disabled={!interactive}
                onClick={() => handleChannelClick(channel.id)}
                className={`${channel.layout} ${channelClasses(tone, pinging[channel.id])} ${
                  interactive ? "cursor-pointer hover:brightness-110" : "cursor-default"
                }`}
                aria-label={`${channel.title} ${label}`}
                title={label}
              >
                {pinging[channel.id] && (
                  <span className="pointer-events-none absolute inset-0 bg-cyan-400/10 animate-pulse" />
                )}
                <div className="relative z-[1] flex flex-col items-center gap-1">
                  <span className="text-[9px] uppercase tracking-widest opacity-80">
                    {channel.title}
                  </span>
                  <span
                    data-testid={`sensor-${channel.id}-label`}
                    className="font-telemetry font-bold text-sm uppercase tracking-wider"
                  >
                    {label}
                  </span>
                </div>
              </button>
            );
          })}

          <div className="grid grid-cols-2 gap-2 h-24">
            {channels.slice(1).map((channel) => {
              const tone = channelTone(channel.reading.cm);
              const label =
                channel.reading.label ?? defaultLabel(channel.reading.cm);
              return (
                <button
                  key={channel.id}
                  type="button"
                  data-testid={`sensor-${channel.id}`}
                  data-tone={tone}
                  data-label={label}
                  data-pinging={pinging[channel.id] ? "true" : undefined}
                  disabled={!interactive}
                  onClick={() => handleChannelClick(channel.id)}
                  className={`${channel.layout} ${channelClasses(tone, pinging[channel.id])} ${
                    interactive ? "cursor-pointer hover:brightness-110" : "cursor-default"
                  }`}
                  aria-label={`${channel.title} ${label}`}
                  title={label}
                >
                  {pinging[channel.id] && (
                    <span className="pointer-events-none absolute inset-0 bg-cyan-400/10 animate-pulse" />
                  )}
                  <div className="relative z-[1] flex flex-col items-center gap-1">
                    <span className="text-[9px] uppercase tracking-widest opacity-80">
                      {channel.title}
                    </span>
                    <span
                      data-testid={`sensor-${channel.id}-label`}
                      className="font-telemetry font-bold text-sm uppercase tracking-wider"
                    >
                      {label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
