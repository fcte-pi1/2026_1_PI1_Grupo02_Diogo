import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Footer from "../../components/Footer";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("Footer", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("mostra CHECKING inicialmente", () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    render(<Footer />);
    expect(screen.getByText("CHECKING")).toBeInTheDocument();
  });

  it("mostra STABLE quando a API responde com status ok", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: "ok" }),
    });

    render(<Footer />);

    await waitFor(() => {
      expect(screen.getByText("STABLE")).toBeInTheDocument();
    });
  });

  it("mostra OFFLINE quando a API responde com status inesperado", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: "degraded" }),
    });

    render(<Footer />);

    await waitFor(() => {
      expect(screen.getByText("OFFLINE")).toBeInTheDocument();
    });
  });

  it("mostra OFFLINE quando a requisição falha", async () => {
    mockFetch.mockRejectedValue(new Error("network error"));

    render(<Footer />);

    await waitFor(() => {
      expect(screen.getByText("OFFLINE")).toBeInTheDocument();
    });
  });

  it("mostra OFFLINE quando a API retorna status HTTP de erro", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ status: "ok" }),
    });

    render(<Footer />);

    await waitFor(() => {
      expect(screen.getByText("OFFLINE")).toBeInTheDocument();
    });
  });

  it("revalida a saúde da API periodicamente", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: "ok" }),
    });

    render(<Footer />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    await vi.advanceTimersByTimeAsync(5000);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    vi.useRealTimers();
  });
});
