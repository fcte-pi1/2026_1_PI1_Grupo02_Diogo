import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  Play,
  Square,
  Trash2,
} from "lucide-react";
import { SessionReplayGrid } from "./SessionReplayGrid";
import {
  deleteSession,
  getSessionById,
  listSessions,
} from "../../api/sessions";
import { ApiError } from "../../api/client";
import type { SessionDetail, SessionMetadata } from "../../types/session";

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
    null
  );
  const [replayIndex, setReplayIndex] = useState(0);
  const [isReplaying, setIsReplaying] = useState(false);
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
      const message =
        err instanceof ApiError ? err.message : "Falha ao carregar sessões.";
      setError(message);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const stopReplay = useCallback(() => {
    if (replayIntervalRef.current) {
      clearInterval(replayIntervalRef.current);
      replayIntervalRef.current = null;
    }
    setIsReplaying(false);
  }, []);

  useEffect(() => () => stopReplay(), [stopReplay]);

  const handleSelectSession = async (id: string) => {
    stopReplay();
    setIsLoadingDetail(true);
    setError(null);
    try {
      const detail = await getSessionById(id);
      setSelectedSession(detail);
      setReplayIndex(0);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Falha ao carregar detalhes.";
      setError(message);
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
      const message =
        err instanceof ApiError ? err.message : "Falha ao excluir sessão.";
      setError(message);
    } finally {
      setDeletingId(null);
    }
  };

  const replayStep = useMemo(() => {
    if (!selectedSession || selectedSession.steps.length === 0) {
      return null;
    }
    const safeIndex = Math.min(
      replayIndex,
      selectedSession.steps.length - 1
    );
    return selectedSession.steps[safeIndex];
  }, [selectedSession, replayIndex]);

  const handlePlayReplay = () => {
    if (!selectedSession || selectedSession.steps.length === 0) return;

    stopReplay();
    setReplayIndex(0);
    setIsReplaying(true);

    const total = selectedSession.steps.length;
    if (total === 1) {
      setIsReplaying(false);
      return;
    }

    let index = 0;
    replayIntervalRef.current = window.setInterval(() => {
      index += 1;
      setReplayIndex(index);
      if (index >= total - 1) {
        stopReplay();
      }
    }, 700);
  };

  const stepCount = selectedSession?.steps.length ?? 0;
  const replayProgress =
    stepCount > 0 ? Math.round(((replayIndex + 1) / stepCount) * 100) : 0;

  if (selectedSession) {
    return (
      <main className="w-full h-full p-container-padding flex flex-col gap-gutter overflow-auto">
        <div className="flex items-center justify-between gap-stack-md">
          <button
            type="button"
            onClick={() => {
              stopReplay();
              setSelectedSession(null);
              setReplayIndex(0);
            }}
            className="flex items-center gap-2 text-sm font-mono text-primary hover:text-on-surface transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para lista
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePlayReplay}
              disabled={
                isReplaying ||
                !selectedSession.steps.length ||
                isLoadingDetail
              }
              className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider px-3 py-2 border border-primary/40 text-primary hover:bg-primary/10 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isReplaying ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              {isReplaying ? "Reproduzindo…" : "Replay"}
            </button>
            {isReplaying && (
              <button
                type="button"
                onClick={stopReplay}
                className="flex items-center gap-1 text-xs font-mono uppercase px-2 py-2 text-outline hover:text-on-surface"
              >
                <Square className="w-3 h-3" />
                Parar
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm font-mono border border-red-500/30 bg-red-500/10 px-4 py-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <section className="bg-surface-container-low/60 border border-outline-variant/30 p-6">
          <h2 className="text-label-caps font-bold text-primary tracking-widest uppercase mb-4">
            {selectedSession.name}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono text-on-surface-variant">
            <div>
              <span className="text-outline block mb-1">Algoritmo</span>
              {selectedSession.algorithm}
            </div>
            <div>
              <span className="text-outline block mb-1">Duração</span>
              {formatDuration(selectedSession.durationMs)}
            </div>
            <div>
              <span className="text-outline block mb-1">Tensão inicial</span>
              {formatVoltage(selectedSession.initialVoltage)}
            </div>
            <div>
              <span className="text-outline block mb-1">Tensão final</span>
              {formatVoltage(selectedSession.finalVoltage)}
            </div>
          </div>
        </section>

        <section className="bg-surface-container-low/60 border border-outline-variant/30 p-6 flex-1 min-h-[280px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-mono text-outline uppercase tracking-widest">
              Replay do percurso
            </h3>
            {replayStep && (
              <span className="text-[9px] font-mono text-primary border border-primary/30 px-2 py-0.5">
                Passo {replayIndex + 1}/{selectedSession.steps.length} — ordem #
                {replayStep.stepOrder} — ({replayStep.posX}, {replayStep.posY})
              </span>
            )}
          </div>

          {isLoadingDetail ? (
            <div className="flex items-center justify-center h-40 text-primary">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : selectedSession.steps.length === 0 ? (
            <p className="text-center py-12 text-sm font-mono text-outline">
              Nenhum passo registrado nesta sessão.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 ease-out"
                  style={{ width: `${replayProgress}%` }}
                />
              </div>

              <SessionReplayGrid
                steps={selectedSession.steps}
                activeIndex={replayIndex}
              />

              {replayStep && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px] font-mono text-on-surface-variant border-t border-outline-variant/20 pt-4">
                  <div>
                    <span className="text-outline block mb-1">Tensão</span>
                    {replayStep.voltage.toFixed(2)} V
                  </div>
                  <div>
                    <span className="text-outline block mb-1">Corrente</span>
                    {replayStep.current} mA
                  </div>
                  <div>
                    <span className="text-outline block mb-1">Posição</span>
                    X {replayStep.posX}, Y {replayStep.posY}
                  </div>
                  <div>
                    <span className="text-outline block mb-1">Horário</span>
                    {new Date(replayStep.createdAt).toLocaleTimeString("pt-BR")}
                  </div>
                </div>
              )}

              <p className="text-center text-[10px] font-mono text-outline uppercase tracking-widest">
                Quadrado brilhante = robô · tons claros = trilha percorrida
              </p>
            </div>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="w-full h-full p-container-padding flex flex-col gap-gutter overflow-auto">
      <header>
        <h1 className="text-label-caps font-bold text-primary tracking-widest uppercase">
          Histórico de sessões
        </h1>
        <p className="text-xs font-mono text-on-surface-variant mt-2">
          Corridas consolidadas salvas no banco de dados.
        </p>
      </header>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm font-mono border border-red-500/30 bg-red-500/10 px-4 py-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-surface-container-low/60 border border-outline-variant/30 overflow-hidden">
        {isLoadingList ? (
          <div className="flex items-center justify-center py-16 text-primary">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-center py-16 text-sm font-mono text-outline">
            Nenhuma sessão consolidada encontrada.
          </p>
        ) : (
          <table className="w-full text-left text-sm font-mono">
            <thead className="text-[10px] uppercase tracking-widest text-outline border-b border-outline-variant/30">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Algoritmo</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Duração</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 w-16" />
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr
                  key={session.id}
                  onClick={() => void handleSelectSession(session.id)}
                  className="border-b border-outline-variant/20 hover:bg-surface-variant/20 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-on-surface">{session.name}</td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {session.algorithm}
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {formatDate(session.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {formatDuration(session.durationMs)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] uppercase px-2 py-0.5 border ${
                        session.completed
                          ? "border-emerald-500/40 text-emerald-400"
                          : "border-amber-500/40 text-amber-400"
                      }`}
                    >
                      {session.completed ? "Concluída" : "Em andamento"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      aria-label={`Excluir sessão ${session.name}`}
                      disabled={deletingId === session.id}
                      onClick={(event) => void handleDelete(session.id, event)}
                      className="text-red-400 hover:text-red-300 disabled:opacity-50 p-1"
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
