'use client';

/**
 * New Task Page
 *
 * Create a new task
 *
 * Created: 2026-02-05
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Loading from '@/components/Loading';
import Button from '@/components/ui/Button';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import {
  TASK_CATEGORIES,
  TASK_TYPES,
  PRIORITIES,
  TASK_CATEGORY_LABELS,
  TASK_TYPE_LABELS,
  PRIORITY_LABELS,
  TASK_DEFAULTS,
} from '@/config/tasks';
import { ArrowLeft, Save } from 'lucide-react';

type TaskCategory = (typeof TASK_CATEGORIES)[keyof typeof TASK_CATEGORIES];
type TaskType = (typeof TASK_TYPES)[keyof typeof TASK_TYPES];
type Priority = (typeof PRIORITIES)[keyof typeof PRIORITIES];

interface TaskFormData {
  title: string;
  description: string;
  instructions: string;
  task_type: TaskType;
  schedule_cron: string;
  schedule_human: string;
  category: TaskCategory;
  tags: string[];
  priority: Priority;
  estimated_minutes: number | '';
  project_id: string;
}

export default function NewTaskPage() {
  const { user, isLoading: authLoading, hydrated } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    instructions: '',
    task_type: TASK_DEFAULTS.task_type as TaskType,
    schedule_cron: '',
    schedule_human: '',
    category: TASK_DEFAULTS.category as TaskCategory,
    tags: [],
    priority: TASK_DEFAULTS.priority as Priority,
    estimated_minutes: '',
    project_id: '',
  });

  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (hydrated && !authLoading && !user) {
      router.push('/auth');
    }
  }, [user, hydrated, authLoading, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when field changes
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 10) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove),
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Titel ist erforderlich';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Titel darf maximal 200 Zeichen haben';
    }

    if (formData.description && formData.description.length > 2000) {
      newErrors.description = 'Beschreibung darf maximal 2000 Zeichen haben';
    }

    if (formData.instructions && formData.instructions.length > 5000) {
      newErrors.instructions = 'Anleitung darf maximal 5000 Zeichen haben';
    }

    if (
      formData.estimated_minutes &&
      (formData.estimated_minutes < 1 || formData.estimated_minutes > 480)
    ) {
      newErrors.estimated_minutes = 'Geschätzte Zeit muss zwischen 1 und 480 Minuten liegen';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Bitte korrigiere die Fehler im Formular');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          instructions: formData.instructions.trim() || null,
          task_type: formData.task_type,
          schedule_cron: formData.schedule_cron.trim() || null,
          schedule_human: formData.schedule_human.trim() || null,
          category: formData.category,
          tags: formData.tags,
          priority: formData.priority,
          estimated_minutes: formData.estimated_minutes || null,
          project_id: formData.project_id || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create task');
      }

      toast.success('Aufgabe erstellt!');
      router.push(`/dashboard/tasks/${data.data.task.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create task';
      logger.error('Failed to create task', { error: err }, 'NewTaskPage');
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!hydrated || authLoading) {
    return <Loading fullScreen message="Laden..." />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-tiffany-50/20 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button onClick={() => router.back()} variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Neue Aufgabe</h1>
            <p className="text-gray-600 mt-1">Erstelle eine neue Aufgabe für das Team</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titel <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="z.B. Küche reinigen"
                className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tiffany-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            {/* Task Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aufgabentyp <span className="text-red-500">*</span>
              </label>
              <select
                name="task_type"
                value={formData.task_type}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tiffany-500"
              >
                {Object.entries(TASK_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {formData.task_type === TASK_TYPES.ONE_TIME &&
                  'Einmalige Aufgabe, wird nach Erledigung als abgeschlossen markiert'}
                {formData.task_type === TASK_TYPES.RECURRING_SCHEDULED &&
                  'Wiederkehrende Aufgabe mit festem Zeitplan'}
                {formData.task_type === TASK_TYPES.RECURRING_AS_NEEDED &&
                  'Wiederkehrende Aufgabe, wird nach Bedarf erledigt'}
              </p>
            </div>

            {/* Schedule (only for recurring_scheduled) */}
            {formData.task_type === TASK_TYPES.RECURRING_SCHEDULED && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zeitplan</label>
                <input
                  type="text"
                  name="schedule_human"
                  value={formData.schedule_human}
                  onChange={handleChange}
                  placeholder="z.B. Jeden Montag, Täglich um 9 Uhr"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tiffany-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Beschreibe wann diese Aufgabe erledigt werden sollte
                </p>
              </div>
            )}

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategorie <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tiffany-500"
              >
                {Object.entries(TASK_CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priorität</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tiffany-500"
              >
                {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Estimated Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Geschätzte Zeit (Minuten)
              </label>
              <input
                type="number"
                name="estimated_minutes"
                value={formData.estimated_minutes}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    estimated_minutes: e.target.value ? parseInt(e.target.value) : '',
                  }))
                }
                min={1}
                max={480}
                placeholder="z.B. 30"
                className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tiffany-500 ${
                  errors.estimated_minutes ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.estimated_minutes && (
                <p className="text-red-500 text-sm mt-1">{errors.estimated_minutes}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Was muss bei dieser Aufgabe gemacht werden?"
                className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tiffany-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Anleitung</label>
              <textarea
                name="instructions"
                value={formData.instructions}
                onChange={handleChange}
                rows={4}
                placeholder="Schritt-für-Schritt Anleitung (optional)"
                className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tiffany-500 ${
                  errors.instructions ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.instructions && (
                <p className="text-red-500 text-sm mt-1">{errors.instructions}</p>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Tag hinzufügen..."
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tiffany-500"
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  Hinzufügen
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Abbrechen
              </Button>
              <Button type="submit" isLoading={submitting}>
                <Save className="h-4 w-4 mr-2" />
                Aufgabe erstellen
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
