# API Endpoints Testing Guide

This guide helps you test each streaming service endpoint to verify they're working correctly.

## Setup
Before testing, ensure you have:
- API keys from each service (stored in `.env.local`)
- A valid, accessible video URL to test with
- `curl` installed or use an API testing tool (Postman, Thunder Client, etc.)

---

## 1. Doodstream ✅

### Test 1: Upload Remote URL
```bash
# Replace YOUR_KEY and VIDEO_URL
curl "https://doodapi.co/api/upload/url?key=YOUR_KEY&url=https%3A%2F%2Fexample.com%2Fvideo.mp4"
```

**Expected Response (Success)**:
```json
{
  "msg": "OK",
  "status": 200,
  "result": {
    "filecode": "abc123xyz456"
  }
}
```

**Expected Response (Failure)**:
```json
{
  "msg": "Error message",
  "status": 400
}
```

**Save the `filecode` for the next test.**

---

### Test 2: Check Upload Status (FIXED ENDPOINT)
```bash
# This is the CORRECTED endpoint (was using /api/upload/list before)
curl "https://doodapi.co/api/urlupload/status?key=YOUR_KEY&file_code=abc123xyz456"
```

**Expected Response**:
```json
{
  "msg": "OK",
  "status": 200,
  "result": [
    {
      "status": "working" | "completed" | "error",
      "filecode": "abc123xyz456",
      "bytes_downloaded": "1000000",
      "bytes_total": "2000000"
    }
  ]
}
```

**Status meanings**:
- `working` → Still downloading
- `completed` → Ready to watch
- `error` → Download failed

**✓ Fix verified**: If you get a response with a specific file status (not searching through list)

---

## 2. Filemoon ⚠️ NEEDS TESTING

### Test 1: Upload Remote URL
```bash
# Replace YOUR_KEY and VIDEO_URL
curl "https://api.byse.sx/remote/add?key=YOUR_KEY&url=https%3A%2F%2Fexample.com%2Fvideo.mp4" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
```

**Expected Response (Success)**:
```json
{
  "msg": "OK",
  "status": 200,
  "result": {
    "filecode": "jthi5jdsu8t9"
  }
}
```

**❌ If you get "fetch failed" error**:
1. Check if API key is correct
2. Try with POST method instead:
   ```bash
   curl -X POST "https://api.byse.sx/remote/add" \
     -d "key=YOUR_KEY&url=https%3A%2F%2Fexample.com%2Fvideo.mp4" \
     -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
   ```

**Save the `filecode` for the next test.**

---

### Test 2: Check Upload Status
```bash
curl "https://api.byse.sx/remote/status?key=YOUR_KEY&file_code=jthi5jdsu8t9"
```

**Expected Response**:
```json
{
  "msg": "OK",
  "status": 200,
  "result": {
    "status": "WORKING" | "COMPLETED" | "FAILED" | "QUEUED",
    "progress": "55%",
    "url": "https://filemoon.sx/e/jthi5jdsu8t9"
  }
}
```

**Status meanings**:
- `WORKING` → Downloading
- `COMPLETED` → Ready
- `FAILED` → Error occurred
- `QUEUED` → Waiting to start

---

## 3. SeekStreaming ⚠️ NEEDS TESTING

### Test 1: Upload Remote URL
```bash
# Replace YOUR_KEY and VIDEO_URL
curl "https://seekstreaming.com/api/remote/add?key=YOUR_KEY&url=https%3A%2F%2Fexample.com%2Fvideo.mp4" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
```

**Expected Response** (Unknown - Log the actual response):
The code will now log:
- `SeekStreaming upload request to:` (endpoint being called)
- `SeekStreaming raw response:` (actual response from API)

**⚠️ If response parsing fails**:
- Check server logs for `SeekStreaming raw response:`
- This will show what the API is actually returning
- Share this with SeekStreaming support for clarification

**Save any ID or filecode returned.**

---

### Test 2: Check Upload Status
```bash
curl "https://seekstreaming.com/api/file/info?key=YOUR_KEY&file_id=RETURNED_ID"
```

**Current Code Expects**:
```json
{
  "status": 200,
  "result": {
    "filecode": "abc123",
    "status": "processing" | "completed" | "failed"
  }
}
```

**⚠️ If this doesn't work**:
- Check server logs for `SeekStreaming status response for`
- The actual response should be logged
- Try alternative parameter names: `file_code` instead of `file_id`

---

## Server Monitoring

### Where to find logs:
1. **Development**: Your terminal running `npm run dev`
2. **Production**: Check your Vercel/hosting provider logs

### What to look for:
```
Filemoon response: {...}
Doodstream response: {...}
SeekStreaming response: {...}
```

These logs now show:
- Whether the request succeeded
- Exact response structure from API
- Any parsing errors
- Actual file status

---

## Troubleshooting Checklist

- [ ] API keys are correct and not expired
- [ ] Video URL is publicly accessible (no authentication required)
- [ ] Video URL is not behind a firewall/proxy
- [ ] Request timeout is reasonable (10 seconds in current code)
- [ ] API is returning JSON (not HTML error page)
- [ ] Status field is included in response
- [ ] File ID/filecode is properly extracted

---

## Testing Workflow

1. **Start with Doodstream** (most reliable, well-documented)
2. **Then Filemoon** (has documentation, but endpoint may require POST)
3. **Finally SeekStreaming** (no docs, needs empirical testing)

For each service:
1. Test upload endpoint → save file ID
2. Wait 10-30 seconds
3. Test status endpoint with that ID
4. Check if status shows "completed" or equivalent

---

## Providing Feedback

If an endpoint fails, please share:
1. **Actual error message** from console logs
2. **Raw API response** (look for logs like "Filemoon raw response:")
3. **API key format** (doesn't need to be valid, just pattern like `xxx...xxx`)
4. **Video URL tested** with (if public/shareable)

This will help diagnose issues more quickly.
