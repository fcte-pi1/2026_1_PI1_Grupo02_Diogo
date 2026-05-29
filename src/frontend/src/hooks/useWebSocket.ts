// src/hooks/useWebSocket.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export interface TelemetryData {
  id: string;
  sessionId: string;
  timestamp: string;
  stepOrder: number;
  posX: number;
  posY: number;
  voltage: number;
  current: number;
  consumption?: number;
}

export function useWebSocket() {
  const [robotData, setRobotData] = useState<TelemetryData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Conectar ao Servidor
  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const serverUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3000';
    
    const socket = io(serverUrl, {
      transports: ['websocket'],
      autoConnect: true
    });

    socket.on('connect', () => {
      setIsConnected(true);
      // 🚀 Alinhado com o server.ts: Notifica o backend para assinar o canal de streaming
      socket.emit("telemetry:subscribe", { limit: 50 });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // 🚀 Alinhado com a sua responsabilidade da issue: Escuta o pipeline do MQTT -> Banco -> WS
    socket.on('telemetry:step', (data: TelemetryData) => {
      setRobotData(data);
    });

    // Tratamento opcional para capturar o replay histórico ao dar F5
    socket.on('telemetry:history', (historyItems: TelemetryData[]) => {
      if (historyItems.length > 0) {
        setRobotData(historyItems[historyItems.length - 1]); // Carrega o último passo conhecido
      }
    });

    socketRef.current = socket;
  }, []);

  // Desconectar do Servidor
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.off('telemetry:step');
      socketRef.current.off('telemetry:history');
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // 🔌 MUDANÇA CRÍTICA: Sistema agora liga automático no nascimento do app!
  useEffect(() => {
    connect(); // Conecta direto para dar feedback nas telas de Welcome e Loading
    
    return () => disconnect();
  }, [connect, disconnect]);

  const sendRaceAction = useCallback((action: 'START' | 'PAUSE' | 'STOP') => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('race_action', { action });
    }
  }, []);

  return { robotData, isConnected, sendRaceAction, connect, disconnect };
}