'use client';

import { useSearchParams } from 'next/navigation';
import { EntityForm } from '@/components/create/EntityForm';
import { projectConfig } from '@/config/entity-configs';
import { ProjectData } from '@/lib/validation';
import { supabase } from '@/services/supabase/core/client';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { ProjectTemplates } from '@/components/create/templates/ProjectTemplates';
import { useState } from 'react';
import type { ProjectTemplate } from '@/components/create/templates/ProjectTemplates';

export default function CreateProjectPage() {
  const searchParams = useSearchParams();
  const isEditMode = !!(searchParams.get('edit') || searchParams.get('draft'));
  const { user, session } = useAuth();
  const router = useRouter();
  const [initialValues, setInitialValues] = useState<Partial<ProjectData>>({});

  const handleTemplateSelect = (template: ProjectTemplate) => {
    setInitialValues(template.data);
  };

  const handleSuccess = (data: ProjectData & { id: string }) => {
    router.push(`/projects/${data.id}`);
  };

  const handleSubmit = async (data: ProjectData) => {
    if (!user || !session) {
      throw new Error('You must be logged in to create a project');
    }

    // Transform form data to match database schema
    const dbData = {
      title: data.title,
      description: data.description,
      goal_amount: data.goal_amount || null,
      currency: data.currency || 'SATS',
      funding_purpose: data.funding_purpose || null,
      bitcoin_address: data.bitcoin_address || null,
      lightning_address: data.lightning_address || null,
      website_url: data.website_url || null,
      category: data.category || null,
      tags: data.tags || [],
      start_date: data.start_date || null,
      target_completion: data.target_completion || null,
      status: 'draft',
      created_by: session.user.id,
    };

    const { data: projectData, error } = await supabase
      .from('projects')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Failed to create project');
    }

    return { ...projectData, ...data };
  };

  if (isEditMode) {
    // For now, redirect edit mode to a different flow
    // TODO: Implement edit mode with EntityForm
    router.push('/dashboard/projects');
    return null;
  }

  return (
    <div className="space-y-10">
      <EntityForm
        config={projectConfig}
        initialValues={initialValues}
        onSuccess={handleSuccess}
        onSubmit={handleSubmit}
      />
      <ProjectTemplates onSelectTemplate={handleTemplateSelect} />
    </div>
  );
}