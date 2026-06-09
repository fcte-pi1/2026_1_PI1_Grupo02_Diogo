import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import TerminalWidget from "../../features/telemetry/components/TerminalWidget";

describe("TerminalWidget", () => {
  it("exibe badge LIVE quando conectado", () => {
    render(
      <TerminalWidget
        activeSession={{ sessionName: "S1", algorithm: "DFS", mode: "Cockpit" }}
        status
        logs={["[10:00] passo 1"]}
      />
    );

    expect(screen.getByText("LIVE")).toBeInTheDocument();
    expect(screen.getByText(/passo 1/)).toBeInTheDocument();
  });

  it("exibe OFFLINE e permite limpar logs", async () => {
    const user = userEvent.setup();
    const onClearLogs = vi.fn();

    render(
      <TerminalWidget
        activeSession={{ sessionName: "S1", algorithm: "DFS", mode: "Cockpit" }}
        status
        logs={["linha 1", "linha 2"]}
        onClearLogs={onClearLogs}
      />
    );

    await user.click(screen.getByTitle("Limpar console"));
    expect(onClearLogs).toHaveBeenCalled();
  });

  it("alterna altura ao expandir terminal", async () => {
    const user = userEvent.setup();

    render(
      <TerminalWidget
        activeSession={{ sessionName: "S1", algorithm: "DFS", mode: "Cockpit" }}
        status={false}
      />
    );

    expect(screen.getByText("OFFLINE")).toBeInTheDocument();
    await user.click(screen.getByTitle("Expandir terminal"));
    expect(screen.getByTitle("Recolher terminal")).toBeInTheDocument();
  });
});
