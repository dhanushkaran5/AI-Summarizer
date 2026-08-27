import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText, BookOpen, MessageSquare, Link2,
  GraduationCap, Brain, Download, Clock, Hash,
  Send, Copy, CheckCircle, AlertTriangle,
  GitFork, ShieldAlert, X, Sparkles, ExternalLink
} from 'lucide-react';
import type {
  Document as DocType, MultiLevelSummary, SummaryMode,
  Source, VerificationResult, StudyQuestion, Contradiction, KnowledgeNode
} from '../types';
import { documentApi, summaryApi, chatApi, studyApi } from '../services/api';

type TabId = 'summary' | 'evidence' | 'contradictions' | 'knowledge_map' | 'chat' | 'study';

const MODES: { id: SummaryMode; label: string; desc: string }[] = [
  { id: 'executive', label: 'Executive', desc: 'Bottom-line impact, risks, and ROI' },
  { id: 'student', label: 'Student', desc: 'Core concepts, definitions, and takeaways' },
  { id: 'research', label: 'Research', desc: 'Methodology, findings, and limitations' },
  { id: 'technical', label: 'Technical', desc: 'Architecture, algorithms, and specs' },
  { id: 'beginner', label: 'Beginner (ELI5)', desc: 'Simple analogies and jargon-free' },
  { id: 'meeting', label: 'Meeting', desc: 'Action items, decisions, and owners' },
  { id: 'exam', label: 'Exam Prep', desc: 'High-yield testable points and formulas' },
  { id: 'legal_policy', label: 'Legal & Policy', desc: 'Rights, obligations, and compliance' },
  { id: 'custom', label: 'Custom', desc: 'Comprehensive multi-perspective analysis' },
];

const DEPTH_LEVELS = [
  { level: 0, label: 'L0: Essence', desc: 'One-sentence essence' },
  { level: 1, label: 'L1: Executive', desc: 'High-level executive overview' },
  { level: 2, label: 'L2: Structured', desc: 'Mode-specific detailed breakdown' },
  { level: 3, label: 'L3: Sections', desc: 'Section-by-section explanation' },
  { level: 4, label: 'L4: Deep Tech', desc: 'In-depth conceptual analysis' },
  { level: 5, label: 'L5: Knowledge Base', desc: 'Q&A knowledge base' },
];

export default function DocumentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const docId = Number(id);

  const [doc, setDoc] = useState<DocType | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('summary');
  const [loading, setLoading] = useState(true);

  // Multi-depth summary state
  const [summaryMode, setSummaryMode] = useState<SummaryMode>('student');
  const [selectedDepth, setSelectedDepth] = useState<number>(2);
  const [multiSummary, setMultiSummary] = useState<MultiLevelSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Source Viewer / Evidence Split Pane
  const [activeSource, setActiveSource] = useState<Source | null>(null);
  const [sourceDrawerOpen, setSourceDrawerOpen] = useState(false);

  // Contradictions & Knowledge Map
  const [contradictions, setContradictions] = useState<Contradiction[]>([]);
  const [contradictionsLoading, setContradictionsLoading] = useState(false);
  const [knowledgeMap, setKnowledgeMap] = useState<KnowledgeNode | null>(null);
  const [kmLoading, setKmLoading] = useState(false);

  // Chat & RAG state
  const [chatMessages, setChatMessages] = useState<Array<{
    role: string;
    content: string;
    sources?: Source[];
    verification?: VerificationResult;
    claimStatus?: string;
    mock?: boolean;
  }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Study state
  const [studyQuestions, setStudyQuestions] = useState<StudyQuestion[]>([]);
  const [studyDifficulty, setStudyDifficulty] = useState('medium');
  const [studyLoading, setStudyLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [revealedAnswers, setRevealedAnswers] = useState<Set<number>>(new Set());
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadDocument();
  }, [docId]);

  const loadDocument = async () => {
    try {
      const res = await documentApi.getById(docId);
      setDoc(res.data);
    } catch {
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const generateMultiLevelSummary = async (mode: SummaryMode = summaryMode) => {
    setSummaryLoading(true);
    try {
      const res = await summaryApi.generateMultiLevel(docId, { mode, targetLevel: selectedDepth });
      setMultiSummary(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSummaryLoading(false);
    }
  };

  const loadContradictions = async () => {
    setContradictionsLoading(true);
    try {
      const res = await documentApi.getContradictions(docId);
      setContradictions(res.data.contradictions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setContradictionsLoading(false);
    }
  };

  const loadKnowledgeMap = async () => {
    setKmLoading(true);
    try {
      const res = await documentApi.getKnowledgeMap(docId);
      setKnowledgeMap(res.data.root || null);
    } catch (err) {
      console.error(err);
    } finally {
      setKmLoading(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const question = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: question }]);
    setChatLoading(true);
    try {
      const res = await chatApi.sendMessage(docId, { question });
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data.answer,
        sources: res.data.sources,
        verification: res.data.verification,
        claimStatus: res.data.verification?.claimStatus || 'EXPLICITLY STATED',
        mock: res.data.mock,
      }]);
    } catch {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'This document does not provide enough information or the service is temporarily offline.',
        claimStatus: 'NOT FOUND',
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const generateStudyMaterial = async () => {
    setStudyLoading(true);
    try {
      const res = await studyApi.generate(docId, {
        difficulty: studyDifficulty,
        types: ['mcq', 'short_answer', 'flashcard'],
        count: 5,
      });
      setStudyQuestions(res.data.questions);
    } catch {} finally {
      setStudyLoading(false);
    }
  };

  const openSourceView = (source: Source) => {
    setActiveSource(source);
    setSourceDrawerOpen(true);
  };

  const tabs: { id: TabId; label: string; icon: any }[] = [
    { id: 'summary', label: 'Multi-Depth Summary', icon: BookOpen },
    { id: 'chat', label: 'Ask Document (RAG)', icon: MessageSquare },
    { id: 'evidence', label: 'Evidence & Citations', icon: Link2 },
    { id: 'contradictions', label: 'Contradiction Engine', icon: ShieldAlert },
    { id: 'knowledge_map', label: 'Knowledge Map', icon: GitFork },
    { id: 'study', label: 'Study & Exam Prep', icon: GraduationCap },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="animate-pulse-soft text-primary-600 font-semibold text-lg flex items-center gap-2">
          <Brain className="w-6 h-6 animate-bounce" /> Loading Document Intelligence...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 text-surface-900 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-surface-200 px-6 py-4 sticky top-0 z-30 shadow-sm" role="banner">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <nav aria-label="Breadcrumb" className="text-xs text-surface-400 mb-1 flex items-center gap-1">
              <Link to="/dashboard" className="hover:text-primary-600 transition-colors">Dashboard</Link>
              <span>/</span>
              <span className="text-surface-600 font-medium truncate max-w-xs">{doc?.originalName}</span>
            </nav>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-surface-900 truncate max-w-xl">{doc?.originalName}</h1>
                <div className="flex flex-wrap items-center gap-2 text-xs text-surface-500 mt-0.5">
                  <span className="badge badge-purple !py-0.5">{doc?.fileType?.toUpperCase()}</span>
                  <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{doc?.pageCount || 1} pages</span>
                  {doc?.wordCount ? <span>• {doc.wordCount.toLocaleString()} words</span> : null}
                  {doc?.readingTimeMinutes ? <span className="flex items-center gap-1">• <Clock className="w-3 h-3" />{doc.readingTimeMinutes}m read</span> : null}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const textBlob = new Blob([multiSummary ? JSON.stringify(multiSummary, null, 2) : "ANTI-SUMMARY Intelligence"], { type: 'text/plain' });
                const url = URL.createObjectURL(textBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${doc?.originalName}-summary.txt`;
                a.click();
              }}
              className="btn-secondary !py-2 !px-4 !text-sm"
              aria-label="Export Summary"
            >
              <Download className="w-4 h-4" /> Export Insights
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 gap-6">
        {/* Navigation Tabs */}
        <div className="tab-group flex-wrap" role="tablist" aria-label="Document Intelligence Views">
          {tabs.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-${tab.id}`}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'contradictions' && contradictions.length === 0) loadContradictions();
                if (tab.id === 'knowledge_map' && !knowledgeMap) loadKnowledgeMap();
              }}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: MULTI-DEPTH SUMMARY (LEVELS 0-5) */}
        {activeTab === 'summary' && (
          <div id="tabpanel-summary" role="tabpanel" aria-labelledby="tab-summary" className="space-y-6 animate-fade-in">
            {/* Mode & Depth Control Bar */}
            <div className="card !p-5 bg-gradient-to-r from-primary-50/50 via-white to-primary-50/30 border border-primary-100">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Mode Selector */}
                <div>
                  <label htmlFor="summary-mode" className="text-xs font-bold text-surface-500 uppercase tracking-wider block mb-1.5">
                    1. Select Understanding Mode
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {MODES.map(m => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setSummaryMode(m.id);
                          generateMultiLevelSummary(m.id);
                        }}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                          summaryMode === m.id
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'bg-white border border-surface-200 text-surface-700 hover:border-primary-300'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate Action */}
                <div className="flex items-end">
                  <button
                    onClick={() => generateMultiLevelSummary()}
                    disabled={summaryLoading}
                    className="btn-primary !py-2.5 !px-6 !text-sm w-full lg:w-auto"
                  >
                    {summaryLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" /> Transform Document
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Depth Level Switcher (L0 to L5) */}
              <div className="mt-5 pt-4 border-t border-surface-200/60">
                <label className="text-xs font-bold text-surface-500 uppercase tracking-wider block mb-2">
                  2. Choose Understanding Depth (Levels 0–5)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {DEPTH_LEVELS.map(d => (
                    <button
                      key={d.level}
                      onClick={() => setSelectedDepth(d.level)}
                      className={`depth-btn text-left p-2.5 flex flex-col justify-between ${
                        selectedDepth === d.level ? 'active' : ''
                      }`}
                    >
                      <span className="font-bold text-xs">{d.label}</span>
                      <span className="text-[11px] opacity-80 truncate">{d.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Render Selected Depth Content */}
            {multiSummary ? (
              <div className="card space-y-6" style={{ animation: 'scale-in 0.25s ease-out' }}>
                <div className="flex items-center justify-between border-b border-surface-100 pb-3">
                  <span className="badge badge-purple text-xs uppercase tracking-wider">
                    {multiSummary.mode.replace('_', ' ')} Mode • Level {selectedDepth} View
                  </span>
                  {multiSummary.mock && (
                    <span className="badge badge-yellow text-xs flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Resilient Local Heuristics
                    </span>
                  )}
                </div>

                {/* Level 0: Essence */}
                {selectedDepth === 0 && (
                  <div className="p-6 bg-primary-50/50 rounded-2xl border border-primary-200">
                    <h3 className="text-xs font-bold text-primary-700 uppercase tracking-wider mb-2">
                      Level 0 — One-Sentence Essence
                    </h3>
                    <p className="text-xl md:text-2xl font-bold text-surface-900 leading-snug">
                      "{multiSummary.level0}"
                    </p>
                  </div>
                )}

                {/* Level 1: Executive Summary */}
                {selectedDepth === 1 && (
                  <div>
                    <h3 className="text-lg font-bold text-surface-900 mb-3">Level 1 — Executive Summary</h3>
                    <p className="text-surface-700 leading-relaxed whitespace-pre-wrap text-base">
                      {multiSummary.level1}
                    </p>
                  </div>
                )}

                {/* Level 2: Mode-Specific Structured Sections */}
                {selectedDepth === 2 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-surface-900 mb-2">
                      Level 2 — {MODES.find(m => m.id === multiSummary.mode)?.label} Detailed Breakdown
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {Object.entries(multiSummary.level2).map(([secTitle, secContent]) => (
                        <div key={secTitle} className="p-5 bg-surface-50 rounded-xl border border-surface-200 hover-lift">
                          <h4 className="font-bold text-primary-700 mb-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary-500" />
                            {secTitle}
                          </h4>
                          <p className="text-sm text-surface-600 leading-relaxed whitespace-pre-wrap">{secContent}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Level 3: Section-by-Section Breakdown */}
                {selectedDepth === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-surface-900 mb-2">Level 3 — Section-by-Section Analysis</h3>
                    {multiSummary.level3.map((sec, idx) => (
                      <div key={idx} className="p-4 bg-surface-50 rounded-xl border border-surface-200 flex items-start gap-4">
                        <span className="w-8 h-8 rounded-xl bg-primary-100 text-primary-700 text-sm font-bold flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-surface-900">{sec.section}</h4>
                            {sec.page && <span className="text-xs text-surface-400">Page {sec.page}</span>}
                          </div>
                          <p className="text-sm text-surface-600 mt-1 leading-relaxed">{sec.summary}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Level 4: Deep Technical Analysis */}
                {selectedDepth === 4 && (
                  <div>
                    <h3 className="text-lg font-bold text-surface-900 mb-3">Level 4 — Deep Technical & Methodological Analysis</h3>
                    <div className="p-6 bg-surface-50 rounded-2xl border border-surface-200 text-surface-700 leading-relaxed whitespace-pre-wrap">
                      {multiSummary.level4}
                    </div>
                  </div>
                )}

                {/* Level 5: Q&A Knowledge Base */}
                {selectedDepth === 5 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-surface-900 mb-2">Level 5 — Q&A Knowledge Base</h3>
                    {multiSummary.level5.map((qa, i) => (
                      <div key={i} className="p-5 bg-surface-50 rounded-xl border border-surface-200">
                        <p className="font-bold text-surface-900 text-base mb-2">Q: {qa.question}</p>
                        <p className="text-sm text-surface-600 leading-relaxed pl-3 border-l-2 border-primary-400">
                          {qa.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="card text-center py-16">
                <Brain className="w-16 h-16 text-primary-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-surface-900 mb-2">No Summary Generated Yet</h3>
                <p className="text-surface-500 max-w-md mx-auto mb-6 text-sm">
                  Click "Transform Document" above to generate a multi-depth understanding layer across Levels 0 through 5.
                </p>
                <button onClick={() => generateMultiLevelSummary()} className="btn-primary">
                  <Sparkles className="w-4 h-4" /> Transform Now
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ASK DOCUMENT (RAG CHATBOT) */}
        {activeTab === 'chat' && (
          <div id="tabpanel-chat" role="tabpanel" aria-labelledby="tab-chat" className="card !p-0 overflow-hidden animate-fade-in flex flex-col h-[650px]">
            <div className="p-4 border-b border-surface-200 bg-surface-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-surface-900 flex items-center gap-2 text-base">
                  <MessageSquare className="w-5 h-5 text-primary-600" /> Ask Your Document (Grounded RAG)
                </h3>
                <p className="text-xs text-surface-500">Every response is strictly verified and cited back to document evidence.</p>
              </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 && (
                <div className="text-center py-16">
                  <MessageSquare className="w-12 h-12 text-surface-300 mx-auto mb-3" />
                  <p className="text-surface-600 font-medium">Ask any question about this document</p>
                  <div className="flex flex-wrap gap-2 justify-center mt-4 max-w-xl mx-auto">
                    {[
                      'What is the main problem addressed?',
                      'Explain the methodology used.',
                      'What are the core limitations?',
                      'Compare the findings in section 2 with section 4.',
                    ].map(q => (
                      <button
                        key={q}
                        onClick={() => { setChatInput(q); }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors border border-primary-200"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-4.5 ${
                    msg.role === 'user'
                      ? 'gradient-bg text-white'
                      : 'bg-surface-50 text-surface-900 border border-surface-200'
                  }`}>
                    {/* Anti-Hallucination Claim Status Tag */}
                    {msg.role === 'assistant' && msg.claimStatus && (
                      <div className="mb-2">
                        <span className={`badge text-xs font-bold ${
                          msg.claimStatus === 'EXPLICITLY STATED' ? 'claim-explicit' :
                          msg.claimStatus === 'INFERRED' ? 'claim-inferred' :
                          msg.claimStatus === 'UNCERTAIN' ? 'claim-uncertain' : 'claim-notfound'
                        }`}>
                          CLAIM STATUS: {msg.claimStatus}
                        </span>
                      </div>
                    )}

                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                    {/* Sources & Citations with View Source buttons */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-surface-200/60">
                        <p className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">
                          Evidence Sources (Click to View):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {msg.sources.map((src, sIdx) => (
                            <button
                              key={sIdx}
                              onClick={() => openSourceView(src)}
                              className="text-xs px-2.5 py-1 rounded-lg bg-white border border-primary-200 text-primary-700 hover:bg-primary-50 font-medium flex items-center gap-1.5 transition-colors shadow-xs"
                            >
                              <Link2 className="w-3 h-3" />
                              Page {src.pageNumber || 1} • {src.section || `Chunk ${sIdx + 1}`}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-3 mt-3 pt-2 border-t border-surface-100 text-xs text-surface-400">
                        <button
                          onClick={() => navigator.clipboard.writeText(msg.content)}
                          className="hover:text-surface-700 flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-surface-50 rounded-2xl p-4 border border-surface-200">
                    <div className="flex items-center gap-2 text-primary-600 text-xs font-medium">
                      <div className="w-2 h-2 rounded-full bg-primary-500 animate-ping" />
                      Retrieving evidence & validating citations...
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-surface-200 bg-white">
              <div className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Ask a question about this document..."
                  className="input-field"
                  aria-label="Question input"
                />
                <button
                  onClick={sendChatMessage}
                  disabled={chatLoading || !chatInput.trim()}
                  className="btn-primary !px-5"
                  aria-label="Send question"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: EVIDENCE & CITATIONS */}
        {activeTab === 'evidence' && (
          <div id="tabpanel-evidence" role="tabpanel" aria-labelledby="tab-evidence" className="card space-y-4 animate-fade-in">
            <div>
              <h3 className="text-lg font-bold text-surface-900">Document Evidence Repository</h3>
              <p className="text-sm text-surface-500">Every extracted chunk, section mapping, and character span.</p>
            </div>
            {chatMessages.flatMap(m => m.sources || []).length > 0 ? (
              <div className="space-y-3">
                {chatMessages.flatMap(m => m.sources || []).map((src, i) => (
                  <div key={i} className="p-4 bg-surface-50 rounded-xl border border-surface-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <span className="badge badge-purple text-xs mb-1.5">Page {src.pageNumber || 1} • {src.section || 'General Content'}</span>
                      <p className="text-sm text-surface-700 italic">"{src.textPreview}"</p>
                    </div>
                    <button onClick={() => openSourceView(src)} className="btn-secondary !py-1.5 !px-3 !text-xs self-start md:self-auto">
                      <ExternalLink className="w-3 h-3" /> View In Split Pane
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-12 text-surface-400">
                Ask questions in the Ask Document tab to dynamically populate verified evidence citations.
              </p>
            )}
          </div>
        )}

        {/* TAB 4: CONTRADICTION ENGINE */}
        {activeTab === 'contradictions' && (
          <div id="tabpanel-contradictions" role="tabpanel" aria-labelledby="tab-contradictions" className="card space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-surface-900 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-600" /> Contradiction Engine
                </h3>
                <p className="text-sm text-surface-500">Cross-section semantic consistency audit for conflicting statements.</p>
              </div>
              <button onClick={loadContradictions} disabled={contradictionsLoading} className="btn-secondary !py-2 !px-4 !text-xs">
                {contradictionsLoading ? 'Scanning...' : 'Re-scan Inconsistencies'}
              </button>
            </div>

            {contradictionsLoading ? (
              <div className="text-center py-12 text-surface-400">Scanning document for cross-section inconsistencies...</div>
            ) : contradictions.length > 0 ? (
              <div className="space-y-4">
                {contradictions.map((c, idx) => (
                  <div key={idx} className="p-5 bg-amber-50/60 rounded-xl border border-amber-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="badge badge-yellow text-xs font-bold uppercase">
                        Possible Inconsistency #{idx + 1} ({c.severity} Severity)
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-amber-900">{c.explanation}</p>
                    <div className="grid md:grid-cols-2 gap-3 pt-2">
                      <div className="p-3 bg-white rounded-lg border border-amber-100">
                        <span className="text-xs font-bold text-surface-500 block mb-1">
                          Statement A (Page {c.pageA || 1} • {c.sectionA || 'Section A'})
                        </span>
                        <p className="text-sm text-surface-800 italic">"{c.statementA}"</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-amber-100">
                        <span className="text-xs font-bold text-surface-500 block mb-1">
                          Statement B (Page {c.pageB || 2} • {c.sectionB || 'Section B'})
                        </span>
                        <p className="text-sm text-surface-800 italic">"{c.statementB}"</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-green-700 bg-green-50 rounded-xl border border-green-200">
                <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-600" />
                <p className="font-bold">No Inconsistencies Detected</p>
                <p className="text-xs opacity-80 mt-1">Cross-section analysis found no conflicting numerical values or statements.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: KNOWLEDGE MAP */}
        {activeTab === 'knowledge_map' && (
          <div id="tabpanel-knowledge_map" role="tabpanel" aria-labelledby="tab-knowledge_map" className="card space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-surface-900 flex items-center gap-2">
                  <GitFork className="w-5 h-5 text-primary-600" /> Semantic Document Knowledge Map
                </h3>
                <p className="text-sm text-surface-500">Hierarchical concept tree mapping entities back to document evidence.</p>
              </div>
              <button onClick={loadKnowledgeMap} disabled={kmLoading} className="btn-secondary !py-2 !px-4 !text-xs">
                {kmLoading ? 'Building...' : 'Refresh Map'}
              </button>
            </div>

            {knowledgeMap ? (
              <div className="p-6 bg-surface-50 rounded-2xl border border-surface-200 space-y-4">
                <div className="flex items-center gap-3 p-4 bg-primary-600 text-white rounded-xl font-bold text-base shadow-sm">
                  <Brain className="w-6 h-6" /> {knowledgeMap.name || doc?.originalName}
                </div>
                {knowledgeMap.children && (
                  <div className="pl-6 space-y-4 border-l-2 border-primary-200">
                    {knowledgeMap.children.map(node => (
                      <div key={node.id} className="space-y-2">
                        <div className="p-3 bg-white rounded-xl border border-surface-200 shadow-xs flex items-center justify-between">
                          <span className="font-bold text-surface-900 text-sm">{node.name}</span>
                          {node.page && <span className="badge badge-purple text-xs">Page {node.page}</span>}
                        </div>
                        {node.children && (
                          <div className="pl-6 space-y-2 border-l-2 border-surface-300">
                            {node.children.map(sub => (
                              <div key={sub.id} className="p-2.5 bg-surface-100 rounded-lg text-xs text-surface-700 flex items-center justify-between">
                                <span>{sub.name}</span>
                                {sub.description && <span className="text-[11px] text-surface-400 italic">{sub.description}</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-surface-400">Loading concept hierarchy...</div>
            )}
          </div>
        )}

        {/* TAB 6: STUDY & EXAM PREP */}
        {activeTab === 'study' && (
          <div id="tabpanel-study" role="tabpanel" aria-labelledby="tab-study" className="card space-y-6 animate-fade-in">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-surface-900 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary-600" /> AI Study Mode & Exam Generator
                </h3>
                <p className="text-sm text-surface-500">Generate high-yield MCQs, short answers, and interactive flashcards.</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={studyDifficulty}
                  onChange={e => setStudyDifficulty(e.target.value)}
                  className="input-field !py-2 !text-xs !w-auto"
                  aria-label="Difficulty"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                <button onClick={generateStudyMaterial} disabled={studyLoading} className="btn-primary !py-2 !px-4 !text-xs">
                  {studyLoading ? 'Generating...' : 'Generate Questions'}
                </button>
              </div>
            </div>

            {studyQuestions.length > 0 ? (
              <div className="space-y-4">
                {studyQuestions.map((q, i) => (
                  <div key={i} className="p-5 bg-surface-50 rounded-xl border border-surface-200">
                    {q.type === 'mcq' && (
                      <>
                        <p className="font-bold text-surface-900 mb-3">{i + 1}. {q.question}</p>
                        <div className="space-y-2">
                          {q.options?.map((opt, j) => (
                            <button
                              key={j}
                              onClick={() => setSelectedAnswers(prev => ({ ...prev, [i]: String.fromCharCode(65 + j) }))}
                              className={`w-full text-left p-3 rounded-xl text-sm transition-all border ${
                                selectedAnswers[i] === String.fromCharCode(65 + j)
                                  ? revealedAnswers.has(i)
                                    ? String.fromCharCode(65 + j) === q.correct ? 'border-green-500 bg-green-50 text-green-900 font-bold' : 'border-red-400 bg-red-50 text-red-900'
                                    : 'border-primary-500 bg-primary-50 font-medium'
                                  : 'border-surface-200 bg-white hover:border-surface-300'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                        {selectedAnswers[i] && !revealedAnswers.has(i) && (
                          <button onClick={() => setRevealedAnswers(prev => new Set(prev).add(i))} className="btn-primary !py-1.5 !px-4 !text-xs mt-3">
                            Check Answer
                          </button>
                        )}
                        {revealedAnswers.has(i) && (
                          <div className={`mt-3 p-3 rounded-xl text-xs leading-relaxed ${
                            selectedAnswers[i] === q.correct ? 'bg-green-50 text-green-900' : 'bg-amber-50 text-amber-900'
                          }`}>
                            {selectedAnswers[i] === q.correct ? '✓ Correct!' : `✗ Incorrect. Correct: ${q.correct}`}
                            {q.explanation && <p className="mt-1 opacity-90">{q.explanation}</p>}
                          </div>
                        )}
                      </>
                    )}

                    {q.type === 'flashcard' && (
                      <div
                        onClick={() => setFlippedCards(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; })}
                        className="cursor-pointer min-h-[100px] flex items-center justify-center text-center p-4 bg-white rounded-xl border border-primary-200 hover:shadow-xs transition-all"
                      >
                        {flippedCards.has(i) ? (
                          <div>
                            <p className="text-xs text-primary-600 font-bold mb-1 uppercase">Answer / Definition</p>
                            <p className="text-surface-800 text-sm">{q.back}</p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs text-surface-400 font-bold mb-1 uppercase">Concept (Click to Flip)</p>
                            <p className="font-bold text-surface-900 text-sm">{q.front}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-surface-400">
                Click "Generate Questions" to create interactive MCQs and revision flashcards.
              </div>
            )}
          </div>
        )}
      </main>

      {/* VIEW SOURCE SPLIT-PANE / MODAL */}
      {sourceDrawerOpen && activeSource && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-end" role="dialog" aria-modal="true" aria-label="Evidence Source Viewer">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl p-6 flex flex-col animate-slide-right overflow-y-auto">
            <div className="flex items-center justify-between border-b border-surface-200 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-primary-600" />
                <h3 className="font-bold text-surface-900 text-base">Verified Document Evidence</h3>
              </div>
              <button
                onClick={() => setSourceDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-100 hover:bg-surface-200 flex items-center justify-center transition-colors"
                aria-label="Close Evidence Viewer"
              >
                <X className="w-4 h-4 text-surface-600" />
              </button>
            </div>

            <div className="space-y-4 flex-1">
              <div className="p-3 bg-primary-50 rounded-xl border border-primary-200 text-xs">
                <span className="font-bold text-primary-800 block mb-1">Source Location</span>
                <p className="text-surface-700">📄 Page {activeSource.pageNumber || 1} • Section: {activeSource.section || 'General Text'}</p>
                <p className="text-surface-500 mt-1">Similarity Match: {(activeSource.relevanceScore * 100).toFixed(0)}%</p>
              </div>

              <div>
                <label className="text-xs font-bold text-surface-500 uppercase tracking-wider block mb-2">
                  Original Document Excerpt
                </label>
                <div className="p-4 bg-surface-50 rounded-xl border border-surface-200 text-sm text-surface-800 leading-relaxed font-mono whitespace-pre-wrap">
                  {activeSource.textPreview}
                </div>
              </div>
            </div>

            <button onClick={() => setSourceDrawerOpen(false)} className="btn-primary w-full mt-4">
              Close Viewer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
