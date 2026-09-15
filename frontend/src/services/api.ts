import axios from 'axios';
import type {
  AuthRequest, AuthResponse, Document,
  ChatRequest, ChatResponse, DashboardStats, Collection,
  StudyMaterialRequest, StudyMaterialResponse,
  DocumentIntelligence, DocumentAnalytics, Conversation, Message,
  MultiLevelSummary, SummaryMode,
  ContradictionResponse, KnowledgeMapResponse, ProcessingJob,
  VerifyResponse, User,
} from '../types';

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// JWT interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('intellidoc_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
      localStorage.removeItem('intellidoc_token');
      localStorage.removeItem('intellidoc_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/* === Auth === */
export const authApi = {
  register: (data: AuthRequest) => api.post<AuthResponse>('/auth/register', data),
  login: (data: AuthRequest) => api.post<AuthResponse>('/auth/login', data),
  refresh: (token: string) => api.post<AuthResponse>('/auth/refresh', { token }),
  logout: () => api.post<{ message: string; success: boolean }>('/auth/logout'),
  getMe: () => api.get<User>('/auth/me'),
};

/* === Documents === */
export const documentApi = {
  upload: (file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ document: Document; jobId: string }>('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total && onProgress) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    });
  },
  getAll: () => api.get<Document[]>('/documents'),
  getById: (id: number) => api.get<Document>(`/documents/${id}`),
  delete: (id: number) => api.delete(`/documents/${id}`),
  getStatus: (id: number) => api.get<Document>(`/documents/${id}/status`),
  getAnalytics: (id: number) => api.get<DocumentAnalytics>(`/documents/${id}/analytics`),
  getIntelligence: (id: number) => api.get<DocumentIntelligence>(`/documents/${id}/intelligence`),
  verify: (id: number, data: { text?: string; claims?: string[] }) =>
    api.post<VerifyResponse>(`/documents/${id}/verify`, data),
  getContradictions: (id: number) => api.get<ContradictionResponse>(`/documents/${id}/contradictions`),
  getKnowledgeMap: (id: number) => api.get<KnowledgeMapResponse>(`/documents/${id}/knowledge-map`),
};

/* === Async Jobs === */
export const jobApi = {
  getStatus: (jobId: string) => api.get<ProcessingJob>(`/jobs/${jobId}`),
};

/* === Summaries === */
export const summaryApi = {
  generateMultiLevel: (docId: number, data: { mode: SummaryMode; targetLevel?: number }) =>
    api.post<MultiLevelSummary>(`/documents/${docId}/summarize/multi-level`, data),
  generateStandard: (docId: number, data: { length?: string; level?: string }) =>
    api.post<any>(`/documents/${docId}/summarize`, data),
  getByDocument: (docId: number) => api.get<any[]>(`/documents/${docId}/summaries`),
};

/* === Chat & RAG === */
export const chatApi = {
  sendMessage: (docId: number, data: ChatRequest) =>
    api.post<ChatResponse>(`/documents/${docId}/chat`, data),
  getConversations: (docId: number) =>
    api.get<Conversation[]>(`/documents/${docId}/conversations`),
  getMessages: (conversationId: number) =>
    api.get<Message[]>(`/conversations/${conversationId}/messages`),
};

/* === Study Mode === */
export const studyApi = {
  generate: (docId: number, data: StudyMaterialRequest) =>
    api.post<StudyMaterialResponse>(`/documents/${docId}/study-material`, data),
};

/* === Collections & Compare === */
export const collectionApi = {
  create: (data: { name: string; description: string }) =>
    api.post<Collection>('/collections', data),
  getAll: () => api.get<Collection[]>('/collections'),
  getById: (id: number) => api.get<Collection>(`/collections/${id}`),
  delete: (id: number) => api.delete(`/collections/${id}`),
  addDocument: (collectionId: number, documentId: number) =>
    api.post(`/collections/${collectionId}/documents`, { documentId }),
  removeDocument: (collectionId: number, documentId: number) =>
    api.delete(`/collections/${collectionId}/documents/${documentId}`),
  getDocuments: (collectionId: number) =>
    api.get<Document[]>(`/collections/${collectionId}/documents`),
  chat: (collectionId: number, data: ChatRequest) =>
    api.post<ChatResponse>(`/collections/${collectionId}/chat`, data),
  compare: (collectionId: number, data: any) =>
    api.post<any>(`/collections/${collectionId}/compare`, data),
};

/* === Dashboard === */
export const dashboardApi = {
  getStats: () => api.get<DashboardStats>('/dashboard/stats'),
};

/* === Developer & API Keys === */
export const developerApi = {
  createKey: (data: { name: string; rateLimit?: number }) =>
    api.post<import('../types').ApiKeyCreatedResponse>('/developer/keys', data),
  getKeys: () =>
    api.get<import('../types').ApiKeyItem[]>('/developer/keys'),
  revokeKey: (id: number) =>
    api.delete(`/developer/keys/${id}`),
  getUsage: (id: number) =>
    api.get<import('../types').ApiUsageLogItem[]>(`/developer/keys/${id}/usage`),
};

/* === Workspaces & Collaboration === */
export const workspaceApi = {
  create: (data: { name: string; description?: string }) =>
    api.post<import('../types').WorkspaceItem>('/workspaces', data),
  getAll: () =>
    api.get<import('../types').WorkspaceItem[]>('/workspaces'),
  getById: (id: number) =>
    api.get<import('../types').WorkspaceItem>(`/workspaces/${id}`),
  addMember: (workspaceId: number, data: { email: string; role?: string }) =>
    api.post<import('../types').WorkspaceMemberItem>(`/workspaces/${workspaceId}/members`, data),
  removeMember: (workspaceId: number, memberId: number) =>
    api.delete(`/workspaces/${workspaceId}/members/${memberId}`),
  getSummaries: (workspaceId: number) =>
    api.get<any[]>(`/workspaces/${workspaceId}/summaries`),
};

/* === Comments & Feedback === */
export const commentApi = {
  addComment: (summaryId: number, data: { text: string; sectionId?: string }) =>
    api.post<import('../types').CommentItem>(`/summaries/${summaryId}/comments`, data),
  getComments: (summaryId: number) =>
    api.get<import('../types').CommentItem[]>(`/summaries/${summaryId}/comments`),
  addReply: (commentId: number, data: { text: string }) =>
    api.post<import('../types').CommentReplyItem>(`/summaries/comments/${commentId}/replies`, data),
  toggleResolve: (commentId: number) =>
    api.patch<import('../types').CommentItem>(`/summaries/comments/${commentId}/resolve`),
};

/* === Summaries V2 === */
export const summaryV2Api = {
  generate: (data: {
    title?: string;
    text?: string;
    documentId?: number;
    mode?: string;
    length?: string;
    persona?: string;
    language?: string;
    workspaceId?: number;
  }, apiKey?: string) =>
    api.post<import('../types').SummaryV2Item>('/v1/summaries', data, {
      headers: apiKey ? { 'X-API-Key': apiKey } : undefined,
    }),
  getUserSummaries: () =>
    api.get<import('../types').SummaryV2Item[]>('/v1/summaries'),
  getById: (id: number) =>
    api.get<import('../types').SummaryV2Item>(`/v1/summaries/${id}`),
  getVersions: (id: number) =>
    api.get<any[]>(`/v1/summaries/${id}/versions`),
  restoreVersion: (id: number, versionNumber: number, data?: any) =>
    api.post<import('../types').SummaryV2Item>(`/v1/summaries/${id}/versions/${versionNumber}/restore`, data),
  getExportUrl: (id: number, format: 'pdf' | 'docx' | 'markdown') =>
    `${API_BASE}/v1/summaries/${id}/export?format=${format}`,
};

export default api;

