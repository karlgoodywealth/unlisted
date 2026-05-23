import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Password gate: stored in React state (in-memory only). The login screen
// captures the password and sets it via setAuthToken(). It is sent on every
// API call as `Authorization: Bearer <password>`. Refreshing the page asks
// for the password again — that's intentional for a personal dashboard.
let authToken = "";
export function setAuthToken(token: string) {
  authToken = token;
}
export function getAuthToken() {
  return authToken;
}

function authHeaders(extra?: HeadersInit): HeadersInit {
  const h: Record<string, string> = { ...(extra as Record<string, string> | undefined) };
  if (authToken) h["Authorization"] = `Bearer ${authToken}`;
  return h;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: authHeaders(data ? { "Content-Type": "application/json" } : undefined),
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/"), {
      headers: authHeaders(),
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
