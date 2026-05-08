const BASE_URL = "";

async function request<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const controller = new AbortController();
  const { signal, ...rest } = options;

  const mergedOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...rest.headers,
    },
    signal: signal ?? controller.signal,
    ...rest,
  };

  const response = await fetch(`${BASE_URL}${url}`, mergedOptions);

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      detail = body.detail ?? detail;
    } catch {
      // ignore parse error
    }
    throw new ApiError(detail, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export class ApiError extends Error {
  status: number;
  constructor(detail: string, status: number) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
  }
}

export function get<T>(url: string, signal?: AbortSignal): Promise<T> {
  return request<T>(url, { method: "GET", signal });
}

export function post<T>(
  url: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  return request<T>(url, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });
}

export function put<T>(
  url: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  return request<T>(url, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });
}

export function del<T>(url: string, signal?: AbortSignal): Promise<T> {
  return request<T>(url, { method: "DELETE", signal });
}
