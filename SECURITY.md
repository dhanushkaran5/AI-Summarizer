# Security Policy & Architecture: ANTI-SUMMARY

## 1. Authentication & Authorization
- **JWT (JSON Web Tokens)**: Stateless token-based authentication with expiration controls.
- **Spring Security 6 Filter Chain**: Strict endpoint protection restricting user data access exclusively to the authenticated resource owner (`findByIdAndUserId`).

## 2. Input Validation & File Security
- **File Extension Whitelisting**: Strict validation for approved MIME types (`.pdf`, `.docx`, `.pptx`, `.txt`, `.md`, `.html`, `.csv`).
- **File Size Ceiling**: Global 50MB hard limit preventing resource exhaustion.
- **Path Traversal Protection**: Unique UUID-generated filenames on disk avoiding directory traversal exploits.

## 3. Secret Management
- API Keys (`OPENAI_API_KEY`, `GEMINI_API_KEY`, `JWT_SECRET`) are strictly externalized via environment variables and never checked into source control.
- Safe local mock fallback operates without requiring any external keys or credentials.
