const baseURL = import.meta.env.VITE_BACKEND_URL ?? "";

interface ApiResponse<T> {
  data: T;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<ApiResponse<T>> {
  const token = localStorage.getItem("peertrack_token");
  const response = await fetch(`${baseURL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const data = (await response.json().catch(() => ({}))) as T & { message?: string; error?: string };
  if (!response.ok) {
    throw new Error(data.message ?? data.error ?? "Request failed");
  }

  return { data };
}

async function get<T>(path: string): Promise<ApiResponse<T>> {
  return request<T>("GET", path);
}

async function post<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  return request<T>("POST", path, body);
}

async function put<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  return request<T>("PUT", path, body);
}

export const apiClient = { get, post, put };
