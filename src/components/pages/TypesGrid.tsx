'use client';

import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

interface Type {
  name: string;
  icon: LucideIcon;
  description: string;
  example: string;
  color: string;
}

interface TypesGridProps {
  title: string;
  subtitle: string;
  types: Type[];
}

export default function TypesGrid({ title, subtitle, types }: TypesGridProps) {
  return (
    <div>
      <div className="text-center mb-10">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">{title}</h2>
        <p className="text-lg text-gray-600">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {types.map((type, index) => (
          <Card
            key={index}
            className={`hover:shadow-lg transition-all duration-300 border-2 ${type.color}`}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-xl ${type.color.replace('text-', 'bg-').replace('border-', 'bg-').replace('-700', '-100')}`}
                >
                  <type.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{type.name}</h3>
                  <p className="text-gray-600 text-sm mb-2">{type.description}</p>
                  <div className="text-xs text-gray-500 italic">Example: {type.example}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
