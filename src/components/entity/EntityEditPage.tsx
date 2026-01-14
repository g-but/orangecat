'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EntityMetadata } from '@/config/entity-registry';

interface EntityEditPageProps<T = any> {
  entity: T;
  config: EntityMetadata;
  backUrl: string;
  successUrl: string;
  children: ReactNode;
  title?: string;
  description?: string;
}

export function EntityEditPage<T = any>({
  entity,
  config,
  backUrl,
  successUrl,
  children,
  title,
  description,
}: EntityEditPageProps<T>) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Link href={backUrl}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {config.name}
          </Button>
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {title || `Edit ${config.name}`}
          </h1>
          <p className="text-lg text-gray-600">
            {description || `Update your ${config.name.toLowerCase()} information`}
          </p>
        </div>
      </div>

      {/* Form Content */}
      {children}
    </div>
  );
}
