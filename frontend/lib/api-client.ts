export interface RequestOptions extends RequestInit {
  params?: Record<string, string>
}

// Client helper for executing authenticated API requests to route handlers
export class ApiClient {
  private static getHeaders(headers?: HeadersInit): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('fg_token') : null
    
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    }
  }

  static async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers, ...rest } = options
    
    let url = endpoint
    if (params) {
      const searchParams = new URLSearchParams(params)
      url += `?${searchParams.toString()}`
    }

    const response = await fetch(url, {
      ...rest,
      headers: this.getHeaders(headers),
    })

    if (!response.ok) {
      if (response.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('fg_token')
        window.location.href = '/login'
      }
      let errData = { error: 'Unknown API error' }
      try {
        errData = await response.json()
      } catch (e) {}
      throw new Error(errData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    // Handlers might return file downloads or empty responses
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return response.json() as Promise<T>
    }
    return response as any
  }

  static get<T = any>(endpoint: string, params?: Record<string, string>, options: RequestOptions = {}) {
    return this.request<T>(endpoint, { ...options, method: 'GET', params })
  }

  static post<T = any>(endpoint: string, body?: any, options: RequestOptions = {}) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  static delete<T = any>(endpoint: string, params?: Record<string, string>, options: RequestOptions = {}) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE', params })
  }

  // File uploads
  static async uploadFile<T = any>(endpoint: string, file: File): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('fg_token') : null
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    })

    if (!response.ok) {
      if (response.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('fg_token')
        window.location.href = '/login'
      }
      let errData = { error: 'Upload failed' }
      try {
        errData = await response.json()
      } catch (e) {}
      throw new Error(errData.error || `Upload failed with status ${response.status}`)
    }

    return response.json() as Promise<T>
  }
}
