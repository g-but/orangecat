/**
 * FORM HEADER COMPONENT
 * Renders back link and page title
 */

import Link from 'next/link';
import { ArrowLeft, LucideIcon } from 'lucide-react';

interface FormHeaderProps {
  icon: LucideIcon;
  colorTheme: string;
  name: string;
  namePlural: string;
  pageDescription: string;
  backUrl: string;
  mode: 'create' | 'edit';
}

export function FormHeader({
  icon: Icon,
  colorTheme,
  name,
  namePlural,
  pageDescription,
  backUrl,
  mode,
}: FormHeaderProps) {
  return (
    <div className="mb-6">
      <Link
        href={backUrl}
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to {namePlural}
      </Link>
      <div className="flex items-center gap-3">
        <Icon className={`w-8 h-8 text-${colorTheme}-600`} />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {mode === 'create' ? 'Create' : 'Edit'} {name}
          </h1>
          <p className="text-gray-600 mt-1">{pageDescription}</p>
        </div>
      </div>
    </div>
  );
}
