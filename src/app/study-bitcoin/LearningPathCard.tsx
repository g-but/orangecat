'use client';

import Link from 'next/link';
import { BookOpen, ChevronRight, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import type { LearningPath } from './config';

interface LearningPathCardProps {
  path: LearningPath;
}

const levelColors = {
  Beginner: 'bg-green-100 text-green-700',
  Intermediate: 'bg-yellow-100 text-yellow-700',
  Advanced: 'bg-red-100 text-red-700',
} as const;

export function LearningPathCard({ path }: LearningPathCardProps) {
  const Icon = path.icon;

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 relative overflow-hidden">
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${path.bgColor.replace('bg-', 'bg-gradient-to-r from-').replace('-50', '-400 to-').replace('bg-gradient-to-r from-', 'bg-gradient-to-r from-').concat('-600')}`}
      />

      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 ${path.bgColor} rounded-xl flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${path.color}`} />
          </div>
          <div className="flex flex-col items-end gap-2">
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${levelColors[path.level]}`}
            >
              {path.level}
            </span>
            {path.status === 'coming-soon' && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                Coming Soon
              </span>
            )}
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
          {path.title}
        </h3>
        <p className="text-gray-600 mb-4 leading-relaxed">{path.description}</p>

        <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {path.duration}
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            {path.lessons} lessons
          </div>
        </div>

        <Link
          href={path.status === 'available' ? path.href : '#'}
          className={`inline-flex items-center justify-center w-full px-4 py-2 rounded-lg font-medium transition-colors ${
            path.status === 'available'
              ? 'bg-orange-600 text-white hover:bg-orange-700'
              : 'bg-gray-100 text-gray-500 cursor-not-allowed'
          }`}
          {...(path.status === 'coming-soon' ? { 'aria-disabled': true } : {})}
        >
          {path.status === 'available' ? 'Start Learning' : 'Learn More'}
          {path.status === 'available' && <ChevronRight className="w-4 h-4 ml-2" />}
        </Link>
      </CardContent>
    </Card>
  );
}
