import superjson from "superjson";

export async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(endpoint, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const json = superjson.parse(await res.text());

  if (!res.ok) {
    throw new Error(json.error || "Request failed");
  }

  return json as T;
}
