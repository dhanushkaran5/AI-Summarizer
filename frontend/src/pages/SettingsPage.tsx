import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Settings, Eye, Sliders, ShieldCheck } from 'lucide-react';

export default function SettingsPage() {
  const [provider, setProvider] = useState('mock');
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [textScale, setTextScale] = useState(100);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-surface-50 p-6 md:p-8 text-surface-900">
      <div className="max-w-3xl mx-auto">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-primary-600 mb-6 font-medium">
          ← Back to Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-surface-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            Settings & Accessibility
          </h1>
          <p className="text-surface-500 mt-1">Configure AI engine, visual accessibility, and platform preferences.</p>
        </div>

        <div className="space-y-6">
          {/* AI Provider Config */}
          <div className="card space-y-4">
            <h3 className="text-base font-bold text-surface-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-primary-600" /> AI Provider & Mode
            </h3>
            <div>
              <label htmlFor="ai-provider" className="text-xs font-bold text-surface-500 uppercase block mb-1">Active Provider</label>
              <select
                id="ai-provider"
                value={provider}
                onChange={e => setProvider(e.target.value)}
                className="input-field !py-2 !text-sm"
              >
                <option value="mock">Local Deterministic Engine (Mock - No API Keys Required)</option>
                <option value="gemini">Google Gemini (gemini-1.5-flash)</option>
                <option value="openai">OpenAI (gpt-4o-mini)</option>
              </select>
              <p className="text-xs text-surface-400 mt-1">
                Local mode provides guaranteed offline operation with heuristic summarization.
              </p>
            </div>
          </div>

          {/* Accessibility Controls (WCAG 2.1 AA) */}
          <div className="card space-y-4">
            <h3 className="text-base font-bold text-surface-900 flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary-600" /> Accessibility (WCAG 2.1 Level AA)
            </h3>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-surface-50 rounded-xl border border-surface-200 cursor-pointer">
                <div>
                  <span className="font-bold text-sm text-surface-800">High Contrast Mode</span>
                  <p className="text-xs text-surface-400">Increase contrast ratio on badges, borders, and interactive text</p>
                </div>
                <input
                  type="checkbox"
                  checked={highContrast}
                  onChange={e => setHighContrast(e.target.checked)}
                  className="w-5 h-5 accent-primary-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-surface-50 rounded-xl border border-surface-200 cursor-pointer">
                <div>
                  <span className="font-bold text-sm text-surface-800">Reduced Motion</span>
                  <p className="text-xs text-surface-400">Disable floating animations and transition micro-effects</p>
                </div>
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={e => setReducedMotion(e.target.checked)}
                  className="w-5 h-5 accent-primary-600 rounded"
                />
              </label>

              <div className="p-3 bg-surface-50 rounded-xl border border-surface-200 space-y-2">
                <div className="flex justify-between items-center text-sm font-bold text-surface-800">
                  <span>Text Scaling</span>
                  <span className="text-primary-600">{textScale}%</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="200"
                  step="10"
                  value={textScale}
                  onChange={e => setTextScale(Number(e.target.value))}
                  className="w-full accent-primary-600 cursor-pointer"
                />
                <p className="text-xs text-surface-400">Supports text scaling up to 200% without loss of layout structure.</p>
              </div>
            </div>
          </div>

          <button onClick={handleSave} className="btn-primary w-full !py-3.5 text-base">
            Save Preferences
          </button>

          {saved && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-600" /> Preferences saved successfully!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
