# Troubleshooting Guide: ANTI-SUMMARY

## Common Scenarios & Instant Solutions

### 1. "AI service is offline or unreachable"
- **Cause**: Port 8000 is not running or blocked.
- **Remedy**: Start the AI service with `cd ai-service && python -m uvicorn app.main:app --port 8000`. The backend and frontend will gracefully switch to offline deterministic heuristic fallback in the meantime.

### 2. "Scanned or Image-only PDF returns low text"
- **Cause**: Document is a scanned image without an embedded OCR text layer.
- **Remedy**: Upload the original digital document or convert it using a pre-processing OCR tool. ANTI-SUMMARY detects low text density and displays an OCR advisory badge.

### 3. "Port 8080 or 8000 already in use"
- **Remedy**:
  ```powershell
  # Find process using port
  netstat -ano | findstr :8080
  # Stop process by PID
  taskkill /PID <PID> /F
  ```

### 4. "File exceeds size limit"
- **Remedy**: ANTI-SUMMARY supports documents up to 50MB. If your document is larger, compress the embedded images or split chapters before uploading.
