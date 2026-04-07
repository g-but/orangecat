import type { LucideIcon } from 'lucide-react';

interface QuickStatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  color: 'gray' | 'blue' | 'amber' | 'green';
}

const colorClasses = {
  gray: 'bg-gray-50 text-gray-600 border-gray-200',
  blue: 'bg-blue-50 text-blue-600 border-blue-200',
  amber: 'bg-amber-50 text-amber-600 border-amber-200',
  green: 'bg-green-50 text-green-600 border-green-200',
};

export default function QuickStatCard({ icon: Icon, label, value, color }: QuickStatCardProps) {
  return (
    <div className={`rounded-xl border p-3 ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium truncate">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
