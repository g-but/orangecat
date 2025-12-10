-- =====================================================
-- Messaging Permissions Grants
-- Ensures views and functions are callable by authenticated users.
--
-- created_date: 2025-12-08
-- last_modified_date: 2025-12-08
-- last_modified_summary: Initial grants for messaging views/functions
-- =====================================================

GRANT SELECT ON conversation_details TO authenticated;
GRANT SELECT ON message_details TO authenticated;

-- Functions added in recent migrations
GRANT EXECUTE ON FUNCTION get_user_conversations(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION create_group_conversation(uuid, uuid[], text) TO authenticated;

-- Keep privileges explicit for clarity
COMMENT ON RULE "_RETURN" ON conversation_details IS 'View select allowed for authenticated role';
COMMENT ON VIEW conversation_details IS 'Returns conversations for current user (granted to authenticated)';
COMMENT ON VIEW message_details IS 'Returns messages with sender info and read status (granted to authenticated)';









