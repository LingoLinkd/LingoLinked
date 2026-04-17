import { api } from "../api";

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(Storage.prototype, "getItem").mockReturnValue("test-token");
});

afterEach(() => {
  vi.restoreAllMocks();
});

// builds a mock fetch response with an ok status and json body
function okResponse(data: unknown) {
  return {
    ok: true,
    json: () => Promise.resolve(data),
  };
}

// builds a mock fetch response with a failing status for error path testing
function errorResponse(status: number, body?: { error: string }) {
  return {
    ok: false,
    status,
    json: body ? () => Promise.resolve(body) : () => Promise.reject(new Error("no json")),
  };
}

// tests for the api utility covering get post put delete and upload methods
describe("api utility", () => {
  it("api.get makes GET to correct URL with auth header", async () => {
    mockFetch.mockResolvedValueOnce(okResponse({ ok: true }));

    await api.get("/users/me");

    expect(mockFetch).toHaveBeenCalledWith("/api/users/me", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
    });
  });

  it("api.get returns parsed JSON on 200", async () => {
    const payload = { user: { _id: "1", name: "Test" } };
    mockFetch.mockResolvedValueOnce(okResponse(payload));

    const result = await api.get("/users/me");

    expect(result).toEqual(payload);
  });

  it("api.get throws Error with server error message on non-ok", async () => {
    mockFetch.mockResolvedValueOnce(errorResponse(400, { error: "Bad request data" }));

    await expect(api.get("/bad")).rejects.toThrow("Bad request data");
  });

  it("api.get throws generic error when error body cannot be parsed", async () => {
    mockFetch.mockResolvedValueOnce(errorResponse(500));

    await expect(api.get("/fail")).rejects.toThrow("Request failed: 500");
  });

  it("api.get omits Authorization when no token in localStorage", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
    mockFetch.mockResolvedValueOnce(okResponse({ ok: true }));

    await api.get("/public");

    const callHeaders = mockFetch.mock.calls[0][1].headers;
    expect(callHeaders.Authorization).toBeUndefined();
    expect(callHeaders["Content-Type"]).toBe("application/json");
  });

  it("api.post sends POST with JSON body and Content-Type", async () => {
    const body = { email: "a@b.com", password: "secret" };
    mockFetch.mockResolvedValueOnce(okResponse({ token: "t" }));

    await api.post("/auth/login", body);

    expect(mockFetch).toHaveBeenCalledWith("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify(body),
    });
  });

  it("api.put sends PUT with JSON body", async () => {
    const data = { bio: "updated" };
    mockFetch.mockResolvedValueOnce(okResponse({ user: {} }));

    await api.put("/users/profile", data);

    expect(mockFetch).toHaveBeenCalledWith("/api/users/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify(data),
    });
  });

  it("api.delete sends DELETE request", async () => {
    mockFetch.mockResolvedValueOnce(okResponse({ success: true }));

    await api.delete("/events/123/register");

    expect(mockFetch).toHaveBeenCalledWith("/api/events/123/register", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
    });
  });

  it("api.upload sends POST with FormData and does NOT set Content-Type header", async () => {
    const formData = new FormData();
    formData.append("file", new Blob(["test"]), "test.jpg");
    mockFetch.mockResolvedValueOnce(okResponse({ url: "/uploads/test.jpg" }));

    await api.upload("/upload/avatar", formData);

    expect(mockFetch).toHaveBeenCalledWith("/api/upload/avatar", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-token",
      },
      body: formData,
    });
    const callHeaders = mockFetch.mock.calls[0][1].headers;
    expect(callHeaders["Content-Type"]).toBeUndefined();
  });

  it("api.upload includes auth header from localStorage", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockReturnValue("upload-token");
    const formData = new FormData();
    mockFetch.mockResolvedValueOnce(okResponse({ ok: true }));

    await api.upload("/upload/file", formData);

    const callHeaders = mockFetch.mock.calls[0][1].headers;
    expect(callHeaders.Authorization).toBe("Bearer upload-token");
  });
});
