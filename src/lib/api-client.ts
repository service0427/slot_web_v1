// API 클라이언트 설정

interface ApiConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
}

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
  success: boolean;
}

class ApiClient {
  private config: ApiConfig;

  constructor(config?: Partial<ApiConfig>) {
    this.config = {
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
      timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
      headers: {
        'Content-Type': 'application/json',
      },
      ...config,
    };
  }

  // 인증 토큰 설정
  setAuthToken(token: string | null) {
    if (token) {
      this.config.headers['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.config.headers['Authorization'];
    }
  }

  // 기본 요청 메서드
  private async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    config?: RequestInit
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.baseURL}${endpoint}`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        method,
        headers: this.config.headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
        ...config,
      });

      clearTimeout(timeoutId);

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          data: responseData.data,
          error: responseData.error || response.statusText,
          message: responseData.message || '요청 처리 중 오류가 발생했습니다.',
          status: response.status,
          success: false,
        };
      }

      return {
        data: responseData.data || responseData,
        message: responseData.message || '성공',
        status: response.status,
        success: true,
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return {
          error: '요청 시간이 초과되었습니다.',
          message: '요청 시간이 초과되었습니다.',
          status: 408,
          success: false,
        };
      }

      return {
        error: error.message || '네트워크 오류가 발생했습니다.',
        message: error.message || '네트워크 오류가 발생했습니다.',
        status: 0,
        success: false,
      };
    }
  }

  // GET 요청
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const queryString = params
      ? '?' + new URLSearchParams(params).toString()
      : '';
    return this.request<T>('GET', `${endpoint}${queryString}`);
  }

  // POST 요청
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, data);
  }

  // PUT 요청
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, data);
  }

  // PATCH 요청
  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, data);
  }

  // DELETE 요청
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint);
  }

  // 파일 업로드
  async upload<T>(
    endpoint: string,
    formData: FormData,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    const headers = { ...this.config.headers };
    delete headers['Content-Type']; // 브라우저가 자동으로 설정

    try {
      const xhr = new XMLHttpRequest();

      return new Promise((resolve) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          const responseData = JSON.parse(xhr.responseText || '{}');
          
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({
              data: responseData.data || responseData,
              message: responseData.message || '업로드 성공',
              status: xhr.status,
              success: true,
            });
          } else {
            resolve({
              error: responseData.error || xhr.statusText,
              message: responseData.message || '업로드 실패',
              status: xhr.status,
              success: false,
            });
          }
        });

        xhr.addEventListener('error', () => {
          resolve({
            error: '네트워크 오류가 발생했습니다.',
            message: '네트워크 오류가 발생했습니다.',
            status: 0,
            success: false,
          });
        });

        xhr.addEventListener('timeout', () => {
          resolve({
            error: '요청 시간이 초과되었습니다.',
            message: '요청 시간이 초과되었습니다.',
            status: 408,
            success: false,
          });
        });

        xhr.open('POST', `${this.config.baseURL}${endpoint}`);
        xhr.timeout = this.config.timeout;

        Object.entries(headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });

        xhr.send(formData);
      });
    } catch (error: any) {
      return {
        error: error.message || '업로드 중 오류가 발생했습니다.',
        message: error.message || '업로드 중 오류가 발생했습니다.',
        status: 0,
        success: false,
      };
    }
  }
}

// 싱글톤 인스턴스
export const apiClient = new ApiClient();

// 개발 모드에서는 더미 데이터 반환 (백엔드 준비 전)
const isDevelopment = import.meta.env.DEV;

// API 인터셉터 (개발 모드용)
export const createApiInterceptor = (dummyData: any) => {
  return async <T>(): Promise<ApiResponse<T>> => {
    if (isDevelopment && !import.meta.env.VITE_API_BASE_URL) {
      // 개발 모드에서 API URL이 설정되지 않았으면 더미 데이터 반환
      return {
        data: dummyData as T,
        message: '더미 데이터',
        status: 200,
        success: true,
      };
    }
    // 실제 API 호출은 apiClient를 통해 처리
    return { success: false, status: 0, error: 'Not implemented' };
  };
};