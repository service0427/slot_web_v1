import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 토큰 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 에러 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 인증 실패 시 로그인 페이지로
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Cash API
export const cashAPI = {
  getRequests: async (params?: { page?: number; limit?: number; status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    
    const response = await api.get(`/cash/requests?${queryParams}`);
    return response.data;
  },

  createRequest: async (data: any) => {
    const response = await api.post('/cash/requests', data);
    return response.data;
  },

  processRequest: async (id: string, data: { status: string; rejection_reason?: string }) => {
    const response = await api.patch(`/cash/requests/${id}`, data);
    return response.data;
  },

  getTransactions: async (params?: { page?: number; limit?: number; type?: string; user_id?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.user_id) queryParams.append('user_id', params.user_id);
    
    const response = await api.get(`/cash/transactions?${queryParams}`);
    return response.data;
  },

  getStatistics: async () => {
    const response = await api.get('/cash/statistics');
    return response.data;
  },

  getBalance: async () => {
    const response = await api.get('/auth/me');
    return { user: response.data };
  },
};

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    return response.data;
  },

  register: async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    return response.data;
  },

  logout: async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Slots API
export const slotsAPI = {
  getSlots: async (params?: any) => {
    const response = await api.get('/slots', { params });
    return response.data;
  },

  getSlot: async (id: string) => {
    const response = await api.get(`/slots/${id}`);
    return response.data;
  },

  createSlot: async (slotData: any) => {
    const response = await api.post('/slots', slotData);
    return response.data;
  },

  updateSlot: async (id: string, slotData: any) => {
    const response = await api.put(`/slots/${id}`, slotData);
    return response.data;
  },

  deleteSlot: async (id: string) => {
    const response = await api.delete(`/slots/${id}`);
    return response.data;
  },

  updateRanking: async (id: string, rank: number) => {
    const response = await api.post(`/slots/${id}/ranking`, { current_rank: rank });
    return response.data;
  },
};

// Inquiries API
export const inquiriesAPI = {
  getInquiries: async (params?: any) => {
    const response = await api.get('/inquiries', { params });
    return response.data;
  },

  getInquiry: async (id: string) => {
    const response = await api.get(`/inquiries/${id}`);
    return response.data;
  },

  createInquiry: async (inquiryData: any) => {
    const response = await api.post('/inquiries', inquiryData);
    return response.data;
  },

  sendMessage: async (inquiryId: string, message: string) => {
    const response = await api.post(`/inquiries/${inquiryId}/messages`, { message });
    return response.data;
  },

  updateStatus: async (id: string, status: string) => {
    const response = await api.patch(`/inquiries/${id}/status`, { status });
    return response.data;
  },
};

// Announcements API
export const announcementsAPI = {
  getAnnouncements: async (params?: any) => {
    const response = await api.get('/announcements', { params });
    return response.data;
  },

  getAnnouncement: async (id: string) => {
    const response = await api.get(`/announcements/${id}`);
    return response.data;
  },

  createAnnouncement: async (announcementData: any) => {
    const response = await api.post('/announcements', announcementData);
    return response.data;
  },

  updateAnnouncement: async (id: string, announcementData: any) => {
    const response = await api.put(`/announcements/${id}`, announcementData);
    return response.data;
  },

  deleteAnnouncement: async (id: string) => {
    const response = await api.delete(`/announcements/${id}`);
    return response.data;
  },
};

// Users API
export const usersAPI = {
  getUsers: async (params?: any) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  getUser: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  createUser: async (userData: any) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  updateUser: async (id: string, userData: any) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  changePassword: async (id: string, passwordData: any) => {
    const response = await api.post(`/users/${id}/password`, passwordData);
    return response.data;
  },

  getChildren: async (id: string) => {
    const response = await api.get(`/users/${id}/children`);
    return response.data;
  },
};

export default api;