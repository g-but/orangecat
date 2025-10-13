#!/usr/bin/env bash
set -euo pipefail

# Model Selection Helper for Orange Cat
TASK="${1:-}"

echo "🐱 Orange Cat AI Model Selector"
echo "==============================="

if [[ -z "$TASK" ]]; then
    echo "Usage: $0 \"task description\""
    echo ""
    echo "Examples:"
    echo "  $0 \"implement ML behavior model\""
    echo "  $0 \"build React dashboard\""
    echo "  $0 \"fix TypeScript errors\""
    echo ""
    exit 1
fi

TASK_LOWER=$(echo "$TASK" | tr '[:upper:]' '[:lower:]')

if [[ "$TASK_LOWER" =~ (ml|model|ai|algorithm|architecture|complex) ]]; then
    echo "🧠 RECOMMENDED: Code-Supernova-1-Million"
    echo "   Why: 1M context perfect for complex ML architecture"
elif [[ "$TASK_LOWER" =~ (typescript|node|api|backend|database) ]]; then
    echo "🔧 RECOMMENDED: Claude Code"
    echo "   Why: Strong TypeScript/Node.js expertise"
elif [[ "$TASK_LOWER" =~ (react|frontend|ui|dashboard|component) ]]; then
    echo "🎨 RECOMMENDED: Latest GPT or Claude Code"
    echo "   Why: Strong React/frontend capabilities"
elif [[ "$TASK_LOWER" =~ (quick|fix|research|latest) ]]; then
    echo "⚡ RECOMMENDED: Grok Code"
    echo "   Why: Real-time knowledge and quick fixes"
else
    echo "🤔 RECOMMENDED: Code-Supernova-1-Million (default)"
    echo "   Why: Handles diverse tasks with large context"
fi

echo ""
echo "🚀 Next: Select model in Cursor and use Apply feature"
