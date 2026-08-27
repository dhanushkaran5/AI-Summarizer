import { useNavigate } from 'react-router-dom';
import {
  FileText, Upload, MessageSquare, Shield, GitCompare,
  Sparkles, ArrowRight, CheckCircle, Zap, Brain, Search,
  FileType2, Lock, BarChart3, GraduationCap,
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-lg border-b border-surface-200 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-surface-900">IntelliDoc <span className="gradient-text">AI</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-surface-500">
            <a href="#features" className="hover:text-primary-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-primary-600 transition-colors">How It Works</a>
            <a href="#security" className="hover:text-primary-600 transition-colors">Security</a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="btn-secondary !py-2 !px-5 !text-sm">Login</button>
            <button onClick={() => navigate('/register')} className="btn-primary !py-2 !px-5 !text-sm">Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-40 -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary-200 rounded-full blur-3xl opacity-30 translate-y-1/2 -translate-x-1/4" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto" style={{ animation: 'slide-up 0.7s ease-out' }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-200 text-primary-700 text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              AI-Powered Document Intelligence
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold text-surface-900 leading-tight mb-6">
              Understand Every<br />
              Document With <span className="gradient-text">AI</span>
            </h1>
            
            <p className="text-lg md:text-xl text-surface-500 mb-10 max-w-2xl mx-auto leading-relaxed">
              Upload any document. Get intelligent summaries, ask questions with cited sources,
              verify AI claims, compare multiple files, and generate study material — all grounded in your content.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => navigate('/register')} className="btn-primary text-lg !py-4 !px-8">
                <Upload className="w-5 h-5" /> Upload Document
              </button>
              <button onClick={() => { const el = document.getElementById('features'); el?.scrollIntoView({ behavior: 'smooth' }); }} className="btn-secondary text-lg !py-4 !px-8">
                Explore Features <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Format badges */}
          <div className="flex flex-wrap justify-center gap-3 mt-16" style={{ animation: 'fade-in 1s ease-out 0.3s both' }}>
            {['PDF', 'DOCX', 'PPTX', 'TXT'].map((fmt) => (
              <div key={fmt} className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-xl border border-surface-200 shadow-sm">
                <FileType2 className="w-4 h-4 text-primary-500" />
                <span className="font-semibold text-sm text-surface-700">{fmt}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-surface-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-surface-900 mb-4">Powerful AI Features</h2>
            <p className="text-surface-500 text-lg max-w-2xl mx-auto">
              Every feature is backed by real AI intelligence — no fake buttons, no hardcoded responses.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: FileText, title: 'Adaptive Summarization', desc: 'AI detects document type and generates structured summaries with customizable length and complexity.', color: 'bg-purple-50 text-purple-600' },
              { icon: MessageSquare, title: 'RAG Chatbot', desc: 'Ask questions about your documents. Get grounded answers with source citations using Retrieval-Augmented Generation.', color: 'bg-blue-50 text-blue-600' },
              { icon: Shield, title: 'Evidence Verification', desc: 'Every AI answer is verified against document content. See if claims are supported, partial, or unsupported.', color: 'bg-green-50 text-green-600' },
              { icon: Search, title: 'Source Citations', desc: 'Every answer references specific pages and sections. Click sources to see the original text.', color: 'bg-amber-50 text-amber-600' },
              { icon: GitCompare, title: 'Multi-Doc Comparison', desc: 'Create collections and compare documents. Get structured comparison tables across methodologies and findings.', color: 'bg-rose-50 text-rose-600' },
              { icon: GraduationCap, title: 'AI Study Mode', desc: 'Generate MCQs, flashcards, and study questions at different difficulty levels from any document.', color: 'bg-cyan-50 text-cyan-600' },
            ].map((feature) => (
              <div key={feature.title} className="card hover-lift group">
                <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-surface-900 mb-2">{feature.title}</h3>
                <p className="text-surface-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-surface-900 mb-4">How It Works</h2>
            <p className="text-surface-500 text-lg">From upload to insight in seconds</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', icon: Upload, title: 'Upload', desc: 'Drop your PDF, DOCX, PPTX, or TXT file' },
              { step: '02', icon: Zap, title: 'Process', desc: 'AI extracts, chunks, and embeds your content' },
              { step: '03', icon: Brain, title: 'Analyze', desc: 'Get adaptive summaries and intelligence' },
              { step: '04', icon: MessageSquare, title: 'Interact', desc: 'Chat, verify, compare, and study' },
            ].map((item, i) => (
              <div key={item.step} className="text-center group">
                <div className="relative inline-block mb-6">
                  <div className="w-20 h-20 rounded-2xl gradient-bg-subtle border-2 border-primary-100 flex items-center justify-center transition-all group-hover:border-primary-300 group-hover:shadow-glow">
                    <item.icon className="w-8 h-8 text-primary-600" />
                  </div>
                  <span className="absolute -top-3 -right-3 w-8 h-8 rounded-full gradient-bg text-white text-sm font-bold flex items-center justify-center shadow-md">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-bold text-surface-900 mb-2">{item.title}</h3>
                <p className="text-sm text-surface-500">{item.desc}</p>
                {i < 3 && <div className="hidden md:block mt-6 text-primary-300 text-2xl">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RAG Explanation */}
      <section className="py-24 px-6 bg-surface-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-surface-900 mb-4">Retrieval-Augmented Generation</h2>
            <p className="text-surface-500 text-lg">How we ensure AI answers are grounded in your documents</p>
          </div>

          <div className="card p-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-100 flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="font-bold text-surface-900 mb-2">1. Retrieve</h3>
                <p className="text-sm text-surface-500">Your question is converted to an embedding and matched against document chunks using vector similarity search</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-100 flex items-center justify-center mb-4">
                  <Brain className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="font-bold text-surface-900 mb-2">2. Generate</h3>
                <p className="text-sm text-surface-500">Relevant chunks are fed to the LLM as context, ensuring answers come from your document — not hallucinations</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-100 flex items-center justify-center mb-4">
                  <Shield className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="font-bold text-surface-900 mb-2">3. Verify</h3>
                <p className="text-sm text-surface-500">Every answer is checked against source evidence. You see exactly which claims are supported and which are not</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-surface-900 mb-6">Your Documents, Secured</h2>
              <div className="space-y-4">
                {[
                  'JWT authentication with encrypted tokens',
                  'Passwords hashed with BCrypt',
                  'File validation and size limits',
                  'No documents shared between users',
                  'API keys stored server-side only',
                  'CORS protection enabled',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-surface-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-64 h-64 rounded-3xl gradient-bg-subtle border-2 border-primary-100 flex items-center justify-center" style={{ animation: 'float 6s ease-in-out infinite' }}>
                <Lock className="w-24 h-24 text-primary-400" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="card p-12 bg-gradient-to-br from-primary-600 to-primary-500 border-none">
            <h2 className="text-4xl font-bold text-white mb-4">Ready to Understand Your Documents?</h2>
            <p className="text-primary-100 text-lg mb-8 max-w-xl mx-auto">
              Upload your first document and experience AI-powered document intelligence with source-cited answers.
            </p>
            <button onClick={() => navigate('/register')} className="bg-white text-primary-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-primary-50 transition-all hover:scale-105 inline-flex items-center gap-2 shadow-lg">
              <Upload className="w-5 h-5" /> Upload Document
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-surface-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-surface-900">IntelliDoc AI</span>
          </div>
          <p className="text-sm text-surface-400">
            Evidence-grounded document intelligence powered by RAG, vector search, and LLMs.
          </p>
          <div className="flex items-center gap-4 text-sm text-surface-400">
            <BarChart3 className="w-4 h-4" />
            <span>Built with React, Spring Boot, FastAPI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
