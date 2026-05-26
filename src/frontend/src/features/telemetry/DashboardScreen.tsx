// src/features/telemetry/DashboardView.tsx
import { useState, useEffect } from "react";
import { io } from "socket.io-client";

import BatteryWidget from "./components/BatteryWidget";
import EngineTelemetryWidget from "./components/EngineTelemetryWidget";
import RaceTimer from "./components/RaceTimer";
import SensorGrid from "./components/SensorGrid";
import { VisualizeDiv } from "../../components/VisualizeDiv";

interface DashboardViewProps {
  activeSession: {
    sessionName: string;
    algorithm: string;
    mode: string;
  } | null;
  
  currentView: string;

  connectionProps: {
    latency: string;
  } | null;
}

const socket = io("http://localhost:3000");

export default function DashboardView({
  activeSession,
  currentView,
  connectionProps,
}: DashboardViewProps) {
  const [robotData, setRobotData] = useState({
    voltage: 0,
    percentage: 0,
    temperature: 0.0,
    motorCurrent: 0.0,
    velocity: 0.0,
    sensors: { front: 0, left: 0, right: 0 },
  });

  const [isRaceActive, setIsRaceActive] = useState(false);
  const [raceStartTime, setRaceStartTime] = useState<string | null>(null);

  useEffect(() => {
    socket.on("robot_telemetry", (data) => setRobotData(data));
    socket.on("race_started", (timestamp) => {
      setRaceStartTime(timestamp);
      setIsRaceActive(true);
    });
    return () => {
      socket.off("robot_telemetry");
      socket.off("race_started");
    };
  }, []);

  return (
    <main className="w-full h-full p-container-padding flex flex-col gap-gutter overflow-hidden">
      {/* O Grid dos Widgets Técnicos */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-gutter">
        <div className="flex flex-col gap-gutter lg:col-span-1">
          <BatteryWidget
            voltage={robotData.voltage}
            percentage={robotData.percentage}
            isCritical={robotData.voltage < 3.4}
          />
          <EngineTelemetryWidget
            motorCurrent={robotData.motorCurrent}
            velocity={robotData.velocity}
          />
        </div>

        <VisualizeDiv activeSession={activeSession} currentView={currentView} connectionProps={connectionProps ?? { latency: '0' }}/>

        <div className="flex flex-col gap-gutter lg:col-span-1">
          <RaceTimer startTime={raceStartTime} isActive={isRaceActive} />
          <SensorGrid sensorData={robotData.sensors} />
        </div>
      </div>
    </main>
  );
}
