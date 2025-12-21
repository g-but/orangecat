# Real-Time Connection "Reconnecting" Fix

**Date:** 2025-01-22  
**Issue:** Connection status indicator stuck showing "Reconnecting..."  
**Status:** ✅ Fixed

---

## Problem

The `ConnectionStatusIndicator` component was showing "Reconnecting..." indefinitely, even when the connection might have been working. This was caused by:

1. **No timeout detection**: If the subscription never completed, it would stay in 'reconnecting' state forever
2. **Missing intermediate status handling**: Statuses like 'JOINING' weren't being logged
3. **Insufficient logging**: Hard to debug what was happening

---

## Root Cause

The `useRealtimeConnection` hook creates a monitoring channel that:
- Uses presence to keep connection alive
- Monitors connection status
- Should transition from 'reconnecting' → 'connected' when subscription succeeds

**Issue:** If the subscription callback never received 'SUBSCRIBED' status (or received it but it wasn't handled), the status would remain 'reconnecting' indefinitely.

---

## Solution

### 1. Added Subscription Timeout

Added a 10-second timeout to detect if subscription never completes:

```typescript
const subscriptionTimeout = setTimeout(() => {
  if (!isMountedRef.current) return;
  const channelState = channelRef.current?.state;
  if (channelState !== 'joined' && channelState !== 'joining') {
    debugLog('[useRealtimeConnection] Subscription timeout - channel state:', channelState);
    updateStatus('error', new Error('Subscription timeout - connection failed'));
    stopHeartbeat();
    attemptReconnect();
  }
}, 10000); // 10 second timeout
```

### 2. Enhanced Logging

Added debug logging for:
- Subscription status changes
- Channel state in heartbeat
- Intermediate statuses (JOINING, etc.)
- Presence tracking success/failure

### 3. Better Error Handling

- Clear timeout on any status change
- Handle intermediate statuses (not just SUBSCRIBED/ERROR)
- Don't fail connection if presence tracking fails

### 4. Fixed Callback Dependencies

Fixed `startHeartbeat` callback to include proper dependencies (`updateStatus`, `attemptReconnect`).

---

## Changes Made

**File:** `src/hooks/useRealtimeConnection.ts`

1. Added subscription timeout (10 seconds)
2. Enhanced debug logging
3. Handle intermediate subscription statuses
4. Fixed heartbeat callback dependencies
5. Better error messages

---

## Testing

To verify the fix works:

1. **Open browser console** - You should see debug logs:
   ```
   [Messaging] [useRealtimeConnection] Subscription status: SUBSCRIBED
   [Messaging] [useRealtimeConnection] Presence tracked successfully
   ```

2. **Check connection status**:
   - Should show "Connected" briefly, then hide (when connected)
   - Should show "Reconnecting..." only when actually reconnecting
   - Should show "Connection Error" if timeout occurs

3. **Test reconnection**:
   - Disable network → Should show "Disconnected"
   - Re-enable network → Should reconnect and show "Connected"

---

## Debugging

If you still see "Reconnecting...":

1. **Check browser console** for debug logs
2. **Check Supabase Realtime status**:
   - Verify migration `20250121000000_enable_realtime_for_messaging.sql` was applied
   - Verify tables are in `supabase_realtime` publication
3. **Check environment variables**:
   - `NEXT_PUBLIC_SUPABASE_URL` is set correctly
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is set
4. **Check network tab** - Look for WebSocket connections to Supabase

---

## Next Steps

If the issue persists:

1. **Verify database migration** was applied:
   ```sql
   SELECT schemaname, tablename 
   FROM pg_publication_tables 
   WHERE pubname = 'supabase_realtime' 
   AND tablename IN ('messages', 'conversations', 'conversation_participants');
   ```

2. **Check Supabase dashboard**:
   - Go to Database → Replication
   - Verify tables are enabled for Realtime

3. **Test actual message subscriptions**:
   - The connection monitor might fail, but message subscriptions might still work
   - Check if messages appear in real-time (even if indicator shows "Reconnecting")

---

## Notes

- The connection monitor is separate from actual message subscriptions
- Message subscriptions might work even if connection monitor fails
- The indicator is primarily for user feedback, not critical functionality

---

*Generated: 2025-01-22*

