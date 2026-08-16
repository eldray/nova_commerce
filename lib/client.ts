// Client-side API helper for making requests to endpoints
import superjson from "superjson";

export async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(endpoint, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const json = superjson.parse(await res.text()) as any;

  if (!res.ok) {
    throw new Error((json as any).error || "Request failed");
  }

  return json as T;
}

export const client = {
  get: <T>(url: string, options?: RequestInit) => apiClient<T>(url, { ...options, method: 'GET' }),
  post: <T>(url: string, body?: any, options?: RequestInit) => 
    apiClient<T>(url, { 
      ...options, 
      method: 'POST',
      body: body ? superjson.stringify(body) : undefined,
    }),
  put: <T>(url: string, body?: any, options?: RequestInit) => 
    apiClient<T>(url, { 
      ...options, 
      method: 'PUT',
      body: body ? superjson.stringify(body) : undefined,
    }),
  delete: <T>(url: string, options?: RequestInit) => apiClient<T>(url, { ...options, method: 'DELETE' }),
};
