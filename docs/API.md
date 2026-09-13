# REST and bot API reference

TeleDoc exposes a minimal set of REST endpoints for the Mini App frontend and interacts with Telegram users via the grammY bot framework.

## REST Endpoints

### 1. Health check

- **Path**: `GET /health`
- **Response**:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "demoMode": true
}
```

### 2. Demo sample asset

- **Path**: `GET /api/demo-image`
- **Description**: Returns the bundled angled sample document image for testing without requiring camera input.
- **Response**: Image binary (`image/png`).

### 3. Upload raw photo

- **Path**: `POST /api/upload`
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `photo`: Image file (JPEG/PNG/WebP)
- **Response**:
```json
{
  "id": "file_8f2b1c90",
  "url": "/api/download/file_8f2b1c90",
  "width": 1600,
  "height": 1200
}
```

### 4. Compile and export PDF

- **Path**: `POST /api/export-pdf`
- **Content-Type**: `application/json`
- **Request body**:
```json
{
  "pages": [
    "data:image/jpeg;base64,...",
    "data:image/jpeg;base64,..."
  ],
  "title": "Scanned_Document",
  "chatId": 123456789
}
```
- **Response**:
```json
{
  "success": true,
  "downloadUrl": "/api/download/doc_7a9f2e81.pdf",
  "sentToTelegram": true
}
```

If `chatId` is present and the bot has an active token, the PDF is immediately dispatched to the user's Telegram chat.

### 5. Download compiled file

- **Path**: `GET /api/download/:fileId`
- **Response**: File stream (`application/pdf` or `image/jpeg`) with appropriate `Content-Disposition`.

---

## Telegram bot commands

| Command | Action |
| :--- | :--- |
| `/start` | Welcomes the user, explains how to send photos, and provides a button to open the scanner. |
| `/scan` | Opens the TeleDoc Mini App directly in the current chat. |
| `/demo` | Loads the demo document in the Mini App for quick feature demonstration. |
| `/help` | Explains tips for taking clean photos (angle, contrast against desk, lighting). |

---

## Mini App URL parameters

When launched from Telegram or a web link, the Mini App accepts the following query parameters:

- `photoId`: The identifier of a raw photo uploaded to the backend.
- `chatId`: The Telegram chat identifier used for sending the final PDF back.
- `demo`: Set to `true` to preload the bundled angled document sample.
