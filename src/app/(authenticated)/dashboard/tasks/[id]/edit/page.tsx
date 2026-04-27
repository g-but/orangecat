'use client';

import { useParams, useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useAuth';
import Loading from '@/components/Loading';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ROUTES } from '@/config/routes';
import { useEditTaskForm } from './useEditTaskForm';
import { TaskFormFields } from './TaskFormFields';

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
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-tiffany-50/20 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
      <div className="max-w-2xl mx-auto">
        <Breadcrumb
          items={[
            { label: 'Tasks', href: ROUTES.DASHBOARD.TASKS },
            { label: formData.title || 'Task', href: `/dashboard/tasks/${taskId}` },
            { label: 'Edit' },
          ]}
          className="mb-6"
        />

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Edit Task</h1>
            <p className="text-gray-600 mt-1">Edit the details of this task</p>
          </div>

          <TaskFormFields
            formData={formData}
            tagInput={tagInput}
            setTagInput={setTagInput}
            errors={errors}
            submitting={submitting}
            onChange={handleChange}
            onEstimatedMinutesChange={handleEstimatedMinutesChange}
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
