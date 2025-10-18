---
created_date: YYYY-MM-DD
last_modified_date: YYYY-MM-DD
last_modified_summary: Initial creation
---

# API Endpoint: [Endpoint Name]

## Overview
Brief description of what this API endpoint does and its purpose in the system.

## Endpoint
```
METHOD /api/path/to/endpoint
```

## Authentication
- Required: [Yes/No]
- Authentication method: [Bearer token/API key/etc.]
- Required permissions: [List of required permissions]

## Request

### Headers
```http
Content-Type: application/json
Authorization: Bearer <token>
```

### Parameters

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | The unique identifier |

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | 20 | Maximum number of results to return |
| `offset` | number | No | 0 | Number of results to skip |

### Request Body
```typescript
interface RequestBody {
  name: string;
  description?: string;
  metadata?: Record<string, any>;
}
```

Example:
```json
{
  "name": "Example Item",
  "description": "This is an example",
  "metadata": {
    "tags": ["example", "demo"]
  }
}
```

## Response

### Success Response (200)
```typescript
interface SuccessResponse {
  success: true;
  data: ResponseData;
  message: string;
}
```

Example:
```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "Example Item",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "message": "Item created successfully"
}
```

### Error Responses

#### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "name",
      "message": "Name is required"
    }
  ]
}
```

#### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

#### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

#### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Rate Limiting
- Limit: [X requests per time period]
- Example: 100 requests per minute

## Examples

### cURL
```bash
curl -X POST \
  https://api.example.com/api/endpoint \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "name": "Example Item",
    "description": "Example description"
  }'
```

### JavaScript (fetch)
```javascript
const response = await fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'Example Item',
    description: 'Example description'
  })
});

const result = await response.json();
```

## Validation Rules
- `name`: Required, string, 1-100 characters
- `description`: Optional, string, max 500 characters
- `metadata`: Optional, valid JSON object, max 10KB

## Error Handling
- All errors follow the standard error response format
- Validation errors include detailed field-level information
- Network errors should be retried with exponential backoff

## Related Endpoints
- `GET /api/endpoint` - List all items
- `GET /api/endpoint/{id}` - Get specific item
- `PUT /api/endpoint/{id}` - Update item
- `DELETE /api/endpoint/{id}` - Delete item

## Changelog
- YYYY-MM-DD: Initial implementation
- YYYY-MM-DD: Added validation for metadata field
