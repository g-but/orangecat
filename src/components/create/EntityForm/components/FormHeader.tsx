/**
 * FORM HEADER COMPONENT
 * Renders back link and page title
 */

import { type LucideIcon } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

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
      <Breadcrumb
        items={[
          { label: namePlural, href: backUrl },
          { label: `${mode === 'create' ? 'Create' : 'Edit'} ${name}` },
        ]}
        className="mb-4"
      />
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
