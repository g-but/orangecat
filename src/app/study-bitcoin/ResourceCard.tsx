'use client';

import Link from 'next/link';
import { ExternalLink, ArrowRight, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import type { Resource } from './config';

interface ResourceCardProps {
  resource: Resource;
  featured?: boolean;
}

export function ResourceCard({ resource, featured = false }: ResourceCardProps) {
  const Icon = resource.icon;
  const externalProps = resource.external ? { target: '_blank', rel: 'noopener noreferrer' } : {};

  if (featured) {
    return (
      <Card className="group hover:shadow-lg transition-all duration-200 border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
        <CardContent className="p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
              <Icon className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                {resource.title}
              </h3>
              <p className="text-gray-600 mb-4 leading-relaxed">{resource.description}</p>
              <Link
                href={resource.href}
                className="inline-flex items-center text-orange-600 font-medium hover:text-orange-700 transition-colors"
                {...externalProps}
              >
                Get Started
                {resource.external ? (
                  <ExternalLink className="w-4 h-4 ml-2" />
                ) : (
                  <ArrowRight className="w-4 h-4 ml-2" />
                )}
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group hover:shadow-md transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-orange-100 transition-colors">
            <Icon className="w-5 h-5 text-gray-600 group-hover:text-orange-600 transition-colors" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-orange-600 transition-colors">
              {resource.title}
            </h3>
            <p className="text-sm text-gray-600 mb-3 leading-relaxed">{resource.description}</p>
            <Link
              href={resource.href}
              className="inline-flex items-center text-sm text-orange-600 font-medium hover:text-orange-700 transition-colors"
              {...externalProps}
            >
              {resource.type === 'external' ? 'Visit' : 'Read'}
              {resource.external ? (
                <ExternalLink className="w-3 h-3 ml-1" />
              ) : (
                <ChevronRight className="w-3 h-3 ml-1" />
              )}
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
