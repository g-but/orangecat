# OrangeCat Messaging System Testing Procedure

## Prerequisites
- Development server running: `npm run dev` (currently on http://localhost:3002)
- Supabase running locally or connected to remote instance
- At least 2 test user accounts created and authenticated

## Manual Testing Steps

### 1. Start the dev server
```bash
npm run dev
```
✅ **Status**: Server running on http://localhost:3002

### 2. Log in as User A
- Navigate to http://localhost:3002/auth?mode=login
- Enter credentials for first test user
- Verify successful login and redirect to dashboard

### 3. Navigate to Messages Page
- Click on Messages link in navigation or go to `/messages`
- Verify the messages page loads correctly
- Should show "Messages" header and "New chat" button

### 4. Click "New chat"
- Click the "New" button in the top-right corner
- Verify the New Conversation Modal opens
- Should show search input with placeholder "Search by name or @username"

### 5. Select User B from the list
- Type User B's name or username in the search field
- Wait for search results (debounced at 300ms)
- Click on User B's profile from the results
- Verify "Message" button appears and click it

### 6. Verify API calls and UI state
- **POST /api/messages/open** should return 200 with `conversationId`
  - Request body: `{ "participantIds": ["user-b-id"] }`
  - Response: `{ "success": true, "conversationId": "uuid-string" }`

- **GET /api/messages/{conversationId}** should return 200 (not 403/404)
  - Should return conversation data with participants and messages array

- **UI Verification**: MessageView should show
  - Conversation header with User B's name
  - Message composer at the bottom
  - Empty message area with "No messages yet" text

### 7. Send a test message
- Type a message in the composer (e.g., "Hello from User A!")
- Press Enter or click Send button
- Verify message appears immediately (optimistic UI)
- Should show sending indicator, then confirmation

### 8. Log in as User B and verify conversation access
- Open new browser/incognito window
- Log in as User B at http://localhost:3002/auth?mode=login
- Navigate to `/messages`
- Verify the conversation with User A appears in the sidebar
- Click on the conversation to open it
- Verify the message from User A is visible

## API Endpoints to Test

### POST /api/messages/open
**Purpose**: Create or find existing conversation
**Parameters**:
- `participantIds`: Array of user IDs to include
- `title`: Optional title for group conversations

**Expected Response**:
```json
{
  "success": true,
  "conversationId": "uuid-string"
}
```

### GET /api/messages/{conversationId}
**Purpose**: Get conversation details and messages
**Parameters**:
- `cursor`: Optional pagination cursor (ISO timestamp)
- `limit`: Optional message limit (default: 50, max: 100)

**Expected Response**:
```json
{
  "conversation": {
    "id": "uuid",
    "title": null,
    "is_group": false,
    "participants": [...],
    "unread_count": 0
  },
  "messages": [...],
  "pagination": {
    "hasMore": false,
    "nextCursor": null,
    "count": 1
  }
}
```

### POST /api/messages/{conversationId}
**Purpose**: Send a message
**Parameters**:
- `content`: Message text (1-1000 chars)
- `messageType`: "text", "image", "file", or "system"

**Expected Response**:
```json
{
  "success": true,
  "id": "message-uuid"
}
```

### POST /api/messages/{conversationId}/read
**Purpose**: Mark conversation as read
**Expected Response**: 200 OK

## Real-time Features to Verify

### Message Delivery
- Messages should appear instantly via Supabase real-time subscriptions
- No page refresh required
- Unread counts should update automatically

### Read Receipts
- Messages should be marked as read when viewing conversation
- Unread badges should disappear

## Error Scenarios to Test

### 1. Conversation Access Denied
- Try accessing another user's private conversation
- Should show 403 error and "Access Denied" message

### 2. Conversation Not Found
- Try accessing non-existent conversation ID
- Should show 404 error and "Conversation not found" message

### 3. Network Errors
- Simulate offline/network issues
- Verify error messages and retry functionality

### 4. Authentication Required
- Try accessing messages without login
- Should redirect to login page

## Performance Expectations

- **Initial Load**: < 3 seconds
- **Message Send**: < 500ms optimistic UI, < 2 seconds confirmation
- **Real-time Delivery**: < 1 second
- **Search Results**: < 1 second (debounced)

## Browser Compatibility

Test on:
- Chrome/Chromium (primary)
- Firefox
- Safari
- Mobile browsers (iOS Safari, Chrome Mobile)

## Automated Testing

Run the existing test suite:
```bash
# Backend messaging tests
node scripts/test/test-messaging.mjs

# E2E Playwright tests
npx playwright test tests/e2e/messaging.spec.ts
npx playwright test tests/e2e/messages-send.spec.ts
```

## Debugging Tips

### Check API Logs
- Monitor browser Network tab for API calls
- Check server console for errors
- Verify Supabase real-time connections

### Database Verification
```sql
-- Check conversations
SELECT id, title, is_group, created_at FROM conversations;

-- Check messages
SELECT id, conversation_id, sender_id, content, created_at FROM messages;

-- Check participants
SELECT conversation_id, user_id, role, is_active FROM conversation_participants;
```

### Common Issues
1. **No conversations appear**: Check if users exist in database
2. **Messages not sending**: Verify authentication and conversation access
3. **Real-time not working**: Check Supabase connection and subscriptions
4. **403 errors**: Verify user is participant in conversation

---

## Testing Checklist

- [ ] Dev server starts successfully
- [ ] User authentication works
- [ ] Messages page loads
- [ ] New conversation modal opens
- [ ] User search works
- [ ] Conversation creation succeeds (API + UI)
- [ ] Message sending works
- [ ] Messages appear in both users' views
- [ ] Real-time updates work
- [ ] Read receipts update
- [ ] Error handling works
- [ ] Mobile responsiveness OK






