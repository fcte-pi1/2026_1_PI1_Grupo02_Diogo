import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest } from "../../api/client";

describe("apiRequest", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("retorna JSON em respostas 200", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ items: [], count: 0 }),
      })
    );

    const result = await apiRequest<{ items: unknown[]; count: number }>(
      "/api/sessions"
    );

    expect(result).toEqual({ items: [], count: 0 });
  });

  it("retorna undefined em respostas 204", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        json: async () => ({}),
      })
    );

    await expect(apiRequest<void>("/api/sessions/1", { method: "DELETE" })).resolves.toBeUndefined();
  });

  it("lança ApiError com código do corpo em falhas HTTP", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: "Session not found" }),
      })
    );

    await expect(apiRequest("/api/sessions/x")).rejects.toMatchObject({
      name: "ApiError",
      status: 404,
      message: "Session not found",
    });
  });

  it("lança ApiError genérico quando corpo não é JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error("invalid json");
        },
      })
    );

    await expect(apiRequest("/api/sessions")).rejects.toBeInstanceOf(ApiError);
  });
});

describe("ApiError", () => {
  it("expõe status e code", () => {
    const error = new ApiError("falha", 400, "BAD_REQUEST");
    expect(error.message).toBe("falha");
    expect(error.status).toBe(400);
    expect(error.code).toBe("BAD_REQUEST");
  });
});
