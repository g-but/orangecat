'use client';

import { useParams, useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useAuth';
import Loading from '@/components/Loading';
import { cn } from '@/lib/utils';
import { GRADIENTS } from '@/config/gradients';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ROUTES } from '@/config/routes';
import { useEditTaskForm } from './useEditTaskForm';
import { TaskFormFields } from '../../TaskFormFields';

export default function EditTaskPage() {
  const { user, isLoading: authLoading, hydrated } = useRequireAuth();
  const router = useRouter();
  const params = useParams();
  const taskId = params?.id as string;

  const {
    formData,
    tagInput,
    setTagInput,
    loading,
    submitting,
    errors,
    handleChange,
    handleEstimatedMinutesChange,
    handleAIPrefill,
    handleAddTag,
    handleRemoveTag,
    handleSubmit,
  } = useEditTaskForm(taskId, hydrated && !authLoading && !!user);

  if (authLoading || loading) {
    return <Loading fullScreen message="Loading task..." />;
  }

  if (!user || !formData) {
    return null;
  }

  return (
    <div className={cn(GRADIENTS.pageBg, 'min-h-screen p-4 sm:p-6 lg:p-8 pb-20 md:pb-8')}>
      <div className="max-w-2xl mx-auto">
        <Breadcrumb
          items={[
            { label: 'Tasks', href: ROUTES.DASHBOARD.TASKS },
            { label: formData.title || 'Task', href: `/dashboard/tasks/${taskId}` },
            { label: 'Edit' },
          ]}
          className="mb-6"
        />

        <div className="bg-surface-base rounded-lg border border-default overflow-hidden">
          <div className="p-6 border-b border-default">
            <h1 className="text-2xl font-bold text-fg-primary">Edit Task</h1>
            <p className="text-fg-secondary mt-1">Edit the details of this task</p>
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
            aiMode="edit"
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
          />
        </div>
      </div>
    </div>
  );
}
