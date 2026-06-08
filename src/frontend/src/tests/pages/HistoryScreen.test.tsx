import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import HistoryScreen from "../../features/history/HistoryScreen";
import { ApiError } from "../../api/client";
import * as sessionsApi from "../../api/sessions";
import {
  sessionDetailFixture,
  sessionMetadataFixture,
} from "../fixtures/sessions";

vi.mock("../../api/sessions", () => ({
  listSessions: vi.fn(),
  getSessionById: vi.fn(),
  deleteSession: vi.fn(),
}));

describe("HistoryScreen", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("lista sessões consolidadas", async () => {
    vi.mocked(sessionsApi.listSessions).mockResolvedValue({
      items: [sessionMetadataFixture],
      count: 1,
    });

    render(<HistoryScreen />);

    expect(await screen.findByText("Corrida Teste")).toBeInTheDocument();
    expect(screen.getByText("Concluída")).toBeInTheDocument();
  });

  it("exibe estado vazio quando não há sessões", async () => {
    vi.mocked(sessionsApi.listSessions).mockResolvedValue({
      items: [],
      count: 0,
    });

    render(<HistoryScreen />);

    expect(
      await screen.findByText("Nenhuma sessão consolidada encontrada.")
    ).toBeInTheDocument();
  });

  it("exibe erro ao falhar carregamento da lista", async () => {
    vi.mocked(sessionsApi.listSessions).mockRejectedValue(
      new ApiError("falha", 500)
    );

    render(<HistoryScreen />);

    expect(await screen.findByText("falha")).toBeInTheDocument();
  });

  it("abre detalhe da sessão ao clicar na linha", async () => {
    const user = userEvent.setup();
    vi.mocked(sessionsApi.listSessions).mockResolvedValue({
      items: [sessionMetadataFixture],
      count: 1,
    });
    vi.mocked(sessionsApi.getSessionById).mockResolvedValue(sessionDetailFixture);

    render(<HistoryScreen />);
    await screen.findByText("Corrida Teste");
    await user.click(screen.getByText("Corrida Teste"));

    expect(await screen.findByText("Voltar para lista")).toBeInTheDocument();
    expect(screen.getByText("Replay")).toBeInTheDocument();
    expect(screen.getByLabelText("Mapa do replay")).toBeInTheDocument();
  });

  it("exclui sessão da lista", async () => {
    const user = userEvent.setup();
    vi.mocked(sessionsApi.listSessions).mockResolvedValue({
      items: [sessionMetadataFixture],
      count: 1,
    });
    vi.mocked(sessionsApi.deleteSession).mockResolvedValue(undefined);

    render(<HistoryScreen />);
    await screen.findByText("Corrida Teste");

    await user.click(
      screen.getByRole("button", { name: "Excluir sessão Corrida Teste" })
    );

    await waitFor(() =>
      expect(sessionsApi.deleteSession).toHaveBeenCalledWith("sess-1")
    );
    expect(
      screen.getByText("Nenhuma sessão consolidada encontrada.")
    ).toBeInTheDocument();
  });
});
