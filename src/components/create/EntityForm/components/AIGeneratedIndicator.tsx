/**
 * AI GENERATED INDICATOR
 * Badge showing that a field was AI-generated
 */

interface AIGeneratedIndicatorProps {
  confidence: number;
}

export function AIGeneratedIndicator({ confidence }: AIGeneratedIndicatorProps) {
  return (
    <div className="absolute -top-1 -right-1 z-10">
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full border border-purple-200"
        title={`AI generated (${Math.round(confidence * 100)}% confidence)`}
      >
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L10 6.477V16h2a1 1 0 110 2H8a1 1 0 110-2h2V6.477l-3.763 1.105 1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.616a1 1 0 01.894-1.79l1.599.8L9 4.323V3a1 1 0 011-1z" />
        </svg>
        AI
      </span>
    </div>
  );
}
