// Summarize AI - Popup UI Logic

const DEFAULT_API_URL = 'http://localhost:8080/api/v1/summaries';

document.addEventListener('DOMContentLoaded', async () => {
  const settingsToggleBtn = document.getElementById('settingsToggleBtn');
  const settingsPanel = document.getElementById('settingsPanel');
  const apiUrlInput = document.getElementById('apiUrlInput');
  const apiKeyInput = document.getElementById('apiKeyInput');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');

  const modeSelect = document.getElementById('modeSelect');
  const lengthSelect = document.getElementById('lengthSelect');
  const personaSelect = document.getElementById('personaSelect');
  const summarizePageBtn = document.getElementById('summarizePageBtn');
  const summarizeSelectionBtn = document.getElementById('summarizeSelectionBtn');

  const statusBox = document.getElementById('statusBox');
  const statusText = document.getElementById('statusText');
  const resultBox = document.getElementById('resultBox');
  const resConfidenceBadge = document.getElementById('resConfidenceBadge');
  const resPersonaBadge = document.getElementById('resPersonaBadge');
  const resTitle = document.getElementById('resTitle');
  const resSummaryText = document.getElementById('resSummaryText');
  const insightsBox = document.getElementById('insightsBox');
  const insightsList = document.getElementById('insightsList');
  const copySummaryBtn = document.getElementById('copySummaryBtn');

  // Load preferences
  chrome.storage.sync.get(['apiUrl', 'apiKey', 'mode', 'length', 'persona'], (data) => {
    if (data.apiUrl) apiUrlInput.value = data.apiUrl;
    if (data.apiKey) apiKeyInput.value = data.apiKey;
    if (data.mode) modeSelect.value = data.mode;
    if (data.length) lengthSelect.value = data.length;
    if (data.persona) personaSelect.value = data.persona;
  });

  // Check for pending selection from context menu
  chrome.storage.local.get(['pendingSelection', 'pendingTitle'], (data) => {
    if (data.pendingSelection) {
      chrome.storage.local.remove(['pendingSelection', 'pendingTitle']);
      runSummarization(data.pendingSelection, data.pendingTitle || 'Selected Snippet');
    }
  });

  // Toggle settings
  settingsToggleBtn.addEventListener('click', () => {
    settingsPanel.classList.toggle('hidden');
  });

  // Save settings
  saveSettingsBtn.addEventListener('click', () => {
    chrome.storage.sync.set({
      apiUrl: apiUrlInput.value.trim() || DEFAULT_API_URL,
      apiKey: apiKeyInput.value.trim(),
      mode: modeSelect.value,
      length: lengthSelect.value,
      persona: personaSelect.value,
    }, () => {
      settingsPanel.classList.add('hidden');
      showStatus('Settings saved successfully!', false);
      setTimeout(() => statusBox.classList.add('hidden'), 2000);
    });
  });

  // Summarize Page
  summarizePageBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        showError('No active browser tab detected.');
        return;
      }

      showStatus('Extracting article content...');
      chrome.tabs.sendMessage(tab.id, { action: 'extract_page' }, (response) => {
        if (chrome.runtime.lastError || !response || !response.text) {
          showError('Could not extract text from this page. Try selecting text directly.');
          return;
        }
        runSummarization(response.text, response.title || tab.title || 'Web Article');
      });
    } catch (err) {
      showError(err.message || 'Failed to inspect page');
    }
  });

  // Summarize Selected Text
  summarizeSelectionBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        showError('No active browser tab detected.');
        return;
      }

      showStatus('Checking text selection...');
      chrome.tabs.sendMessage(tab.id, { action: 'extract_selection' }, (response) => {
        if (chrome.runtime.lastError || !response || !response.text) {
          showError('No text selected. Please highlight text on the page first.');
          return;
        }
        runSummarization(response.text, response.title || 'Selected Web Text');
      });
    } catch (err) {
      showError(err.message || 'Failed to fetch selection');
    }
  });

  // Run API Summarization
  async function runSummarization(text, title) {
    const apiUrl = apiUrlInput.value.trim() || DEFAULT_API_URL;
    const apiKey = apiKeyInput.value.trim();
    const mode = modeSelect.value;
    const length = lengthSelect.value;
    const persona = personaSelect.value;

    showStatus(`Synthesizing with ${persona} persona...`);
    resultBox.classList.add('hidden');

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (apiKey) {
        headers['X-API-Key'] = apiKey;
      }

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title,
          text,
          mode,
          length,
          persona,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      renderResult(data, title);
    } catch (err) {
      showError(`API Error: ${err.message}. Ensure backend is running on ${apiUrl}`);
    }
  }

  function renderResult(data, defaultTitle) {
    statusBox.classList.add('hidden');
    resultBox.classList.remove('hidden');

    resTitle.textContent = data.title || defaultTitle || 'Synthesis';
    resSummaryText.textContent = data.summaryText || 'No summary text returned.';
    resPersonaBadge.textContent = data.persona || personaSelect.value;

    const conf = Math.round((data.confidenceScore || 0.92) * 100);
    resConfidenceBadge.textContent = `Confidence: ${conf}%`;

    // Render insights if present
    if (data.insights && data.insights.length > 0) {
      insightsBox.classList.remove('hidden');
      insightsList.innerHTML = '';
      data.insights.slice(0, 3).forEach((ins) => {
        const li = document.createElement('li');
        li.textContent = ins.title ? `${ins.title}: ${ins.insight}` : (ins.insight || ins);
        insightsList.appendChild(li);
      });
    } else {
      insightsBox.classList.add('hidden');
    }
  }

  // Copy Summary to clipboard
  copySummaryBtn.addEventListener('click', () => {
    const text = resSummaryText.textContent;
    navigator.clipboard.writeText(text).then(() => {
      copySummaryBtn.textContent = '✅';
      setTimeout(() => { copySummaryBtn.textContent = '📋'; }, 2000);
    });
  });

  function showStatus(msg, spinning = true) {
    statusBox.classList.remove('hidden');
    statusText.textContent = msg;
    const spinner = statusBox.querySelector('.spinner');
    if (spinner) spinner.style.display = spinning ? 'block' : 'none';
  }

  function showError(msg) {
    showStatus(msg, false);
    statusBox.style.background = 'rgba(239, 68, 68, 0.15)';
    statusBox.style.borderColor = 'rgba(239, 68, 68, 0.4)';
    statusBox.style.color = '#fca5a5';
  }
});
