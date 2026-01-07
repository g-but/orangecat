#!/bin/bash
# .claude/commands/db-check.sh
# Verify database health using MCP Supabase tools

echo "🗄️  Database Health Check"
echo "========================"

echo ""
echo "Use these MCP commands:"
echo ""
echo "1. List all tables:"
echo "   mcp_supabase_list_tables({ schemas: ['public'] })"
echo ""
echo "2. Check migrations:"
echo "   mcp_supabase_list_migrations()"
echo ""
echo "3. Security advisors:"
echo "   mcp_supabase_get_advisors({ type: 'security' })"
echo ""
echo "4. Performance advisors:"
echo "   mcp_supabase_get_advisors({ type: 'performance' })"
echo ""
echo "5. Check RLS policies:"
echo "   mcp_supabase_execute_sql({ "
echo "     query: 'SELECT * FROM pg_policies WHERE tablename LIKE \\'user_%\\';'"
echo "   })"
echo ""
echo "========================"
