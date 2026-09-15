# Summarize AI — Chrome & Edge Browser Extension (Manifest V3)

The **Summarize AI Web Companion** enables instant, intelligent summarization of online articles, research papers, news, and highlighted text selections directly from your browser.

---

## 🌟 Key Features

- **One-Click Page Summarization**: Automatically parses `<article>` and main content, stripping ads and navigation.
- **Selection Summarization**: Highlight any paragraph or quote and click "Selected Text" or right-click to summarize.
- **Configurable Personas & Modes**:
  - **Modes**: Hybrid (Extractive + Abstractive), Extractive, Abstractive
  - **Lengths**: Brief (1-2 sentences), Standard, Detailed
  - **Personas**: Executive, Academic, Technical, Casual
- **Instant Confidence & Key Insights**: Transparent confidence score badges and structured bulleted takeaways.
- **One-Click Copy & Studio Sync**: Copy summary to clipboard or jump into the web platform.

---

## 🚀 Installation Guide

### Google Chrome & Brave
1. Open Chrome and navigate to `chrome://extensions`.
2. Toggle the **Developer mode** switch in the top-right corner.
3. Click **Load unpacked** in the top-left corner.
4. Select the `extension/` directory within this project:
   `c:\Users\Dhanushkaran M\Desktop\AI Summarizer\extension`
5. The extension icon ✨ will appear in your Chrome toolbar. Pin it for quick access!

### Microsoft Edge
1. Navigate to `edge://extensions`.
2. Enable **Developer mode** on the left sidebar.
3. Click **Load unpacked** and select the `extension/` folder.

---

## ⚙️ Configuration

1. Click the extension icon in your browser toolbar.
2. Click the **⚙️ Settings** icon in the header.
3. Confirm the **Backend API URL**:
   - Local default: `http://localhost:8080/api/v1/summaries`
4. (Optional) Enter your **API Key** generated from the [Developer Hub](http://localhost:5173/developer) for custom rate limits and usage tracking.
5. Click **Save Preferences**.

---

## 🧪 Testing the Extension

1. Ensure the Summarize AI backend and AI service are running:
   ```bash
   # Backend
   cd backend && ./mvnw spring-boot:run
   # AI Service
   cd ai-service && uvicorn app.main:app --port 8000
   ```
2. Navigate to any Wikipedia article, tech blog, or news website (e.g. arXiv or TechCrunch).
3. Click the extension icon and click **⚡ Summarize Page**.
4. Or highlight 2-3 sentences, click the extension icon, and click **📝 Selected Text**.
