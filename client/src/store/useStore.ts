import { create } from 'zustand';
import api from '../api/client';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Application {
  id: string;
  programType: string;
  status: string;
  applicantFirstName: string;
  applicantLastName: string;
  applicantEmail: string;
  applicantPhone?: string;
  applicantDOB?: string;
  applicantAddress1?: string;
  applicantCity?: string;
  applicantState?: string;
  applicantZip?: string;
  requestedAmount?: number;
  projectDescription?: string;
  createdAt: string;
  updatedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
  screeningResults?: any[];
  fraudDecision?: any;
}

interface Analytics {
  totalApplications: number;
  approved: number;
  flagged: number;
  denied: number;
  fraudDetectionRate: number;
  averageRiskScore: number;
}

interface Store {
  user: User | null;
  token: string | null;
  applications: Application[];
  currentApplication: Application | null;
  analytics: Analytics | null;
  sidebarCollapsed: boolean;
  loading: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  fetchApplications: (filters?: Record<string, string>) => Promise<void>;
  fetchApplication: (id: string) => Promise<void>;
  createApplication: (data: any) => Promise<string>;
  updateApplication: (id: string, data: any) => Promise<void>;
  fetchAnalytics: () => Promise<void>;
  runScreening: (applicationId: string) => Promise<any>;
  toggleSidebar: () => void;
}

export const useStore = create<Store>((set, get) => ({
  user: null,
  token: localStorage.getItem('gs_token'),
  applications: [],
  currentApplication: null,
  analytics: null,
  sidebarCollapsed: false,
  loading: false,

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('gs_token', data.token);
    set({ token: data.token, user: data.user });
  },

  logout: () => {
    localStorage.removeItem('gs_token');
    set({ user: null, token: null });
  },

  checkAuth: async () => {
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.user });
    } catch {
      localStorage.removeItem('gs_token');
      set({ user: null, token: null });
    }
  },

  fetchApplications: async (filters) => {
    set({ loading: true });
    try {
      const params = new URLSearchParams(filters);
      const { data } = await api.get(`/applications?${params}`);
      set({ applications: data.data || [] });
    } finally {
      set({ loading: false });
    }
  },

  fetchApplication: async (id) => {
    set({ loading: true });
    try {
      const { data } = await api.get(`/applications/${id}`);
      set({ currentApplication: data });
    } finally {
      set({ loading: false });
    }
  },

  createApplication: async (appData) => {
    const { data } = await api.post('/applications', appData);
    return data.id;
  },

  updateApplication: async (id, appData) => {
    await api.patch(`/applications/${id}`, appData);
    const current = get().currentApplication;
    if (current?.id === id) {
      get().fetchApplication(id);
    }
  },

  fetchAnalytics: async () => {
    const { data } = await api.get('/analytics/overview');
    set({ analytics: data });
  },

  runScreening: async (applicationId) => {
    const { data } = await api.post(`/screening/${applicationId}/run`);
    get().fetchApplication(applicationId);
    return data;
  },

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
