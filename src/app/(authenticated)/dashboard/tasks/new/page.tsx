'use client';

import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useAuth';
import Loading from '@/components/Loading';
import { cn } from '@/lib/utils';
import { GRADIENTS } from '@/config/gradients';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ROUTES } from '@/config/routes';
import { TaskFormFields } from '../TaskFormFields';
import { useNewTaskForm } from './useNewTaskForm';

export default function NewTaskPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const router = useRouter();
  const {
    formData,
    tagInput,
    setTagInput,
    submitting,
    errors,
    handleChange,
    handleEstimatedMinutesChange,
    handleAIPrefill,
    handleAddTag,
    handleRemoveTag,
    handleSubmit,
  } = useNewTaskForm();

  if (authLoading) {
    return <Loading fullScreen message="Loading..." />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className={cn(GRADIENTS.pageBg, 'min-h-screen p-4 sm:p-6 lg:p-8 pb-20 md:pb-8')}>
      <div className="max-w-2xl mx-auto">
        <Breadcrumb
          items={[{ label: 'Tasks', href: ROUTES.DASHBOARD.TASKS }, { label: 'Create Task' }]}
          className="mb-6"
        />

        <div className="bg-surface-base rounded-lg border border-default overflow-hidden">
          <div className="p-6 border-b border-default">
            <h1 className="text-2xl font-bold text-fg-primary">Create Task</h1>
            <p className="text-base text-fg-secondary mt-1">Create a new task for the team</p>
          </div>

          <TaskFormFields
            formData={formData}
            tagInput={tagInput}
            setTagInput={setTagInput}
            errors={errors}
            submitting={submitting}
            onChange={handleChange}
            onEstimatedMinutesChange={handleEstimatedMinutesChange}
            onAIPrefill={handleAIPrefill}
            aiMode="create"
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
            showTaskTypeHint
            submitLabel="Create Task"
          />
        </div>
      </div>
    </div>
  );
}
