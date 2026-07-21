import api from './axios.config';

export interface RegisterUserData {
  employeeId: string;
  username: string;
  password: string;
  email?: string;
  role?: string;
  designation?: string;
  departmentId?: string;
}

export interface LoginCredentials {
  employeeId?: string;
  username?: string;
  password: string;
}

export const authService = {
  register: async (userData: RegisterUserData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials: LoginCredentials) => {
    const response = await api.post('/auth/login', credentials);
    const token = response.data.accessToken || response.data.token;
    if (token && typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  getCurrentUser: () => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  },

  isAuthenticated: () => {
    if (typeof window !== 'undefined') {
      return !!(localStorage.getItem('token') || localStorage.getItem('refreshToken'));
    }
    return false;
  }
};
