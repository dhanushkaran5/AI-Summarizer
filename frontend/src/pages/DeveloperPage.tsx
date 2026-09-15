import { useState, useEffect } from 'react';
import {
  Code2, Key, Copy, Check, Trash2, Plus, Play,
  Terminal, Shield, Zap, RefreshCw, AlertTriangle, Activity
} from 'lucide-react';
import { developerApi, summaryV2Api } from '../services/api';
import type { ApiKeyItem, ApiKeyCreatedResponse, ApiUsageLogItem } from '../types';

export default function DeveloperPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyRateLimit, setNewKeyRateLimit] = useState(60);
  const [creating, setCreating] = useState(false);
  const [createdSecret, setCreatedSecret] = useState<ApiKeyCreatedResponse | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Key usage logs
  const [selectedKeyId, setSelectedKeyId] = useState<number | null>(null);
  const [usageLogs, setUsageLogs] = useState<ApiUsageLogItem[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Interactive Tester
  const [testApiKey, setTestApiKey] = useState('');
  const [testText, setTestText] = useState(
    'Artificial Intelligence and modern transformer architectures have accelerated content synthesis across enterprise workflows. By combining extractive sentence ranking with semantic neural summarization, teams achieve high compression ratios while preserving source traceability and verifiable claims.'
  );
  const [testMode, setTestMode] = useState('HYBRID');
  const [testLength, setTestLength] = useState('STANDARD');
  const [testPersona, setTestPersona] = useState('Executive');
  const [testRunning, setTestRunning] = useState(false);
  const [testResponse, setTestResponse] = useState<any>(null);
  const [testLatency, setTestLatency] = useState<number | null>(null);
  const [activeSnippetTab, setActiveSnippetTab] = useState<'curl' | 'python' | 'ts'>('curl');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    try {
      setLoading(true);
      const res = await developerApi.getKeys();
      setKeys(res.data);
      if (res.data.length > 0 && !testApiKey) {
        setTestApiKey(res.data[0].keyPrefix + '...');
      }
    } catch (err) {
      console.error('Failed to load API keys:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    try {
      setCreating(true);
      const res = await developerApi.createKey({
        name: newKeyName.trim(),
        rateLimit: newKeyRateLimit,
      });
      setCreatedSecret(res.data);
      setTestApiKey(res.data.apiKey);
      setNewKeyName('');
      loadKeys();
    } catch (err) {
      console.error('Failed to create key:', err);
      alert('Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeKey = async (id: number) => {
    if (!confirm('Are you sure you want to revoke this API key? This cannot be undone.')) return;
    try {
      await developerApi.revokeKey(id);
      loadKeys();
    } catch (err) {
      console.error('Failed to revoke key:', err);
      alert('Failed to revoke key');
    }
  };

  const handleViewUsage = async (id: number) => {
    setSelectedKeyId(id);
    try {
      setLoadingLogs(true);
      const res = await developerApi.getUsage(id);
      setUsageLogs(res.data);
    } catch (err) {
      console.error('Failed to load usage logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleRunTest = async () => {
    try {
      setTestRunning(true);
      setTestResponse(null);
      const start = Date.now();
      const res = await summaryV2Api.generate(
        {
          title: 'Interactive Test Run',
          text: testText,
          mode: testMode,
          length: testLength,
          persona: testPersona,
        },
        testApiKey.startsWith('sk-') ? testApiKey : undefined
      );
      setTestLatency(Date.now() - start);
      setTestResponse(res.data);
    } catch (err: any) {
      setTestLatency(null);
      setTestResponse({
        error: err.response?.data?.message || err.message || 'Request failed',
        status: err.response?.status || 500,
      });
    } finally {
      setTestRunning(false);
    }
  };

  const getCurlSnippet = () => {
    const key = createdSecret?.apiKey || 'YOUR_API_KEY';
    return `curl -X POST "http://localhost:8080/api/v1/summaries" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${key}" \\
  -d '{
    "title": "API Summary Request",
    "text": "${testText.slice(0, 90)}...",
    "mode": "${testMode}",
    "length": "${testLength}",
    "persona": "${testPersona}"
  }'`;
  };

  const getPythonSnippet = () => {
    const key = createdSecret?.apiKey || 'YOUR_API_KEY';
    return `import requests

url = "http://localhost:8080/api/v1/summaries"
headers = {
    "Content-Type": "application/json",
    "X-API-Key": "${key}"
}
payload = {
    "title": "API Summary Request",
    "text": "${testText.slice(0, 90)}...",
    "mode": "${testMode}",
    "length": "${testLength}",
    "persona": "${testPersona}"
}

response = requests.post(url, json=payload, headers=headers)
data = response.json()
print("Summary:", data.get("summaryText"))
print("Confidence:", data.get("confidenceScore"))`;
  };

  const getTsSnippet = () => {
    const key = createdSecret?.apiKey || 'YOUR_API_KEY';
    return `const response = await fetch("http://localhost:8080/api/v1/summaries", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "${key}",
  },
  body: JSON.stringify({
    title: "API Summary Request",
    text: "${testText.slice(0, 90)}...",
    mode: "${testMode}",
    length: "${testLength}",
    persona: "${testPersona}",
  }),
});

const data = await response.json();
console.log("Summary:", data.summaryText);
console.log("Confidence:", data.confidenceScore);`;
  };

  const currentSnippet = activeSnippetTab === 'curl'
    ? getCurlSnippet()
    : activeSnippetTab === 'python'
    ? getPythonSnippet()
    : getTsSnippet();

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(currentSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-200/80 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center text-white shadow-xs">
              <Code2 className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
              Developer Hub & API
            </h1>
          </div>
          <p className="text-surface-500 text-sm">
            Programmatic access to Summarize AI's hybrid summarization engine, source traceability, and evaluation metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200">
            <Zap className="w-3.5 h-3.5 text-primary-600" /> API v1 REST
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Shield className="w-3.5 h-3.5 text-emerald-600" /> Rate Limited
          </span>
        </div>
      </div>

      {/* Secret Reveal Modal */}
      {createdSecret && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 shadow-sm animate-scale-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <h3 className="text-sm font-bold text-amber-900">
                New API Key Generated: {createdSecret.name}
              </h3>
              <p className="text-xs text-amber-700">
                Please copy your secret key now. For security purposes, you will not be able to view this full key again.
              </p>
              <div className="flex items-center gap-2 max-w-xl">
                <code className="px-3 py-2 bg-white rounded-xl border border-amber-300 font-mono text-xs text-amber-950 font-bold flex-1 break-all select-all">
                  {createdSecret.apiKey}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(createdSecret.apiKey);
                    setCopiedKey(true);
                    setTimeout(() => setCopiedKey(false), 2500);
                  }}
                  className="btn-primary !py-2 !px-4 text-xs shrink-0 flex items-center gap-1.5"
                >
                  {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedKey ? 'Copied!' : 'Copy Key'}
                </button>
                <button
                  onClick={() => setCreatedSecret(null)}
                  className="btn-secondary !py-2 !px-3 text-xs shrink-0"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Key Management Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Create Key */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2 text-surface-900 font-bold text-base">
            <Key className="w-4 h-4 text-primary-600" />
            <h3>Create API Key</h3>
          </div>
          <p className="text-xs text-surface-500 leading-relaxed">
            Generate programmatic keys with customizable per-minute rate limits for backend automation and pipelines.
          </p>
          <form onSubmit={handleCreateKey} className="space-y-3 pt-1">
            <div>
              <label htmlFor="key-name" className="block text-xs font-semibold text-surface-700 mb-1">
                Key Name / Description
              </label>
              <input
                id="key-name"
                type="text"
                placeholder="e.g. Production Pipeline, CI Bot"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="input-field text-xs"
                required
              />
            </div>
            <div>
              <label htmlFor="rate-limit" className="block text-xs font-semibold text-surface-700 mb-1">
                Rate Limit (requests / min)
              </label>
              <select
                id="rate-limit"
                value={newKeyRateLimit}
                onChange={(e) => setNewKeyRateLimit(Number(e.target.value))}
                className="input-field text-xs"
              >
                <option value={60}>Standard Tier (60 req/min)</option>
                <option value={120}>Pro Tier (120 req/min)</option>
                <option value={300}>Enterprise Tier (300 req/min)</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={creating}
              className="btn-primary w-full !py-2.5 text-xs flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              {creating ? 'Generating...' : 'Generate API Key'}
            </button>
          </form>
        </div>

        {/* Right: Key List */}
        <div className="lg:col-span-2 card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-surface-900 font-bold text-base">
              <Shield className="w-4 h-4 text-primary-600" />
              <h3>Your Active API Keys</h3>
            </div>
            <button
              onClick={loadKeys}
              className="p-1.5 rounded-lg text-surface-400 hover:text-surface-700 hover:bg-surface-100 transition-colors"
              title="Refresh keys"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-surface-400 animate-pulse">
              Loading API keys...
            </div>
          ) : keys.length === 0 ? (
            <div className="py-10 text-center space-y-2 border border-dashed border-surface-200 rounded-xl bg-surface-50/50">
              <Key className="w-8 h-8 text-surface-300 mx-auto" />
              <p className="text-xs font-semibold text-surface-600">No API keys created yet</p>
              <p className="text-[11px] text-surface-400">Generate your first key to start using the API.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-surface-200 text-surface-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Key Prefix</th>
                    <th className="py-2.5 px-3">Rate Limit</th>
                    <th className="py-2.5 px-3">Requests</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {keys.map((k) => (
                    <tr key={k.id} className="hover:bg-surface-50/60 transition-colors">
                      <td className="py-3 px-3 font-semibold text-surface-800">{k.name}</td>
                      <td className="py-3 px-3 font-mono text-[11px] text-surface-500">
                        {k.keyPrefix}••••••••
                      </td>
                      <td className="py-3 px-3 text-surface-600">{k.rateLimit} / min</td>
                      <td className="py-3 px-3 font-mono text-surface-600">{k.totalRequests}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            k.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {k.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right space-x-1">
                        <button
                          onClick={() => handleViewUsage(k.id)}
                          className="px-2 py-1 rounded text-[11px] font-medium text-surface-600 hover:bg-surface-200/60 transition-colors"
                          title="View Usage Logs"
                        >
                          Logs
                        </button>
                        {k.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleRevokeKey(k.id)}
                            className="p-1 rounded text-red-500 hover:bg-red-50 transition-colors"
                            title="Revoke Key"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Usage Logs Drawer / Modal */}
      {selectedKeyId && (
        <div className="card space-y-3 animate-fade-in border-primary-200">
          <div className="flex items-center justify-between border-b border-surface-200 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary-600" />
              <h3 className="text-sm font-bold text-surface-900">
                Key Usage Logs (Key #{selectedKeyId})
              </h3>
            </div>
            <button
              onClick={() => setSelectedKeyId(null)}
              className="text-xs text-surface-500 hover:text-surface-800 font-semibold"
            >
              Close Logs
            </button>
          </div>

          {loadingLogs ? (
            <p className="text-xs text-surface-400 py-4 text-center animate-pulse">Fetching telemetry logs...</p>
          ) : usageLogs.length === 0 ? (
            <p className="text-xs text-surface-400 py-4 text-center">No API calls recorded for this key yet.</p>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-surface-200 text-surface-400 font-semibold text-[10px] uppercase">
                    <th className="py-2 px-3">Method</th>
                    <th className="py-2 px-3">Endpoint</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Latency</th>
                    <th className="py-2 px-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {usageLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="py-2 px-3 font-mono font-bold text-[11px] text-primary-700">{log.method}</td>
                      <td className="py-2 px-3 font-mono text-surface-600 text-[11px]">{log.endpoint}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.statusCode < 400 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {log.statusCode}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono text-surface-500">{log.responseMs}ms</td>
                      <td className="py-2 px-3 text-surface-400 text-[11px]">{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Interactive API Console & Code Generator */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Request Configuration */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-surface-900 font-bold text-base">
              <Terminal className="w-4 h-4 text-primary-600" />
              <h3>Interactive API Console</h3>
            </div>
            <span className="text-[11px] font-mono text-surface-400">POST /api/v1/summaries</span>
          </div>

          <div className="space-y-3">
            <div>
              <label htmlFor="test-key" className="block text-xs font-semibold text-surface-700 mb-1">
                API Key (Header: <code className="text-primary-700 font-mono">X-API-Key</code>)
              </label>
              <input
                id="test-key"
                type="text"
                placeholder="sk-... or leave empty for session auth"
                value={testApiKey}
                onChange={(e) => setTestApiKey(e.target.value)}
                className="input-field text-xs font-mono"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label htmlFor="test-mode" className="block text-xs font-semibold text-surface-700 mb-1">Mode</label>
                <select
                  id="test-mode"
                  value={testMode}
                  onChange={(e) => setTestMode(e.target.value)}
                  className="input-field text-xs"
                >
                  <option value="HYBRID">Hybrid (Default)</option>
                  <option value="EXTRACTIVE">Extractive</option>
                  <option value="ABSTRACTIVE">Abstractive</option>
                </select>
              </div>

              <div>
                <label htmlFor="test-len" className="block text-xs font-semibold text-surface-700 mb-1">Length</label>
                <select
                  id="test-len"
                  value={testLength}
                  onChange={(e) => setTestLength(e.target.value)}
                  className="input-field text-xs"
                >
                  <option value="BRIEF">Brief</option>
                  <option value="STANDARD">Standard</option>
                  <option value="DETAILED">Detailed</option>
                </select>
              </div>

              <div>
                <label htmlFor="test-persona" className="block text-xs font-semibold text-surface-700 mb-1">Persona</label>
                <select
                  id="test-persona"
                  value={testPersona}
                  onChange={(e) => setTestPersona(e.target.value)}
                  className="input-field text-xs"
                >
                  <option value="Executive">Executive</option>
                  <option value="Academic">Academic</option>
                  <option value="Technical">Technical</option>
                  <option value="Casual">Casual</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="test-text" className="block text-xs font-semibold text-surface-700 mb-1">
                Content Payload
              </label>
              <textarea
                id="test-text"
                rows={4}
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                className="input-field text-xs font-mono resize-y"
              />
            </div>

            <button
              onClick={handleRunTest}
              disabled={testRunning || !testText.trim()}
              className="btn-primary w-full !py-2.5 text-xs flex items-center justify-center gap-2"
            >
              <Play className="w-3.5 h-3.5" />
              {testRunning ? 'Executing API Request...' : 'Send API Request'}
            </button>
          </div>
        </div>

        {/* Right: Response Output & Code Snippets */}
        <div className="card space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Snippet Tabs */}
            <div className="flex items-center justify-between border-b border-surface-200 pb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveSnippetTab('curl')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                    activeSnippetTab === 'curl' ? 'bg-primary-600 text-white' : 'text-surface-600 hover:bg-surface-100'
                  }`}
                >
                  cURL
                </button>
                <button
                  onClick={() => setActiveSnippetTab('python')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                    activeSnippetTab === 'python' ? 'bg-primary-600 text-white' : 'text-surface-600 hover:bg-surface-100'
                  }`}
                >
                  Python
                </button>
                <button
                  onClick={() => setActiveSnippetTab('ts')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                    activeSnippetTab === 'ts' ? 'bg-primary-600 text-white' : 'text-surface-600 hover:bg-surface-100'
                  }`}
                >
                  TypeScript
                </button>
              </div>

              <button
                onClick={handleCopySnippet}
                className="flex items-center gap-1 text-xs text-surface-500 hover:text-surface-800 font-medium transition-colors"
              >
                {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSnippet ? 'Copied' : 'Copy'}
              </button>
            </div>

            {/* Snippet Code block */}
            <pre className="p-3 bg-surface-900 text-surface-100 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed max-h-44">
              {currentSnippet}
            </pre>

            {/* Live Response Panel */}
            <div className="space-y-2 pt-2 border-t border-surface-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-surface-800">Response Payload</span>
                {testLatency !== null && (
                  <span className="text-[11px] font-mono text-emerald-600 font-semibold">
                    HTTP 200 OK • {testLatency}ms
                  </span>
                )}
              </div>

              <div className="p-3 bg-surface-900 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto max-h-56">
                {testRunning ? (
                  <div className="text-surface-400 animate-pulse">Awaiting response from /api/v1/summaries...</div>
                ) : testResponse ? (
                  <pre className="whitespace-pre-wrap">{JSON.stringify(testResponse, null, 2)}</pre>
                ) : (
                  <div className="text-surface-500 italic">Click "Send API Request" to execute a live call.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
