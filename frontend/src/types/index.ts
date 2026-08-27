/* === ANTI-SUMMARY Entity & Data Types === */

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

export interface AuthRequest {
  email: string;
  password?: string;
  name?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Document {
  id: number;
  userId: number;
  filename: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  status: DocumentStatus;
  pageCount: number;
  wordCount: number;
  charCount: number;
  readingTimeMinutes: number;
  uploadedAt: string;
  processedAt?: string;
  keywords?: string[];
  keyConcepts?: string[];
}

export type DocumentStatus =
  | 'UPLOADING'
  | 'EXTRACTING'
  | 'CHUNKING'
  | 'EMBEDDING'
  | 'SUMMARIZING'
  | 'COMPLETED'
  | 'FAILED';

export interface DocumentChunk {
  chunkIndex: number;
  text: string;
  pageNumber?: number;
  section?: string;
  metadata: {
    charStart?: number;
    charEnd?: number;
    wordCount?: number;
  };
}

export interface MultiLevelSummary {
  documentId: number;
  mode: SummaryMode;
  level0: string; // One-sentence essence
  level1: string; // Executive summary
  level2: Record<string, string>; // Detailed section breakdown
  level3: Array<{ section: string; summary: string; page?: number }>; // Section-by-section
  level4: string; // Deep technical analysis
  level5: Array<{ question: string; answer: string }>; // Q&A Knowledge base
  mock: boolean;
}

export type SummaryMode =
  | 'executive'
  | 'student'
  | 'research'
  | 'technical'
  | 'beginner'
  | 'meeting'
  | 'exam'
  | 'legal_policy'
  | 'custom';

export interface Contradiction {
  statementA: string;
  sectionA?: string;
  pageA?: number;
  statementB: string;
  sectionB?: string;
  pageB?: number;
  explanation: string;
  severity: 'high' | 'medium' | 'low';
}

export interface ContradictionResponse {
  documentId: number;
  contradictions: Contradiction[];
  count: number;
  mock: boolean;
}

export interface KnowledgeNode {
  id: string;
  name: string;
  category?: 'core' | 'concept' | 'section' | 'evidence' | 'keyword';
  section?: string;
  page?: number;
  description?: string;
  children?: KnowledgeNode[];
}

export interface KnowledgeMapResponse {
  documentId: number;
  title: string;
  root: KnowledgeNode;
  mock: boolean;
}

export interface ProcessingJob {
  jobId: string;
  documentId: number;
  status: DocumentStatus;
  progressPercent: number;
  currentStageDescription?: string;
  errorMessage?: string;
  diagnosticRemedy?: string;
  createdAt: string;
  completedAt?: string;
}

export interface Source {
  pageNumber?: number;
  section?: string;
  chunkId: string;
  textPreview: string;
  relevanceScore: number;
  charStart?: number;
  charEnd?: number;
}

export type ClaimStatus = 'EXPLICITLY STATED' | 'INFERRED' | 'UNCERTAIN' | 'NOT FOUND';

export interface VerificationResult {
  status: 'supported' | 'partially_supported' | 'unsupported';
  claimStatus?: ClaimStatus;
  confidence: number;
  evidenceCount: number;
  details: string;
}

export interface ChatRequest {
  question: string;
  conversationId?: number;
  topK?: number;
}

export interface ChatResponse {
  answer: string;
  sources: Source[];
  verification?: VerificationResult;
  conversationId: number;
  messageId: number;
  mock: boolean;
}

export interface StudyMaterialRequest {
  difficulty?: string;
  types?: string[];
  count?: number;
}

export interface StudyMaterialResponse {
  documentId: number;
  questions: StudyQuestion[];
  mock: boolean;
}

export interface Message {
  id: number;
  conversationId: number;
  role: 'user' | 'assistant';
  content: string;
  sources: Source[];
  verification?: VerificationResult;
  claimStatus?: ClaimStatus;
  mock: boolean;
  createdAt: string;
}

export interface Conversation {
  id: number;
  userId: number;
  documentId?: number;
  collectionId?: number;
  title: string;
  createdAt: string;
}

export interface Collection {
  id: number;
  userId: number;
  name: string;
  description: string;
  documentCount: number;
  createdAt: string;
}

export interface StudyQuestion {
  type: string;
  question?: string;
  options?: string[];
  correct?: string;
  explanation?: string;
  answer?: string;
  front?: string;
  back?: string;
  term?: string;
  definition?: string;
  concept?: string;
}

export interface DocumentIntelligence {
  pageCount: number;
  wordCount: number;
  charCount: number;
  readingTimeMinutes: number;
  sectionCount: number;
  chunkCount: number;
  keywords: string[];
  keyConcepts: string[];
}

export interface DashboardStats {
  totalDocuments: number;
  processedDocuments: number;
  summariesGenerated: number;
  questionsAsked: number;
}

export interface UserPreference {
  defaultSummaryMode: SummaryMode;
  defaultDepthLevel: number;
  highContrastMode: boolean;
  textScalePercent: number;
  reducedMotion: boolean;
  preferredAiProvider: string;
}
