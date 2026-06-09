import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../../App";

vi.mock("../../hooks/useWebSocket", () => ({
  useWebSocket: () => ({
    robotData: null,
    isConnected: true,
    sendRaceAction: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

describe("App", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("exibe loading e depois o dashboard principal", async () => {
    render(<App />);

    expect(screen.getByText(/Inicializando Handshake/i)).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByTestId("dashboard")).toBeInTheDocument();
  });
});