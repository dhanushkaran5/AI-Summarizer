// Summarize AI - Content Script
// Extracts readable text from active webpage

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extract_selection') {
    const selection = window.getSelection() ? window.getSelection().toString().trim() : '';
    sendResponse({ text: selection, title: document.title });
    return true;
  }

  if (request.action === 'extract_page') {
    const text = extractArticleText();
    sendResponse({ text, title: document.title });
    return true;
  }
});

function extractArticleText() {
  // Check user selection first
  const selection = window.getSelection() ? window.getSelection().toString().trim() : '';
  if (selection.length > 50) {
    return selection;
  }

  // Check article or main tags
  const selectors = ['article', 'main', '[role="main"]', '.post-content', '.article-body', '.entry-content', '#content'];
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) {
      const clone = el.cloneNode(true);
      // Remove scripts, styles, navs
      const cleanElements = clone.querySelectorAll('script, style, nav, footer, header, aside, .advertisement, .ad');
      cleanElements.forEach((node) => node.remove());
      const extracted = clone.innerText ? clone.innerText.trim() : '';
      if (extracted.length > 100) {
        return cleanElementsLimit(extracted);
      }
    }
  }

  // Fallback: collect paragraphs
  const paragraphs = Array.from(document.querySelectorAll('p, h1, h2, h3'))
    .map((p) => p.innerText.trim())
    .filter((t) => t.length > 30);

  const combined = paragraphs.join('\n\n');
  return cleanElementsLimit(combined || document.body.innerText || '');
}

function cleanElementsLimit(text) {
  // Limit to reasonable payload (e.g. 20,000 words max)
  return text.slice(0, 50000);
}
