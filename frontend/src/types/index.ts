/* === IntelliDoc AI Entity & Data Types === */

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
  confirmPassword?: string;
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
  | 'VALIDATING'
  | 'EXTRACTING'
  | 'CHUNKING'
  | 'EMBEDDING'
  | 'INDEXING'
  | 'ANALYZING'
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

export interface DocumentAnalytics {
  documentId: number;
  filename: string;
  fileType: string;
  pageCount: number;
  wordCount: number;
  characterCount: number;
  estimatedReadingTimeMinutes: number;
  sectionCount: number;
  chunkCount: number;
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
  evidenceCount?: number;
  details: string;
}

export interface ClaimVerification {
  claim: string;
  status: 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'UNSUPPORTED';
  confidence: number;
  evidenceQuote: string;
  sources?: Source[];
}

export interface VerifyResponse {
  documentId: number;
  status: 'supported' | 'partially_supported' | 'unsupported';
  claimStatus: ClaimStatus;
  confidence: number;
  claims: ClaimVerification[];
  overallAssessment: string;
  sources: Source[];
  mock: boolean;
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
  mock?: boolean;
}

export interface Conversation {
  id: number;
  title: string;
  documentId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: number;
  conversationId: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  sources?: Source[];
  verification?: VerificationResult;
}

export interface StudyMaterialRequest {
  difficulty?: 'easy' | 'medium' | 'hard' | string;
  types?: Array<'mcq' | 'flashcard' | 'qa' | 'short_answer' | string>;
  count?: number;
}

export interface StudyQuestion {
  type: 'mcq' | 'qa' | 'flashcard' | 'short_answer';
  question?: string;
  front?: string;
  back?: string;
  options?: string[];
  correctAnswer?: string;
  correct?: string;
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | string;
  sourceReference?: string;
}

export interface FlashcardItem {
  front: string;
  back: string;
  sourceReference?: string;
}

export interface StudyMaterialResponse {
  questions: StudyQuestion[];
  flashcards: FlashcardItem[];
  mock: boolean;
}

export interface Collection {
  id: number;
  name: string;
  description: string;
  documentCount: number;
  createdAt: string;
}

export interface DashboardStats {
  totalDocuments: number;
  processingCount?: number;
  completedCount?: number;
  processedDocuments?: number;
  summariesGenerated?: number;
  questionsAsked?: number;
  totalCollections?: number;
  totalQueries?: number;
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

/* === Developer & API Keys === */
export interface ApiKeyItem {
  id: number;
  name: string;
  keyPrefix: string;
  rateLimit: number;
  totalRequests: number;
  status: 'ACTIVE' | 'REVOKED';
  lastUsedAt?: string;
  createdAt: string;
}

export interface ApiKeyCreatedResponse {
  id: number;
  name: string;
  apiKey: string;
  keyPrefix: string;
  rateLimit: number;
  createdAt: string;
}

export interface ApiUsageLogItem {
  id: number;
  endpoint: string;
  method: string;
  statusCode: number;
  responseMs: number;
  timestamp: string;
}

/* === Workspaces & Collaboration === */
export interface WorkspaceItem {
  id: number;
  name: string;
  description: string;
  ownerId: number;
  role: string;
  memberCount: number;
  createdAt: string;
}

export interface WorkspaceMemberItem {
  id: number;
  userId: number;
  email: string;
  name: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  joinedAt: string;
}

export interface CommentItem {
  id: number;
  summaryId: number;
  userId: number;
  userName: string;
  userEmail: string;
  text: string;
  sectionId?: string;
  resolved: boolean;
  createdAt: string;
  replies: CommentReplyItem[];
}

export interface CommentReplyItem {
  id: number;
  userId: number;
  userName: string;
  text: string;
  createdAt: string;
}

/* === Summaries V2 === */
export interface SummaryV2Item {
  id: number;
  title: string;
  summaryText: string;
  mode: string;
  length: string;
  persona: string;
  language: string;
  confidenceScore: number;
  compressionRatio?: number;
  readabilityScore?: number;
  wordCount?: number;
  readingTimeMinutes?: number;
  sections?: Array<{ id: string; title: string; content: string }>;
  insights?: Array<{ id: string; title: string; insight: string; whyThisMatters: string; importance: string }>;
  sentiment?: { tone: string; score: number; distribution?: Record<string, number> };
  traceability?: Array<{ segmentId: string; segmentText: string; sourceSentence: string; similarity: number }>;
  generatedAt: string;
}

