// src/features/telemetry/DashboardView.tsx
import { useState, useEffect } from "react";
import { io } from 'socket.io-client';

import BatteryWidget from "./components/BatteryWidget";
import EngineTelemetryWidget from "./components/EngineTelemetryWidget";
import RaceTimer from './components/RaceTimer';
import SensorGrid from './components/SensorGrid';
import TerminalWidget from "./components/TerminalWidget";

interface DashboardViewProps {
  activeSession: { sessionName: string; algorithm: string; mode: string } | null;
  viewTerminal: boolean;
}

const socket = io('http://localhost:3000');

export default function DashboardView({ activeSession, viewTerminal }: DashboardViewProps) {
  const [robotData, setRobotData] = useState({
    voltage: 0,
    percentage: 0,
    temperature: 0.0,
    motorCurrent: 0.0,
    velocity: 0.0,
    sensors: { front: 0, left: 0, right: 0 }
  });

  const [isRaceActive, setIsRaceActive] = useState(false);
  const [raceStartTime, setRaceStartTime] = useState<string | null>(null);

  useEffect(() => {
    socket.on('robot_telemetry', (data) => setRobotData(data));
    socket.on('race_started', (timestamp) => {
      setRaceStartTime(timestamp);
      setIsRaceActive(true);
    });
    return () => {
      socket.off('robot_telemetry');
      socket.off('race_started');
    };
  }, []);

  return (
    <main className="w-full h-full p-container-padding flex flex-col gap-gutter overflow-hidden">
      
      {/* O Grid dos Widgets Técnicos */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-gutter">
        
        <div className="flex flex-col gap-gutter lg:col-span-1">
          <BatteryWidget voltage={robotData.voltage} percentage={robotData.percentage} isCritical={robotData.voltage < 3.4} />
          <EngineTelemetryWidget motorCurrent={robotData.motorCurrent} velocity={robotData.velocity} />
        </div>
        
        <div className="flex flex-col h-full lg:col-span-2">
          <div className="bg-surface-container-low/60 border border-outline-variant/30 p-stack-md flex-1 flex items-center justify-center text-outline text-xs font-mono rounded-none">
            [ LABIRINTO CENTRAL - ALGORITMO: {activeSession?.algorithm} ]
          </div>
        </div>

        <div className="flex flex-col gap-gutter lg:col-span-1">
          <RaceTimer timeMs={0} isActive={isRaceActive} />
          <SensorGrid sensorData={robotData.sensors} />
        </div>

      </div>  

      {/* Terminal acoplado na base da visualização */}
      {viewTerminal && (
        <TerminalWidget activeSession={activeSession} status={false}/>
      )}

    </main>
  );
}