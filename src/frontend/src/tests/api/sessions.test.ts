import { afterEach, describe, expect, it, vi } from "vitest";
import {
  deleteSession,
  getSessionById,
  listSessions,
} from "../../api/sessions";
import { sessionDetailFixture, sessionMetadataFixture } from "../fixtures/sessions";

describe("sessions API", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("listSessions consulta /api/sessions", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ items: [sessionMetadataFixture], count: 1 }),
      })
    );

    const result = await listSessions();
    expect(result.count).toBe(1);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/sessions"),
      expect.any(Object)
    );
  });

  it("getSessionById consulta detalhe da sessão", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => sessionDetailFixture,
      })
    );

    const result = await getSessionById("sess-1");
    expect(result.id).toBe("sess-1");
    expect(result.steps).toHaveLength(3);
  });

  it("deleteSession envia DELETE", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        json: async () => ({}),
      })
    );

    await deleteSession("sess-1");
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/sessions/sess-1"),
      expect.objectContaining({ method: "DELETE" })
    );
  });
});
