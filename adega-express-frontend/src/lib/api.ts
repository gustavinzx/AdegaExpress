// src/lib/api.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export class ApiError extends Error {
  public status: number;
  public data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return {} as T;
  }

  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = null;
  }

  if (!response.ok) {
    throw new ApiError(response.status, data?.message || 'Erro na requisição', data);
  }

  return data?.data as T;
}

async function requestRaw<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: HeadersInit = { 'Content-Type': 'application/json', ...options.headers };
  if (token) { (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`; }
  
  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  if (response.status === 204) return {} as T;
  
  let data;
  try { data = await response.json(); } catch (e) { data = null; }
  if (!response.ok) throw new ApiError(response.status, data?.message || 'Erro na requisição', data);
  
  return data as T;
}

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'GET' }),
  getPaginated: <T>(endpoint: string, options?: RequestInit) => requestRaw<{ status: string, data: T, meta: { page: number, limit: number, total: number, total_pages: number } }>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, body: any, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: <T>(endpoint: string, body: any, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(endpoint: string, body: any, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'DELETE' }),
};
