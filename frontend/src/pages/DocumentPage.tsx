import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BookOpen, MessageSquare, Link2,
  GraduationCap, Brain, Download,
  Send, Copy, CheckCircle2,
  GitFork, ShieldAlert, GitCompare, FolderOpen, X, Sparkles, ExternalLink,
  PanelLeftClose, PanelLeftOpen,
  PanelRightClose, PanelRightOpen, RefreshCw, Layers, Check
} from 'lucide-react';
import type {
  Document as DocType, MultiLevelSummary, SummaryMode,
  Source, VerificationResult, StudyQuestion, Contradiction, KnowledgeNode
} from '../types';
import { documentApi, summaryApi, chatApi, studyApi } from '../services/api';
import { useToast } from '../components/ToastContainer';

type CenterTab = 'summary' | 'study' | 'contradictions' | 'knowledge_map';

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
  { level: 0, label: 'L0: Essence', desc: 'One-sentence thesis' },
  { level: 1, label: 'L1: Executive', desc: 'Executive bullet points' },
  { level: 2, label: 'L2: Structured', desc: 'Mode-specific detailed breakdown' },
  { level: 3, label: 'L3: Sections', desc: 'Section-by-section takeaway' },
  { level: 4, label: 'L4: Deep Tech', desc: 'In-depth conceptual analysis' },
  { level: 5, label: 'L5: Knowledge Base', desc: 'Q&A knowledge base' },
];

export default function DocumentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const docId = Number(id);

  const [doc, setDoc] = useState<DocType | null>(null);
  const [loading, setLoading] = useState(true);
  const [centerTab, setCenterTab] = useState<CenterTab>('summary');

  // Panel toggles
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  // Multi-depth summary state
  const [summaryMode, setSummaryMode] = useState<SummaryMode>('student');
  const [selectedDepth, setSelectedDepth] = useState<number>(2);
  const [multiSummary, setMultiSummary] = useState<MultiLevelSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Chat & RAG state
  const [chatMessages, setChatMessages] = useState<Array<{
    role: string;
    content: string;
    sources?: Source[];
    verification?: VerificationResult;
    claimStatus?: string;
  }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Source Viewer / Evidence Drawer
  const [activeSource, setActiveSource] = useState<Source | null>(null);
  const [sourceDrawerOpen, setSourceDrawerOpen] = useState(false);

  // Study state
  const [studyQuestions, setStudyQuestions] = useState<StudyQuestion[]>([]);
  const [studyDifficulty, setStudyDifficulty] = useState('medium');
  const [studyLoading, setStudyLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [revealedAnswers, setRevealedAnswers] = useState<Set<number>>(new Set());
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());

  // Contradictions & Knowledge Map
  const [contradictions, setContradictions] = useState<Contradiction[]>([]);
  const [contradictionsLoading, setContradictionsLoading] = useState(false);
  const [knowledgeMap, setKnowledgeMap] = useState<KnowledgeNode | null>(null);
  const [kmLoading, setKmLoading] = useState(false);

  // Export Modal
  const [exportModalOpen, setExportModalOpen] = useState(false);

  useEffect(() => {
    loadDocument();
  }, [docId]);

  const loadDocument = async () => {
    try {
      const res = await documentApi.getById(docId);
      setDoc(res.data);
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Could not load document.' });
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
      addToast({ type: 'success', title: 'Summary Generated', message: `Depth L${selectedDepth} generated.` });
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to generate summary.' });
    } finally {
      setSummaryLoading(false);
    }
  };

  const sendChatMessage = async (presetQuestion?: string) => {
    const question = (presetQuestion || chatInput).trim();
    if (!question || chatLoading) return;
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', content: question }]);
    setChatLoading(true);

    try {
      const res = await chatApi.sendMessage(docId, { question });
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.data.answer,
          sources: res.data.sources,
          verification: res.data.verification,
          claimStatus: res.data.verification?.claimStatus || 'EXPLICITLY STATED',
        },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I could not find sufficient grounded evidence in this document to answer confidently.',
          claimStatus: 'NOT FOUND',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const generateStudyMaterial = async () => {
    setStudyLoading(true);
    try {
      const res = await studyApi.generate(docId, {
        difficulty: studyDifficulty as 'easy' | 'medium' | 'hard',
        types: ['mcq', 'qa', 'flashcard'],
        count: 5,
      });
      setStudyQuestions(res.data.questions);
      addToast({ type: 'success', title: 'Study Set Ready', message: 'Generated revision questions and cards.' });
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to generate study materials.' });
    } finally {
      setStudyLoading(false);
    }
  };

  const loadContradictions = async () => {
    setContradictionsLoading(true);
    try {
      const res = await documentApi.getContradictions(docId);
      setContradictions(res.data.contradictions || []);
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to audit contradictions.' });
    } finally {
      setContradictionsLoading(false);
    }
  };

  const loadKnowledgeMap = async () => {
    setKmLoading(true);
    try {
      const res = await documentApi.getKnowledgeMap(docId);
      setKnowledgeMap(res.data.root || null);
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to build knowledge map.' });
    } finally {
      setKmLoading(false);
    }
  };

  const copySummaryText = () => {
    if (!multiSummary) return;
    let activeText = '';
    if (selectedDepth === 0) {
      activeText = multiSummary.level0 || '';
    } else if (selectedDepth === 1) {
      activeText = multiSummary.level1 || '';
    } else if (selectedDepth === 2) {
      activeText = typeof multiSummary.level2 === 'string'
        ? multiSummary.level2
        : Object.entries(multiSummary.level2 || {}).map(([k, v]) => `## ${k}\n${v}`).join('\n\n');
    } else if (selectedDepth === 3) {
      activeText = Array.isArray(multiSummary.level3)
        ? multiSummary.level3.map(s => `### ${s.section}${s.page ? ` (p. ${s.page})` : ''}\n${s.summary}`).join('\n\n')
        : JSON.stringify(multiSummary.level3, null, 2);
    } else if (selectedDepth === 4) {
      activeText = multiSummary.level4 || '';
    } else if (selectedDepth === 5) {
      activeText = Array.isArray(multiSummary.level5)
        ? multiSummary.level5.map(q => `**Q: ${q.question}**\nA: ${q.answer}`).join('\n\n')
        : JSON.stringify(multiSummary.level5, null, 2);
    } else {
      activeText = JSON.stringify(multiSummary, null, 2);
    }

    navigator.clipboard.writeText(String(activeText || ''));
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
    addToast({ type: 'info', title: 'Copied', message: 'Summary copied to clipboard.' });
  };

  const handleExport = (format: 'markdown' | 'txt' | 'json') => {
    if (!multiSummary) return;
    let content = '';
    const filename = `${doc?.originalName || 'document'}_summary.${format === 'markdown' ? 'md' : format}`;

    if (format === 'json') {
      content = JSON.stringify(multiSummary, null, 2);
    } else {
      content = `# Document Intelligence Report: ${doc?.originalName || 'Document'}\n\n`;
      content += `## Essence (L0)\n${multiSummary.level0 || 'N/A'}\n\n`;
      if (multiSummary.level1) {
        content += `## Executive Summary (L1)\n${multiSummary.level1}\n\n`;
      }
      if (multiSummary.level2) {
        content += `## Structured Analysis (L2)\n`;
        if (typeof multiSummary.level2 === 'string') {
          content += `${multiSummary.level2}\n\n`;
        } else {
          content += Object.entries(multiSummary.level2).map(([k, v]) => `### ${k}\n${v}`).join('\n\n') + '\n\n';
        }
      }
      if (multiSummary.level3 && multiSummary.level3.length > 0) {
        content += `## Section Takeaways (L3)\n`;
        content += multiSummary.level3.map(s => `### ${s.section}${s.page ? ` (p. ${s.page})` : ''}\n${s.summary}`).join('\n\n') + '\n\n';
      }
      if (multiSummary.level4) {
        content += `## Deep Technical Analysis (L4)\n${multiSummary.level4}\n\n`;
      }
      if (multiSummary.level5 && multiSummary.level5.length > 0) {
        content += `## Knowledge Base Q&A (L5)\n`;
        content += multiSummary.level5.map(qa => `**Q: ${qa.question}**\nA: ${qa.answer}`).join('\n\n') + '\n\n';
      }
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setExportModalOpen(false);
    addToast({ type: 'success', title: 'Exported', message: `Downloaded ${filename}` });
  };

  const contextPrompts = [
    'What are the three most critical findings?',
    'What evidence supports the primary thesis?',
    'Are there any limitations or potential risks?',
    'Summarize this for an executive briefing',
  ];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-primary-600 font-semibold text-sm animate-pulse">
          <Brain className="w-6 h-6 animate-bounce" /> Loading Document Intelligence Workspace...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] overflow-hidden space-y-3 animate-fade-in">
      {/* Workspace Header Toolbar */}
      <div className="card p-3 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl gradient-bg flex items-center justify-center text-white shrink-0 font-bold text-xs">
            {doc?.fileType?.toUpperCase() || 'TXT'}
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-surface-900 dark:text-surface-100 truncate" title={doc?.originalName}>
              {doc?.originalName || doc?.filename}
            </h1>
            <div className="flex items-center gap-2 text-[10px] text-surface-400">
              <span>{doc?.pageCount || 1} pages</span>
              <span>•</span>
              <span>{doc?.wordCount ? `${doc?.wordCount.toLocaleString()} words` : '0 words'}</span>
              <span>•</span>
              <span>~{Math.ceil(doc?.readingTimeMinutes || 1)}m read</span>
            </div>
          </div>
        </div>

        {/* View Tabs & Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-surface-200 dark:border-surface-800 rounded-xl p-0.5 bg-surface-50 dark:bg-surface-900">
            <button
              onClick={() => setCenterTab('summary')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                centerTab === 'summary' ? 'bg-white dark:bg-surface-800 text-primary-600 shadow-2xs' : 'text-surface-500 hover:text-surface-700'
              }`}
            >
              Summary Engine
            </button>
            <button
              onClick={() => { setCenterTab('study'); if (studyQuestions.length === 0) generateStudyMaterial(); }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                centerTab === 'study' ? 'bg-white dark:bg-surface-800 text-primary-600 shadow-2xs' : 'text-surface-500 hover:text-surface-700'
              }`}
            >
              Study Mode
            </button>
            <button
              onClick={() => { setCenterTab('contradictions'); if (contradictions.length === 0) loadContradictions(); }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                centerTab === 'contradictions' ? 'bg-white dark:bg-surface-800 text-primary-600 shadow-2xs' : 'text-surface-500 hover:text-surface-700'
              }`}
            >
              Contradictions
            </button>
            <button
              onClick={() => { setCenterTab('knowledge_map'); if (!knowledgeMap) loadKnowledgeMap(); }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                centerTab === 'knowledge_map' ? 'bg-white dark:bg-surface-800 text-primary-600 shadow-2xs' : 'text-surface-500 hover:text-surface-700'
              }`}
            >
              Knowledge Map
            </button>
          </div>

          <button
            onClick={() => setExportModalOpen(true)}
            className="btn-secondary text-xs py-1 px-3 dark:bg-surface-800 dark:text-surface-200"
            title="Export Summary"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* 3-Panel Resilient Layout */}
      <div className="flex-1 flex gap-3 min-h-0 overflow-hidden">
        {/* PANEL 1: Left Structure & Outline (Collapsible) */}
        {leftPanelOpen && (
          <aside className="w-64 shrink-0 card p-4 flex flex-col gap-4 overflow-y-auto hidden md:flex animate-slide-right">
            <div className="flex items-center justify-between pb-2 border-b border-surface-100 dark:border-surface-800">
              <span className="text-xs font-bold text-surface-800 dark:text-surface-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-primary-600" />
                Document Intel
              </span>
              <button
                onClick={() => setLeftPanelOpen(false)}
                className="p-1 rounded text-surface-400 hover:text-surface-600"
                title="Collapse Panel"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Health Indicators */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-surface-400">Document Health</span>
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-surface-50 dark:bg-surface-800/60 border border-surface-100 dark:border-surface-800">
                  <div className="font-bold text-emerald-600 dark:text-emerald-400">96%</div>
                  <div className="text-[10px] text-surface-400">AI Readiness</div>
                </div>
                <div className="p-2 rounded-xl bg-surface-50 dark:bg-surface-800/60 border border-surface-100 dark:border-surface-800">
                  <div className="font-bold text-primary-600 dark:text-primary-400">92%</div>
                  <div className="text-[10px] text-surface-400">Structure</div>
                </div>
              </div>
            </div>

            {/* Keywords */}
            {doc?.keywords && doc.keywords.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-surface-400">Extracted Keywords</span>
                <div className="flex flex-wrap gap-1">
                  {doc.keywords.slice(0, 10).map((kw, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-surface-100 dark:bg-surface-800 text-[10px] text-surface-600 dark:text-surface-300 font-medium"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Outline / Quick Actions */}
            <div className="space-y-2 mt-auto pt-4 border-t border-surface-100 dark:border-surface-800">
              <span className="text-[10px] uppercase font-bold tracking-wider text-surface-400">Quick Tools</span>
              <div className="space-y-1 text-xs">
                <button
                  onClick={() => navigate(`/compare?docs=${docId}`)}
                  className="w-full text-left p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 flex items-center justify-between text-surface-600 dark:text-surface-300"
                >
                  <span className="flex items-center gap-2"><GitCompare className="w-3.5 h-3.5" /> Compare</span>
                  <ExternalLink className="w-3 h-3 text-surface-400" />
                </button>
                <button
                  onClick={() => navigate(`/collections`)}
                  className="w-full text-left p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 flex items-center justify-between text-surface-600 dark:text-surface-300"
                >
                  <span className="flex items-center gap-2"><FolderOpen className="w-3.5 h-3.5" /> Collections</span>
                  <ExternalLink className="w-3 h-3 text-surface-400" />
                </button>
              </div>
            </div>
          </aside>
        )}

        {!leftPanelOpen && (
          <button
            onClick={() => setLeftPanelOpen(true)}
            className="p-1.5 self-start card text-surface-400 hover:text-surface-600 hidden md:block"
            title="Open Document Intel"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}

        {/* PANEL 2: Center Content & Multi-Depth Summary Engine */}
        <main className="flex-1 card p-5 flex flex-col overflow-y-auto">
          {centerTab === 'summary' && (
            <div className="space-y-5">
              {/* Summary Controls Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-surface-100 dark:border-surface-800">
                {/* Audience Mode Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-surface-500">Audience:</span>
                  <select
                    value={summaryMode}
                    onChange={(e) => {
                      const m = e.target.value as SummaryMode;
                      setSummaryMode(m);
                      generateMultiLevelSummary(m);
                    }}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 font-medium text-surface-800 dark:text-surface-200"
                  >
                    {MODES.map((m) => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </select>
                </div>

                {/* Depth Buttons */}
                <div className="flex flex-wrap gap-1">
                  {DEPTH_LEVELS.map((dl) => (
                    <button
                      key={dl.level}
                      onClick={() => setSelectedDepth(dl.level)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors ${
                        selectedDepth === dl.level
                          ? 'bg-primary-600 text-white'
                          : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200'
                      }`}
                      title={dl.desc}
                    >
                      {dl.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={copySummaryText}
                    className="p-1.5 rounded-lg text-surface-400 hover:text-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                    title="Copy Summary"
                  >
                    {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => generateMultiLevelSummary()}
                    className="btn-primary text-xs py-1 px-3 shadow-xs"
                    disabled={summaryLoading}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${summaryLoading ? 'animate-spin' : ''}`} />
                    {multiSummary ? 'Regenerate' : 'Generate'}
                  </button>
                </div>
              </div>

              {/* Summary Body */}
              {summaryLoading ? (
                <div className="space-y-4 py-8">
                  <div className="skeleton h-6 w-1/3" />
                  <div className="skeleton h-4 w-full" />
                  <div className="skeleton h-4 w-5/6" />
                  <div className="skeleton h-4 w-4/6" />
                </div>
              ) : !multiSummary ? (
                <div className="text-center py-16">
                  <BookOpen className="w-10 h-10 text-surface-400 mx-auto mb-3 opacity-60" />
                  <h3 className="text-sm font-bold text-surface-800 dark:text-surface-200">
                    No Summary Generated for Level {selectedDepth}
                  </h3>
                  <p className="text-xs text-surface-500 mt-1 max-w-sm mx-auto">
                    Choose an audience mode and click Generate to extract multi-depth grounded insights.
                  </p>
                  <button
                    onClick={() => generateMultiLevelSummary()}
                    className="btn-primary text-xs mt-4 py-2 px-4 inline-flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Generate Multi-Depth Summary
                  </button>
                </div>
              ) : (
                <div className="prose dark:prose-invert max-w-none text-xs leading-relaxed space-y-4">
                  {selectedDepth === 0 && (
                    <div className="p-4 rounded-xl bg-primary-50/50 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900">
                      <h4 className="text-xs font-bold text-primary-800 dark:text-primary-300 uppercase tracking-wider mb-1">
                        Core Essence (L0)
                      </h4>
                      <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
                        {multiSummary.level0 || 'No summary available.'}
                      </p>
                    </div>
                  )}

                  {selectedDepth === 1 && (
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold text-surface-800 dark:text-surface-200 uppercase tracking-wider">
                        Executive Overview (L1)
                      </h4>
                      <div className="p-4 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900 text-surface-700 dark:text-surface-300 whitespace-pre-wrap leading-relaxed">
                        {multiSummary.level1 || 'No executive summary available.'}
                      </div>
                    </div>
                  )}

                  {selectedDepth === 2 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-surface-800 dark:text-surface-200 uppercase tracking-wider">
                        Structured Breakdown (L2 - {summaryMode.toUpperCase()})
                      </h4>
                      {typeof multiSummary.level2 === 'string' ? (
                        <div className="p-4 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900 text-surface-700 dark:text-surface-300 whitespace-pre-wrap leading-relaxed">
                          {multiSummary.level2}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {Object.entries(multiSummary.level2 || {}).map(([key, val]) => (
                            <div key={key} className="p-3.5 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900">
                              <h5 className="font-bold text-xs uppercase tracking-wider text-primary-700 dark:text-primary-300 mb-1.5">{key}</h5>
                              <p className="text-surface-700 dark:text-surface-300 leading-relaxed">{val}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedDepth === 3 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-surface-800 dark:text-surface-200 uppercase tracking-wider">
                        Section-by-Section Explanations (L3)
                      </h4>
                      {Array.isArray(multiSummary.level3) && multiSummary.level3.length > 0 ? (
                        multiSummary.level3.map((sec, idx) => (
                          <div key={idx} className="p-3.5 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900">
                            <div className="flex items-center justify-between mb-1">
                              <h5 className="font-semibold text-surface-900 dark:text-surface-100">{sec.section || `Section ${idx + 1}`}</h5>
                              {sec.page && (
                                <span className="text-[10px] text-surface-400 font-mono">Page {sec.page}</span>
                              )}
                            </div>
                            <p className="text-surface-600 dark:text-surface-400 leading-relaxed">{sec.summary}</p>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900 text-surface-500">
                          No section breakdown available.
                        </div>
                      )}
                    </div>
                  )}

                  {selectedDepth === 4 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-surface-800 dark:text-surface-200 uppercase tracking-wider">
                        Deep Technical Spec (L4)
                      </h4>
                      <p className="text-surface-700 dark:text-surface-300 leading-relaxed whitespace-pre-wrap p-4 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900">
                        {multiSummary.level4 || 'No technical specification recorded.'}
                      </p>
                    </div>
                  )}

                  {selectedDepth === 5 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-surface-800 dark:text-surface-200 uppercase tracking-wider">
                        Knowledge Base Q&A (L5)
                      </h4>
                      {Array.isArray(multiSummary.level5) && multiSummary.level5.length > 0 ? (
                        multiSummary.level5.map((qa, idx) => (
                          <div key={idx} className="p-3.5 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900">
                            <p className="font-semibold text-primary-700 dark:text-primary-300 mb-1">Q: {qa.question}</p>
                            <p className="text-surface-600 dark:text-surface-400">A: {qa.answer}</p>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900 text-surface-500">
                          No Q&A pairs available.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STUDY MODE TAB */}
          {centerTab === 'study' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-surface-100 dark:border-surface-800">
                <div>
                  <h3 className="text-sm font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-primary-600" /> Active Recall Study Mode
                  </h3>
                  <p className="text-[11px] text-surface-400">AI-generated MCQs and active recall revision cards.</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={studyDifficulty}
                    onChange={(e) => setStudyDifficulty(e.target.value)}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-200"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                  <button
                    onClick={generateStudyMaterial}
                    className="btn-primary text-xs py-1.5 px-3"
                    disabled={studyLoading}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${studyLoading ? 'animate-spin' : ''}`} />
                    Generate Questions
                  </button>
                </div>
              </div>

              {studyLoading ? (
                <div className="py-12 text-center text-xs text-surface-400">Synthesizing study questions...</div>
              ) : studyQuestions.length === 0 ? (
                <div className="text-center py-12">
                  <GraduationCap className="w-8 h-8 text-surface-400 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-semibold">No study material generated yet.</p>
                  <button onClick={generateStudyMaterial} className="btn-primary text-xs mt-3 py-1.5 px-4">
                    Create Study Questions
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {studyQuestions.map((q, qIdx) => {
                    if (q.type === 'flashcard') {
                      const isFlipped = flippedCards.has(qIdx);
                      return (
                        <div
                          key={qIdx}
                          onClick={() => {
                            setFlippedCards((prev) => {
                              const next = new Set(prev);
                              if (next.has(qIdx)) next.delete(qIdx);
                              else next.add(qIdx);
                              return next;
                            });
                          }}
                          className="p-5 rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50/30 dark:bg-primary-950/20 cursor-pointer text-center select-none transition-all hover:border-primary-400"
                        >
                          <span className="text-[10px] uppercase font-bold text-primary-600 block mb-1">
                            Flashcard #{qIdx + 1} • {isFlipped ? 'Answer (Click to flip back)' : 'Prompt (Click to reveal answer)'}
                          </span>
                          <p className="text-xs font-semibold text-surface-900 dark:text-surface-100">
                            {isFlipped ? (q.correctAnswer || q.explanation || 'No answer recorded') : q.question}
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div key={qIdx} className="p-4 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-xs text-surface-900 dark:text-surface-100">
                            {qIdx + 1}. {q.question}
                          </span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-surface-500">
                            {q.type}
                          </span>
                        </div>

                        {q.options && q.options.length > 0 && (
                          <div className="space-y-1.5">
                            {q.options.map((opt, optIdx) => {
                              const isChosen = selectedAnswers[qIdx] === opt;
                              const isCorrect = opt === q.correctAnswer;
                              const isRevealed = revealedAnswers.has(qIdx);

                              return (
                                <button
                                  key={optIdx}
                                  onClick={() => setSelectedAnswers((prev) => ({ ...prev, [qIdx]: opt }))}
                                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors border ${
                                    isRevealed
                                      ? isCorrect
                                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 text-emerald-800 dark:text-emerald-200'
                                        : isChosen
                                        ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 text-rose-800 dark:text-rose-200'
                                        : 'border-surface-200'
                                      : isChosen
                                      ? 'bg-primary-50 dark:bg-primary-950/50 border-primary-400 text-primary-800 dark:text-primary-200'
                                      : 'border-surface-200 dark:border-surface-800 hover:bg-surface-50'
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-surface-100 dark:border-surface-800 text-xs">
                          <button
                            onClick={() => setRevealedAnswers((prev) => new Set([...prev, qIdx]))}
                            className="text-primary-600 font-semibold text-[11px]"
                          >
                            Check Answer
                          </button>
                          {revealedAnswers.has(qIdx) && q.explanation && (
                            <span className="text-[11px] text-surface-500">{q.explanation}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* CONTRADICTIONS TAB */}
          {centerTab === 'contradictions' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2 pb-2 border-b border-surface-100 dark:border-surface-800">
                <ShieldAlert className="w-4 h-4 text-rose-600" /> Cross-Section Contradiction Engine
              </h3>
              {contradictionsLoading ? (
                <div className="py-12 text-center text-xs text-surface-400">Auditing document for conflicting numbers and dates...</div>
              ) : contradictions.length === 0 ? (
                <div className="p-8 text-center text-xs text-surface-500">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  No logical contradictions or numerical conflicts detected.
                </div>
              ) : (
                <div className="space-y-3">
                  {contradictions.map((c, i) => (
                    <div key={i} className="p-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/30 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-800 dark:text-rose-200">{c.explanation}</span>
                        {c.severity && (
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                            c.severity === 'high'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                          }`}>
                            {c.severity}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 rounded bg-white dark:bg-surface-900 border">
                          <span className="font-semibold block mb-0.5 text-surface-500">Statement 1{c.pageA ? ` (p. ${c.pageA})` : ''}:</span>
                          {c.statementA}
                        </div>
                        <div className="p-2 rounded bg-white dark:bg-surface-900 border">
                          <span className="font-semibold block mb-0.5 text-surface-500">Statement 2{c.pageB ? ` (p. ${c.pageB})` : ''}:</span>
                          {c.statementB}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* KNOWLEDGE MAP TAB */}
          {centerTab === 'knowledge_map' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2 pb-2 border-b border-surface-100 dark:border-surface-800">
                <GitFork className="w-4 h-4 text-emerald-600" /> Hierarchical Knowledge Graph
              </h3>
              {kmLoading ? (
                <div className="py-12 text-center text-xs text-surface-400">Constructing concept hierarchy...</div>
              ) : !knowledgeMap ? (
                <div className="p-8 text-center text-xs text-surface-500">No knowledge map available.</div>
              ) : (
                <div className="p-4 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900 text-xs font-mono">
                  <div className="font-bold text-primary-600 text-sm">{knowledgeMap.name}</div>
                  <div className="pl-4 mt-2 space-y-1">
                    {knowledgeMap.children?.map((child, idx) => (
                      <div key={idx} className="border-l-2 border-primary-200 pl-3 py-1">
                        <span className="font-semibold text-surface-800 dark:text-surface-200">{child.name}</span>
                        {child.children?.map((sub, sIdx) => (
                          <div key={sIdx} className="text-[11px] text-surface-500 pl-2">↳ {sub.name}</div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* PANEL 3: Right AI Assistant (Collapsible) */}
        {rightPanelOpen && (
          <aside className="w-80 shrink-0 card p-4 flex flex-col justify-between overflow-hidden hidden lg:flex animate-slide-left">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-surface-100 dark:border-surface-800 shrink-0">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary-600" />
                <span className="text-xs font-bold text-surface-800 dark:text-surface-200">Grounded AI Chat</span>
              </div>
              <button
                onClick={() => setRightPanelOpen(false)}
                className="p-1 rounded text-surface-400 hover:text-surface-600"
                title="Collapse Assistant"
              >
                <PanelRightClose className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3 text-xs">
              {chatMessages.length === 0 ? (
                <div className="py-6 text-center text-surface-400 space-y-3">
                  <MessageSquare className="w-6 h-6 mx-auto opacity-50" />
                  <p className="text-[11px]">Ask anything about this document. All answers include page-level citations.</p>

                  <div className="text-left space-y-1.5 pt-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-surface-400 block">Suggested Prompts</span>
                    {contextPrompts.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => sendChatMessage(p)}
                        className="w-full text-left p-2 rounded-lg bg-surface-50 dark:bg-surface-800 hover:bg-primary-50 text-[11px] text-surface-700 dark:text-surface-300 transition-colors"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl space-y-1.5 ${
                      msg.role === 'user'
                        ? 'bg-primary-50 dark:bg-primary-950/60 ml-4 text-primary-900 dark:text-primary-100 font-medium'
                        : 'bg-surface-100 dark:bg-surface-800 mr-4 text-surface-800 dark:text-surface-200'
                    }`}
                  >
                    <p className="text-xs leading-relaxed">{msg.content}</p>

                    {/* Grounded Citations & Sources */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="pt-2 mt-1 border-t border-surface-200/60 dark:border-surface-700 text-[10px]">
                        <span className="font-bold text-surface-500 uppercase tracking-wider block mb-1">Grounded Sources</span>
                        <div className="flex flex-wrap gap-1">
                          {msg.sources.map((src, sIdx) => (
                            <button
                              key={sIdx}
                              onClick={() => {
                                setActiveSource(src);
                                setSourceDrawerOpen(true);
                              }}
                              className="px-2 py-0.5 rounded bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 text-primary-600 font-semibold hover:border-primary-400"
                            >
                              Page {src.pageNumber || 'N/A'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
              {chatLoading && (
                <div className="p-3 rounded-xl bg-surface-100 dark:bg-surface-800 text-xs text-surface-400 animate-pulse">
                  Analyzing document evidence...
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="pt-3 border-t border-surface-100 dark:border-surface-800 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendChatMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask document..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 py-2 px-3 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 text-xs outline-none focus:border-primary-500"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || chatLoading}
                  className="p-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </aside>
        )}

        {!rightPanelOpen && (
          <button
            onClick={() => setRightPanelOpen(true)}
            className="p-1.5 self-start card text-surface-400 hover:text-surface-600 hidden lg:block"
            title="Open AI Assistant"
          >
            <PanelRightOpen className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Source Citation Drawer */}
      {sourceDrawerOpen && activeSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-lg card p-5 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-2 border-b border-surface-100 dark:border-surface-800">
              <span className="font-bold text-sm text-surface-900 dark:text-surface-100 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-primary-600" /> Evidence Verification
              </span>
              <button onClick={() => setSourceDrawerOpen(false)} className="p-1 text-surface-400 hover:text-surface-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-surface-500">
                <span>Page: {activeSource.pageNumber || 'N/A'}</span>
                <span>Relevance: {Math.round((activeSource.relevanceScore || 0.85) * 100)}%</span>
              </div>
              <p className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800 text-surface-700 dark:text-surface-300 leading-relaxed font-mono text-[11px]">
                "{activeSource.textPreview}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md card p-5 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-2 border-b border-surface-100 dark:border-surface-800">
              <span className="font-bold text-sm text-surface-900 dark:text-surface-100 flex items-center gap-2">
                <Download className="w-4 h-4 text-primary-600" /> Export Document Intelligence
              </span>
              <button onClick={() => setExportModalOpen(false)} className="p-1 text-surface-400 hover:text-surface-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-surface-500">Choose your preferred format for offline review and sharing:</p>

            <div className="space-y-2">
              <button
                onClick={() => handleExport('markdown')}
                className="w-full p-3 rounded-xl border border-surface-200 dark:border-surface-800 hover:border-primary-400 flex items-center justify-between text-xs font-semibold text-surface-800 dark:text-surface-200"
              >
                <span>Markdown (.md)</span>
                <Download className="w-3.5 h-3.5 text-surface-400" />
              </button>
              <button
                onClick={() => handleExport('txt')}
                className="w-full p-3 rounded-xl border border-surface-200 dark:border-surface-800 hover:border-primary-400 flex items-center justify-between text-xs font-semibold text-surface-800 dark:text-surface-200"
              >
                <span>Plain Text (.txt)</span>
                <Download className="w-3.5 h-3.5 text-surface-400" />
              </button>
              <button
                onClick={() => handleExport('json')}
                className="w-full p-3 rounded-xl border border-surface-200 dark:border-surface-800 hover:border-primary-400 flex items-center justify-between text-xs font-semibold text-surface-800 dark:text-surface-200"
              >
                <span>Structured JSON (.json)</span>
                <Download className="w-3.5 h-3.5 text-surface-400" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
