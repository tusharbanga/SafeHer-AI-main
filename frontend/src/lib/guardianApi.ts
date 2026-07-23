const API_BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

function buildUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

async function guardianRequest<T>(path: string, options: RequestInit & { auth?: boolean } = {}): Promise<T> {
  const { auth = true, headers, ...rest } = options;
  const requestHeaders = new Headers(headers as HeadersInit | undefined);
  requestHeaders.set("Accept", "application/json");

  if (rest.body && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getGuardianToken();
    if (token) requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(buildUrl(path), { ...rest, headers: requestHeaders });
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

export type LinkedUser = {
  userId: string;
  name: string;
  profileImage?: { url: string; publicId: string };
  relationship: string;
  contactName?: string;
};

export type GuardianLoginResponse = {
  success: boolean;
  message: string;
  data: {
    token: string;
    guardian: { email: string };
    linkedUser: LinkedUser;
    linkedUsers: LinkedUser[];
  };
};

export type GuardianDashboardResponse = {
  success: boolean;
  message: string;
  data: {
    connectedUser: { id: string; name: string; profileImage?: { url: string; publicId: string } };
    safetyStatus: "safe" | "sos";
    location: {
      latitude: number;
      longitude: number;
      accuracy: number;
      isSharing: boolean;
      updatedAt: string;
    } | null;
    latestAlert: { _id: string; status: string; createdAt: string; googleMapsLink: string } | null;
    linkedUsers: LinkedUser[];
  };
};

// ---------- Guardian session (kept separate from the regular user session) ----------

export function getGuardianToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("guardianToken");
}

export function getGuardianEmail() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("guardianEmail");
}

export function saveGuardianSession(data: { token: string; guardian: { email: string } }) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("guardianToken", data.token);
  window.localStorage.setItem("guardianEmail", data.guardian.email);
}

export function clearGuardianSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("guardianToken");
  window.localStorage.removeItem("guardianEmail");
}

export function isGuardianAuthenticated() {
  return Boolean(getGuardianToken());
}

// ---------- API calls ----------

export const guardianApi = {
  login: (email: string) =>
    guardianRequest<GuardianLoginResponse>("/v1/guardian/login", {
      method: "POST",
      body: JSON.stringify({ email }),
      auth: false,
    }),
  dashboard: (userId?: string) =>
    guardianRequest<GuardianDashboardResponse>(`/v1/guardian/dashboard${userId ? `?userId=${userId}` : ""}`, {
      method: "GET",
    }),
};

// Read-only location lookups made from the Guardian Dashboard, authenticated
// with the guardian's own token (see /v1/location/current & /history, which
// accept either a user token or a linked guardian token — eitherProtect).
export const guardianLocationApi = {
  getCurrent: (userId: string) =>
    guardianRequest<{
      success: boolean;
      data: { location: { latitude: number; longitude: number; accuracy: number; updatedAt: string } | null };
    }>(`/v1/location/current/${userId}`, { method: "GET" }),
  getHistory: (userId: string) =>
    guardianRequest<{
      success: boolean;
      data: { history: { latitude: number; longitude: number; timestamp: string }[] };
    }>(`/v1/location/history/${userId}`, { method: "GET" }),
};
