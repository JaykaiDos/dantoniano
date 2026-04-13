# Streaming Service API Documentation

## 1. VOE.sx Remote Upload API

### Endpoint: Add URL to Queue
- **URL**: `https://voe.sx/api/upload/url`
- **Method**: GET or POST
- **Authentication**: Query parameter `key` (API key from account settings)
- **Rate Limit**: 3-4 requests/second

### Required Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | Yes | API key from account settings |
| `url` | string | Yes | URL to the video file (http/https/ftp) |
| `folder_id` | integer | No | Target folder ID |

### Success Response (200)
```json
{
   "server_time": "2023-03-31 00:00:00",
   "msg": "OK",
   "message": "successful.",
   "status": 200,
   "success": true,
   "result": {
      "file_code": "abc123456789",
      "queueID": 1
   }
}
```

### List Remote Uploads
- **URL**: `https://voe.sx/api/upload/url/list`
- **Method**: GET
- **Parameters**:
  - `key` (required): API key
  - `id` (optional): Queue ID to filter
  - `page` (optional): Page number for pagination
  - `limit` (optional): Items per page (default 100)

### Status Codes
| Code | Meaning |
|------|---------|
| 1 | Pending |
| 2 | Processing |
| 3 | Completed |
| 4 | Failed |

### Error Response
```json
{
   "status": 400,
   "msg": "Error",
   "success": false,
   "message": "Error description"
}
```

---

## 2. Filemoon.sx Remote Upload API

### Endpoint: Add Remote Upload
- **URL**: `https://api.byse.sx/remote/add`
- **Method**: GET
- **Base Domain**: Uses api.byse.sx (Byse is the backend platform)

### Required Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | Yes | API key for the account (1l5ftrilhllgwx2bo example format) |
| `url` | string | Yes | URL to the source video file |

### Optional Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `folder_id` | integer | Destination folder ID |

### Success Response (200)
```json
{
   "msg": "OK",
   "server_time": "2017-08-11 04:29:54",
   "status": 200,
   "result": {
      "filecode": "jthi5jdsu8t9"
   }
}
```

### Check Remote Status
- **URL**: `https://api.byse.sx/remote/status`
- **Method**: GET
- **Parameters**:
  - `key` (required): API key
  - `file_code` (required): File code returned from add operation

### Status Response
```json
{
   "msg": "OK",
   "server_time": "2017-08-11 04:29:54",
   "status": 200,
   "result": {
      "url": "https://exampleurl.com/file.mp4",
      "progress": "55%",
      "status": "WORKING",
      "created": "10:00:00 09-06-2022",
      "updated": "10:01:00 09-06-2022",
      "error_msg": ""
   }
}
```

### Remove Remote Upload
- **URL**: `https://api.byse.sx/remote/remove`
- **Method**: GET
- **Parameters**:
  - `key` (required): API key
  - `file_code` (required): File code to cancel

### Status Values
| Status | Meaning |
|--------|---------|
| WORKING | Currently downloading |
| COMPLETED | Successfully processed |
| FAILED | Download failed |
| QUEUED | Waiting to process |

---

## 3. Doodstream.com Remote Upload API

### Endpoint: Add Link (Remote Upload)
- **URL**: `https://doodapi.co/api/upload/url`
- **Method**: GET
- **Endpoint Domain**: doodapi.co (not doodstream.com)

### Required Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | Your API Key | Yes | API key from account settings |
| `url` | Upload URL | Yes | URL to the file to download |

### Optional Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `fld_id` | integer | Folder ID (to upload inside folder) |
| `new_title` | string | Custom title for the file |

### Success Response (200)
```json
{
   "msg": "OK",
   "server_time": "2017-08-11 04:30:07",
   "status": 200,
   "new_title": "",
   "total_slots": "100",
   "result": {
      "filecode": "98zukoh5jqiw"
   },
   "used_slots": "0"
}
```

### Remote Upload Status  ✅ FIXED
- **URL**: `https://doodapi.co/api/urlupload/status`
- **Method**: GET
- **Parameters**:
  - `key` (required): API key
  - `file_code` (required): File code returned from upload

### Status Response
```json
{
   "msg": "OK",
   "server_time": "2017-08-11 04:30:07",
   "status": 200,
   "result": [
      {
         "status": "completed",
         "filecode": "98zukoh5jqiw",
         "remote_url": "...",
         ...
      }
   ]
}
```

### Status Values
| Status | Meaning |
|--------|---------|
| working | Currently downloading |
| completed | Download finished |
| error | Failed to download |

### Rate Limits
- 10 requests per second
- Response on limit: `{"msg":"Too Many Requests","status":"429"}`

### Error Response
```json
{
   "msg": "Error description",
   "status": 400,
   "result": null
}
```

---

## 4. SeekStreaming.com Remote Upload API ⚠️ UNDOCUMENTED

⚠️ **STATUS**: Public API documentation is NOT publicly available  
**WORKING ENDPOINTS** (Reverse-engineered / Assumed):

### Endpoint: Add Remote Upload
- **URL**: `https://seekstreaming.com/api/remote/add`
- **Method**: GET (assumed based on pattern)
- **Parameters**:
  - `key` (required): API key from dashboard
  - `url` (required): Source video URL

### Likely Success Response
```json
{
   "status": 200,
   "result": {
      "id": "file123456",
      "filecode": "abc123"
   }
}
```

### Endpoint: Check File Status
- **URL**: `https://seekstreaming.com/api/file/info`
- **Method**: GET
- **Parameters**:
  - `key` (required): API key
  - `file_id` (required): ID returned from add operation

### Status Check Response (Assumed)
```json
{
   "status": 200,
   "success": true,
   "result": {
      "filecode": "abc123",
      "status": "processing|completed|failed"
   }
}
```

### ⚠️ Known Issues with SeekStreaming API
1. **No public documentation** - All endpoints are reverse-engineered/assumed
2. **Inconsistent response formats** - ID field may be in different locations
3. **Limited error reporting** - Error messages not well documented
4. **Potential rate limiting** - Actual limits unknown

### Recommendation for SeekStreaming
1. **Contact SeekStreaming support** directly at their dashboard for official API documentation
2. **Test endpoints** in development before relying on production
3. **Monitor logs** for actual response structures (logging added in code)
4. **Ask support** for:
   - Exact endpoint URLs
   - Expected request/response formats
   - Rate limiting policies
   - Status value documentation

---

## Previous Implementation

### Endpoint: Add Link (Remote Upload)
- **URL**: `https://doodapi.co/api/upload/url`
- **Method**: GET
- **Endpoint Domain**: doodapi.co (not doodstream.com)

### Required Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | Your API Key | Yes | API key from account settings |
| `url` | Upload URL | Yes | URL to the file to download |

### Optional Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `fld_id` | integer | Folder ID (to upload inside folder) |
| `new_title` | string | Custom title for the file |

### Success Response (200)
```json
{
   "msg": "OK",
   "server_time": "2017-08-11 04:30:07",
   "status": 200,
   "new_title": "",
   "total_slots": "100",
   "result": {
      "filecode": "98zukoh5jqiw"
   },
   "used_slots": "0"
}
```

---

## Quick Comparison Table

| Service | Remote Add URL | Status Check | List Uploads | Rate Limit |
|---------|---|---|---|---|
| VOE.sx | `https://voe.sx/api/upload/url` | via `/upload/url/list` | Yes | 3-4 req/s |
| FileMoon | `https://api.byse.sx/remote/add` | `https://api.byse.sx/remote/status` | via `/remote/status` | Not specified |
| Doodstream | `https://doodapi.co/api/upload/url` | `https://doodapi.co/api/urlupload/status` | Yes | 10 req/s |
| SeekStreaming | ❌ Not publicly documented | ❌ Not public | ❌ Not public | Unknown |

---

## Common Implementation Patterns

All three services use:
- **Authentication**: API key in query parameter or header
- **Response Format**: JSON with `status` and `result` fields
- **File Codes**: 12-character alphanumeric codes returned for each upload
- **HTTP Methods**: GET (with some services also supporting POST)

### Status Code Meanings Across Services
- **200/OK**: Success
- **400**: Bad request
- **429**: Rate limit exceeded (Doodstream)
- **500**: Server error
- Custom status fields in response body indicate operation status (working/completed/error)

---

## Troubleshooting Guide

### Doodstream - Status Check Fixed ✅
**Problem**: Was using `/api/upload/list` (searches entire uploads list)  
**Solution**: Now uses `/api/urlupload/status?key=...&file_code=...` (specific file check)  
**Why**: Direct endpoint is faster and doesn't require searching through all files  
**Test**: 
```bash
curl "https://doodapi.co/api/urlupload/status?key=YOUR_KEY&file_code=abc123"
```

### Filemoon - "Fetch Failed" Error ⚠️  
**Possible Causes**:
1. **API key expired or invalid** - Verify in dashboard
2. **Network/CORS issues** - api.byse.sx may have restrictions
3. **Timeout** - Added 10-second timeout, check if server is slow
4. **Invalid URL parameter** - Ensure URL is properly encoded

**Debugging Steps**:
1. Check console logs (uploading now logs full request + response)
2. Verify API key is correct: `echo $FILEMOON_API_KEY`
3. Test endpoint manually:
```bash
curl "https://api.byse.sx/remote/add?key=YOUR_KEY&url=https%3A%2F%2Fexample.com%2Fvideo.mp4"
```
4. If still failing, contact Filemoon support with error details

### SeekStreaming - Status: undefined ⚠️  
**Root Cause**: No public API documentation - endpoints are reverse-engineered  
**Changes Made**:
- Improved error handling and logging
- Added timeout protection (10 seconds)
- Better response parsing to find ID in multiple locations

**Debugging Steps**:
1. Monitor server logs for SeekStreaming API responses
2. Test upload endpoint:
```bash
curl "https://seekstreaming.com/api/remote/add?key=YOUR_KEY&url=https%3A%2F%2Fexample.com%2Fvideo.mp4"
```
3. Test status endpoint:
```bash
curl "https://seekstreaming.com/api/file/info?key=YOUR_KEY&file_id=abc123"
```
4. **Contact SeekStreaming support** to get official documentation

### General Debugging in Production
Monitor `/api/cron` logs for detailed upload status checks:
- Look for "Filemoon response:", "Doodstream response:", "SeekStreaming response:"
- These will show raw responses from each service
- Use this to diagnose actual API response structures
