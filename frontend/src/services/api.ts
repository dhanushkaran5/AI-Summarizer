import axios from 'axios';
import type {
  AuthRequest, AuthResponse, Document,
  ChatRequest, ChatResponse, DashboardStats, Collection,
  StudyMaterialRequest, StudyMaterialResponse,
  DocumentIntelligence, Conversation, Message,
  MultiLevelSummary, SummaryMode,
  ContradictionResponse, KnowledgeMapResponse, ProcessingJob,
} from '../types';

const API_BASE = '/api';

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
    if (error.response?.status === 401) {
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
  getIntelligence: (id: number) => api.get<DocumentIntelligence>(`/documents/${id}/intelligence`),
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

export default api;
