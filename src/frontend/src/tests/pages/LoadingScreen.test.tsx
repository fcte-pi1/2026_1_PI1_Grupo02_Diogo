import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import LoadingScreen from "../../features/main/LoadingScreen";

describe("LoadingScreen", () => {
  it("mostra estado de handshake aguardando conexão", () => {
    render(
      <LoadingScreen sessionName="Sessão Demo" isSocketConnected={false} />
    );

    expect(screen.getByText("Inicializando Handshake")).toBeInTheDocument();
    expect(screen.getByText("TARGET // Sessão Demo")).toBeInTheDocument();
    expect(screen.getByText("FAIL")).toBeInTheDocument();
    expect(screen.getByText("HOLD_WAIT")).toBeInTheDocument();
  });

  it("mostra estado conectado quando o socket está ativo", () => {
    render(
      <LoadingScreen sessionName="Sessão Demo" isSocketConnected={true} />
    );

    expect(screen.getAllByText("OK").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("CONNECTED")).toBeInTheDocument();
  });
});
