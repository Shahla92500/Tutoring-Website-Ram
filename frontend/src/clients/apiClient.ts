const baseURL = import.meta.env.VITE_BACKEND_URL ?? "";

interface ApiResponse<T> {
  data: T;
}

async function post<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  const token = localStorage.getItem("peertrack_token");
  const response = await fetch(`${baseURL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });

  const data = (await response.json().catch(() => ({}))) as T & { message?: string };
  if (!response.ok) {
    throw new Error((data as { message?: string }).message ?? "Request failed");
  }

  return { data };
}

export const apiClient = { post };
