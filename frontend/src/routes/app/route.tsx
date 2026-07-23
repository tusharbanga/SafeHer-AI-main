const API_BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
};

function buildUrl(path: string) {
  if (path.startsWith("http")) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

function getStoredToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem("accessToken");
}

function getAuthHeaders() {
  const token = getStoredToken();

  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, body, headers, ...rest } = options;
  const requestHeaders = new Headers(headers as HeadersInit | undefined);

  if (!requestHeaders.has("Accept")) {
    requestHeaders.set("Accept", "application/json");
  }

  if (body !== undefined && !(body instanceof FormData) && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (auth) {
    const authHeaders = getAuthHeaders();
    Object.entries(authHeaders).forEach(([key, value]) => {
      requestHeaders.set(key, value);
    });
  }

  const response = await fetch(buildUrl(path), {
    ...rest,
    headers: requestHeaders,
    body:
      body === undefined
        ? undefined
        : body instanceof FormData || body instanceof Blob || typeof body === "string"
          ? (body as BodyInit)
          : JSON.stringify(body),
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "message" in payload && typeof payload.message === "string"
        ? payload.message
        : "Request failed";

    throw new Error(message);
  }

  return payload as T;
}

export function saveAuthSession(data: { accessToken: string; refreshToken: string; user: unknown }) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem("accessToken", data.accessToken);
  window.localStorage.setItem("refreshToken", data.refreshToken);
  window.localStorage.setItem("user", JSON.stringify(data.user));
}

export function clearAuthSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem("accessToken");
  window.localStorage.removeItem("refreshToken");
  window.localStorage.removeItem("user");
}

export const authApi = {
  login: (body: { email: string; password: string }) =>
    request<{ success: boolean; message: string; data: { user: unknown; accessToken: string; refreshToken: string } }>('/v1/auth/login', {
      method: "POST" as HttpMethod,
      body,
      auth: false,
    }),
  register: (body: { name: string; email: string; phone: string; password: string }) =>
    request<{ success: boolean; message: string; data: { user: unknown; accessToken: string; refreshToken: string } }>('/v1/auth/register', {
      method: "POST" as HttpMethod,
      body,
      auth: false,
    }),
  me: () =>
    request<{ success: boolean; message: string; data: { user: unknown } }>('/v1/auth/me', {
      method: "GET" as HttpMethod,
    }),
  logout: () =>
    request<{ success: boolean; message: string }>('/v1/auth/logout', {
      method: "POST" as HttpMethod,
    }),
};
