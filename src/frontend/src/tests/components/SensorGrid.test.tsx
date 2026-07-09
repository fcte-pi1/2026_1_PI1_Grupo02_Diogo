import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import SensorGrid from "../../features/telemetry/components/SensorGrid";

describe("SensorGrid Component", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("deve renderizar labels dos três sensores", () => {
    render(<SensorGrid sensorData={{ front: 30, left: 50, right: 12 }} />);

    expect(screen.getByTestId("sensor-front-label")).toHaveTextContent("2 PASSOS");
    expect(screen.getByTestId("sensor-left-label")).toHaveTextContent("3 PASSOS");
    expect(screen.getByTestId("sensor-right-label")).toHaveTextContent("1 PASSO");
  });

  it("mostra label de passos/parede quando fornecido", () => {
    render(
      <SensorGrid
        sensorData={{
          front: { cm: 4, label: "PAREDE", detalhe: "Colado" },
          left: { cm: 18, label: "1 PASSO" },
          right: { cm: 36, label: "2 PASSOS" },
        }}
      />,
    );

    expect(screen.getByTestId("sensor-front-label")).toHaveTextContent("PAREDE");
    expect(screen.getByTestId("sensor-left-label")).toHaveTextContent("1 PASSO");
    expect(screen.getByTestId("sensor-right-label")).toHaveTextContent("2 PASSOS");
  });

  it("deve ativar o estado de alerta (perigo de colisão) se a distância for muito curta", () => {
    render(<SensorGrid sensorData={{ left: 40, front: 5, right: 40 }} />);

    expect(screen.getByTestId("sensor-front")).toHaveAttribute(
      "data-tone",
      "critical",
    );
  });

  it("dispara ping ao clicar em um sensor", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<SensorGrid sensorData={{ front: 25, left: 25, right: 25 }} />);

    await user.click(screen.getByTestId("sensor-left"));
    expect(screen.getByTestId("sensor-left")).toHaveAttribute(
      "data-pinging",
      "true",
    );
  });

  it("dispara scan nos três canais pelo botão Scan", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <SensorGrid
        sensorData={{ front: 4, left: 25, right: 4 }}
        scanTick={0}
      />,
    );

    await user.click(screen.getByTestId("sensor-sweep"));
    expect(screen.getByTestId("sensor-front")).toHaveAttribute(
      "data-pinging",
      "true",
    );
  });
});
