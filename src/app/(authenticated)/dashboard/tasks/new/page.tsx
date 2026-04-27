'use client';

import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useAuth';
import Loading from '@/components/Loading';
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-tiffany-50/20 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
      <div className="max-w-2xl mx-auto">
        <Breadcrumb
          items={[{ label: 'Tasks', href: ROUTES.DASHBOARD.TASKS }, { label: 'Create Task' }]}
          className="mb-6"
        />

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Create Task</h1>
            <p className="text-base text-gray-600 mt-1">Create a new task for the team</p>
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
            showTaskTypeHint
            submitLabel="Create Task"
          />
        </div>
      </div>
    </div>
  );
}
