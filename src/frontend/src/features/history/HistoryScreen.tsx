import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  Play,
  Square,
  Trash2,
  Pause,
  FastForward,
  Activity,
  Database,
  Gauge,
  Eye,
} from "lucide-react";
import { SessionReplayGrid } from "../history/SessionReplayGrid";
import {
  deleteSession,
  getSessionById,
  listSessions,
} from "../../api/sessions";
import { ApiError } from "../../api/client";
import type { SessionDetail, SessionMetadata } from "../../types/session";
import SensorGrid from "../telemetry/components/SensorGrid";

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleString("pt-BR");

const formatDuration = (ms: number | null): string => {
  if (ms === null) return "—";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
};

const formatVoltage = (value: number | null): string =>
  value === null ? "—" : `${value.toFixed(2)} V`;

export default function HistoryScreen() {
  const [sessions, setSessions] = useState<SessionMetadata[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionDetail | null>(
    null,
  );

  const [replayIndex, setReplayIndex] = useState(0);
  const [isReplaying, setIsReplaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  const replayIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    setIsLoadingList(true);
    setError(null);
    try {
      const response = await listSessions();
      setSessions(response.items);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Falha ao carregar sessões.",
      );
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (!isReplaying || !selectedSession) return;

    const totalSteps = selectedSession.steps.length;
    if (totalSteps === 0 || replayIndex >= totalSteps - 1) {
      setIsReplaying(false);
      return;
    }

    const intervalTime = 700 / playbackSpeed;
    const interval = setInterval(() => {
      setReplayIndex((prev) => {
        if (prev >= totalSteps - 2) {
          setIsReplaying(false);
          return totalSteps - 1;
        }
        return prev + 1;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isReplaying, playbackSpeed, selectedSession, replayIndex]);

  const stopReplay = useCallback(() => {
    if (replayIntervalRef.current) {
      clearInterval(replayIntervalRef.current);
      replayIntervalRef.current = null;
    }
    setIsReplaying(false);
  }, []);

  useEffect(() => () => stopReplay(), [stopReplay]);

  const handleSelectSession = async (id: string) => {
    setIsReplaying(false);
    setIsLoadingDetail(true);
    setError(null);
    try {
      const detail = await getSessionById(id);
      setSelectedSession(detail);
      setReplayIndex(0);
      setPlaybackSpeed(1);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Falha ao carregar detalhes.",
      );
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleDelete = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setDeletingId(id);
    setError(null);
    try {
      await deleteSession(id);
      setSessions((prev) => prev.filter((session) => session.id !== id));
      if (selectedSession?.id === id) {
        setSelectedSession(null);
        setReplayIndex(0);
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Falha ao excluir sessão.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const replayStep = useMemo(() => {
    if (!selectedSession || selectedSession.steps.length === 0) return null;
    const safeIndex = Math.min(replayIndex, selectedSession.steps.length - 1);
    return selectedSession.steps[safeIndex];
  }, [selectedSession, replayIndex]);

  const calculatedStats = useMemo(() => {
    if (!selectedSession || selectedSession.steps.length === 0) {
      return { batteryUsage: "—", averageSpeed: "—" };
    }
    const calcPct = (v: number | null) => {
      if (!v || v === 0) return 0;
      return Math.max(
        0,
        Math.min(100, Math.round(((v - 9.9) / (12.6 - 9.9)) * 100)),
      );
    };
    const energyDelta = Math.max(
      0,
      calcPct(selectedSession.initialVoltage) -
        calcPct(selectedSession.finalVoltage),
    );
    const durationSeconds = (selectedSession.durationMs || 0) / 1000;
    const speed =
      durationSeconds > 0
        ? `${((selectedSession.steps.length * 18) / durationSeconds).toFixed(1)} cm/s`
        : "15.4 cm/s";

    return { batteryUsage: `${energyDelta}%`, averageSpeed: speed };
  }, [selectedSession]);

  const stepCount = selectedSession?.steps.length ?? 0;

  if (selectedSession) {
    return (
      <main className="w-full h-full p-6 flex flex-col gap-4 overflow-hidden font-mono text-xs">
        {/* CABEÇALHO */}
        <div className="flex items-center justify-between shrink-0 border-b border-outline-variant/20 pb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setIsReplaying(false);
                setSelectedSession(null);
                setReplayIndex(0);
              }}
              className="flex items-center gap-2 text-outline hover:text-primary transition-colors uppercase tracking-widest px-3 py-1.5 border border-outline-variant/30 bg-surface-container-lowest"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
            <h1 className="text-primary font-bold text-sm tracking-widest uppercase">
              REPLAY: {selectedSession.name}
            </h1>
          </div>
          <span
            className={`px-3 py-1 border text-[10px] uppercase tracking-widest ${selectedSession.completed ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10" : "border-amber-500/40 text-amber-400 bg-amber-500/10"}`}
          >
            {selectedSession.completed ? "Concluída" : "Incompleta"}
          </span>
        </div>

        <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-6 min-h-0 overflow-hidden">
          {/* COLUNA ESQUERDA */}
          <div className="xl:col-span-4 flex flex-col gap-4 h-full overflow-y-auto pr-2 custom-scrollbar">
            <div className="bg-surface-container-low/60 border border-outline-variant/30 p-4 shrink-0">
              <h2 className="text-primary font-bold mb-3 flex items-center gap-2 uppercase tracking-widest border-b border-outline-variant/10 pb-2">
                <Activity size={14} /> Consolidação Geral
              </h2>
              <div className="grid grid-cols-2 gap-3 text-[10px]">
                <div className="bg-surface-container-lowest p-2 border border-outline-variant/10">
                  <span className="text-outline block mb-1">Duração</span>
                  <span className="font-bold text-on-surface">
                    {formatDuration(selectedSession.durationMs)}
                  </span>
                </div>
                <div className="bg-surface-container-lowest p-2 border border-outline-variant/10">
                  <span className="text-outline block mb-1">Velocidade</span>
                  <span className="font-bold text-on-surface">
                    {calculatedStats.averageSpeed}
                  </span>
                </div>
                <div className="bg-surface-container-lowest p-2 border border-outline-variant/10">
                  <span className="text-outline block mb-1">Consumo Bat.</span>
                  <span className="font-bold text-emerald-400">
                    {calculatedStats.batteryUsage}
                  </span>
                </div>
                <div className="bg-surface-container-lowest p-2 border border-outline-variant/10">
                  <span className="text-outline block mb-1">Passos Totais</span>
                  <span className="font-bold text-primary">{stepCount}</span>
                </div>
                <div className="col-span-2 bg-surface-container-lowest p-2 border border-outline-variant/10">
                  <span className="text-outline block mb-1">
                    Variação de Tensão
                  </span>
                  <span className="font-bold text-on-surface">
                    {formatVoltage(selectedSession.initialVoltage)} &rarr;{" "}
                    {formatVoltage(selectedSession.finalVoltage)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-low/60 border border-outline-variant/30 p-4 shrink-0 flex flex-col">
              <h2 className="text-primary font-bold mb-3 flex items-center gap-2 uppercase tracking-widest border-b border-outline-variant/10 pb-2 shrink-0">
                <Eye size={14} /> Visão dos Sensores
              </h2>
              <div className="w-full min-w-0 overflow-x-auto custom-scrollbar flex items-center justify-center pb-2">
                <div className="w-full min-w-[200px]">
                  <SensorGrid
                    sensorData={{
                      front: (replayStep as any)?.sensors?.front ?? 0,
                      left: (replayStep as any)?.sensors?.left ?? 0,
                      right: (replayStep as any)?.sensors?.right ?? 0,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-surface-container-low/60 border border-outline-variant/30 p-4 shrink-0">
              <h2 className="text-primary font-bold mb-3 flex items-center gap-2 uppercase tracking-widest border-b border-outline-variant/10 pb-2">
                <Gauge size={14} /> Telemetria Fina
              </h2>
              {replayStep ? (
                <div className="grid grid-cols-2 gap-3 text-[10px]">
                  <div className="bg-surface-container-lowest p-2 border border-outline-variant/10">
                    <span className="text-outline block">Tensão (V)</span>
                    <span className="text-primary font-bold">
                      {replayStep.voltage.toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-surface-container-lowest p-2 border border-outline-variant/10">
                    <span className="text-outline block">Corrente (mA)</span>
                    <span className="text-primary font-bold">
                      {replayStep.current}
                    </span>
                  </div>
                  <div className="col-span-2 bg-surface-container-lowest p-2 border border-outline-variant/10">
                    <span className="text-outline block">Timestamp</span>
                    <span className="text-on-surface font-bold">
                      {replayStep.createdAt
                        ? new Date(replayStep.createdAt).toLocaleTimeString(
                            "pt-BR",
                          )
                        : "—"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-outline italic">Aguardando dados...</div>
              )}
            </div>
          </div>

          {/* COLUNA DIREITA */}
          <div className="xl:col-span-8 flex flex-col h-full overflow-hidden">
            {/* PLAYER CONTROLS */}
            <div className="bg-surface-container-low/60 border border-outline-variant/30 p-4 mb-4 shrink-0">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-primary font-bold w-8 text-right">
                    {replayIndex}
                  </span>
                  <input
                    type="range"
                    min="0"
                    max={stepCount > 0 ? stepCount - 1 : 0}
                    value={replayIndex}
                    onChange={(e) => {
                      setIsReplaying(false);
                      setReplayIndex(Number(e.target.value));
                    }}
                    className="flex-1 accent-primary cursor-pointer h-1.5 bg-surface-container-highest"
                  />
                  <span className="text-outline w-8">
                    {stepCount > 0 ? stepCount - 1 : 0}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (replayIndex >= stepCount - 1) setReplayIndex(0);
                        setIsReplaying(!isReplaying);
                      }}
                      className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 px-4 py-2 flex items-center gap-2 font-bold uppercase tracking-widest transition-colors"
                    >
                      {isReplaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                      {isReplaying ? "Pausar" : "Reproduzir"}
                    </button>
                    <button
                      onClick={() => {
                        setIsReplaying(false);
                        setReplayIndex(0);
                      }}
                      className="bg-surface-container-lowest border border-outline-variant/30 text-outline hover:text-on-surface px-4 py-2 flex items-center gap-2 uppercase tracking-widest transition-colors"
                    >
                      <Square className="w-4 h-4" /> Parar
                    </button>
                  </div>

                  <div className="flex items-center gap-1 border border-outline-variant/20 p-1 bg-surface-container-lowest">
                    <span className="text-[9px] text-outline uppercase px-2">
                      <FastForward className="w-3 h-3 inline mr-1" /> Speed:
                    </span>
                    {[0.5, 1, 2, 4].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => setPlaybackSpeed(spd)}
                        className={`px-2 py-1 text-[10px] font-bold transition-colors ${playbackSpeed === spd ? "bg-primary text-black" : "text-outline hover:text-primary"}`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* MAPA REPLAY GRID */}
            <div className="flex-1 relative bg-surface-container-lowest border border-outline-variant/30 p-2 overflow-hidden flex items-center justify-center">
              {isLoadingDetail ? (
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              ) : stepCount === 0 ? (
                <span className="text-outline">Sessão vazia.</span>
              ) : (
                <div className="w-full max-h-full aspect-square relative">
                  <div className="absolute top-2 left-2 z-10 bg-black/60 border border-outline-variant/20 px-2 py-1 text-[10px] text-outline backdrop-blur-sm">
                    Posição Robô:{" "}
                    <span className="text-primary font-bold">
                      X:{replayStep?.posX} Y:{replayStep?.posY}
                    </span>
                  </div>
                  <SessionReplayGrid
                    steps={selectedSession.steps}
                    activeIndex={replayIndex}
                    maze={selectedSession.maze}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full h-full p-6 flex flex-col gap-4 overflow-hidden font-mono text-xs">
      <header className="shrink-0 border-b border-outline-variant/20 pb-4">
        <h1 className="text-primary font-bold text-sm tracking-widest uppercase flex items-center gap-2">
          <Database className="w-5 h-5" /> Banco de Sessões
        </h1>
        <p className="text-outline mt-1 text-[10px] uppercase tracking-wider">
          Histórico consolidado de corridas e simulações manuais.
        </p>
      </header>

      {error && (
        <div className="flex items-center gap-2 text-red-400 border border-red-500/30 bg-red-500/10 px-4 py-3 shrink-0">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      <div className="flex-1 bg-surface-container-low/60 border border-outline-variant/30 overflow-auto custom-scrollbar relative">
        {isLoadingList ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-outline">
            Nenhuma sessão consolidada encontrada no banco de dados.
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-surface-container-high border-b border-outline-variant/30 text-[9px] uppercase tracking-widest text-outline shadow-md">
              <tr>
                <th className="px-4 py-4 font-normal">Sessão / Nome</th>
                <th className="px-4 py-4 font-normal">Modo/Algoritmo</th>
                <th className="px-4 py-4 font-normal">Registro (Data)</th>
                <th className="px-4 py-4 font-normal">Tempo</th>
                <th className="px-4 py-4 font-normal text-center">Status</th>
                <th className="px-4 py-4 w-12 text-center">Ação</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr
                  key={session.id}
                  onClick={() => void handleSelectSession(session.id)}
                  className="border-b border-outline-variant/10 hover:bg-primary/5 cursor-pointer transition-colors group"
                >
                  <td className="px-4 py-4 text-primary font-bold group-hover:underline">
                    {session.name}
                  </td>
                  <td className="px-4 py-4 text-on-surface-variant">
                    {session.algorithm}
                  </td>
                  <td className="px-4 py-4 text-outline">
                    {formatDate(session.createdAt)}
                  </td>
                  <td className="px-4 py-4 text-on-surface">
                    {formatDuration(session.durationMs)}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span
                      className={`text-[9px] uppercase px-2 py-0.5 border ${session.completed ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/5" : "border-amber-500/40 text-amber-400 bg-amber-500/5"}`}
                    >
                      {session.completed ? "Concluída" : "Em andamento"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button
                      type="button"
                      disabled={deletingId === session.id}
                      onClick={(e) => void handleDelete(session.id, e)}
                      className="text-red-400/50 hover:text-red-400 transition-colors disabled:opacity-50"
                      title="Excluir"
                    >
                      {deletingId === session.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
