import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const config = {
  good: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
  moderate: { color: 'bg-amber-100 text-amber-700', icon: Clock },
  needs_attention: { color: 'bg-red-100 text-red-700', icon: AlertTriangle },
} as const;

interface FairnessIndicatorProps {
  level: keyof typeof config;
}

export function FairnessIndicator({ level }: FairnessIndicatorProps) {
  const { color, icon: Icon } = config[level];
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
      <Icon className="h-5 w-5" />
    </div>
  );
}
