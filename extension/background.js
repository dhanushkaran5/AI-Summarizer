// Summarize AI - Background Service Worker (Manifest V3)

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'summarize-selection',
    title: 'Summarize Selection with Summarize AI',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'summarize-selection' && info.selectionText) {
    chrome.storage.local.set({
      pendingSelection: info.selectionText,
      pendingTitle: tab?.title || 'Selected Web Text'
    }, () => {
      // Open popup if supported or notify user
      if (tab?.id) {
        chrome.action.openPopup?.();
      }
    });
  }
});
