'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Loading from '@/components/Loading';
import EntityListPage from '@/components/entities/EntityListPage';
import { Target, Trash2 } from 'lucide-react';
import { useProjectStore, Project } from '@/stores/projectStore';
import Button from '@/components/ui/Button';

export default function ProjectsDashboardPage() {
  const { user, isLoading, hydrated, session } = useAuth();
  const router = useRouter();
  const { projects, loadProjects, deleteProject } = useProjectStore();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Load projects when user is available (hook must be called before any returns)
  useEffect(() => {
    if (user?.id) {
      loadProjects(user.id);
    }
  }, [user?.id, loadProjects]);

  // Memoize items (hook must be called before any returns)
  const items = useMemo(() => projects, [projects]);

  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) {
      return;
    }

    setDeletingId(projectToDelete.id);
    try {
      await deleteProject(projectToDelete.id);
      setShowDeleteConfirm(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Failed to delete project. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setProjectToDelete(null);
  };

  // Handle loading states
  if (!hydrated || isLoading) {
    return <Loading fullScreen />;
  }

  // Handle unauthenticated state
  if (!user || !session) {
    router.push('/auth?from=projects');
    return <Loading fullScreen />;
  }

  return (
    <>
      <EntityListPage<Project>
        title="Projects"
        description="Manage your Bitcoin projects and initiatives."
        icon={<Target className="w-5 h-5" />}
        primaryHref="/projects/create"
        primaryLabel="Create New Project"
        secondaryHref="/discover?section=projects"
        secondaryLabel="Browse Existing Projects"
        items={items}
        emptyTitle="No projects yet"
        emptyDescription="Create your first project to start accepting Bitcoin donations and building support for your cause."
        explanation="A project is any initiative, cause, or endeavor that needs funding. From personal projects to organizations and community efforts - accept Bitcoin donations directly to your wallet."
        examples={[
          {
            title: 'Community Garden Project',
            description:
              'Creating a shared community space with raised garden beds and educational workshops.',
          },
          {
            title: 'Local Animal Shelter',
            description:
              'Supporting animal rescue operations and veterinary care for abandoned pets.',
          },
          {
            title: 'Art Exhibition Fundraiser',
            description:
              'Organizing a traveling art show featuring local artists and cultural exhibits.',
          },
        ]}
        renderItem={c => (
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{c.title || 'Untitled Project'}</h3>
                {c.description ? (
                  <p className="text-sm text-gray-600 line-clamp-2">{c.description}</p>
                ) : null}
              </div>
              <div className="flex items-start gap-2">
                <span
                  className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${c.isActive ? 'bg-green-100 text-green-700' : c.isDraft ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'}`}
                >
                  {c.isActive ? 'Active' : c.isDraft ? 'Draft' : 'Completed'}
                </span>
                <button
                  onClick={() => handleDeleteClick(c)}
                  disabled={deletingId === c.id}
                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                  title="Delete project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-700">
              <span>
                {(c.total_funding || 0) > 0
                  ? `${c.total_funding || 0} sats raised`
                  : 'No funds raised yet'}
                {c.goal_amount ? ` of ${c.goal_amount} sats` : ''}
              </span>
            </div>
            <div className="pt-2 flex gap-2">
              {c.isActive ? (
                <Button href={`/project/${c.id}`} size="sm" variant="outline">
                  View
                </Button>
              ) : (
                <Button href={`/projects/create?edit=${c.id}`} size="sm" variant="outline">
                  Edit
                </Button>
              )}
            </div>
          </div>
        )}
      />

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && projectToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Project</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete "{projectToDelete.title || 'Untitled Project'}"? This
              action cannot be undone.
            </p>
            {projectToDelete.total_funding && projectToDelete.total_funding > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Warning:</strong> This project has raised {projectToDelete.total_funding}{' '}
                  sats. Make sure you have handled all donations appropriately.
                </p>
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <Button
                onClick={handleDeleteCancel}
                variant="outline"
                disabled={deletingId === projectToDelete.id}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                variant="primary"
                disabled={deletingId === projectToDelete.id}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deletingId === projectToDelete.id ? 'Deleting...' : 'Delete Project'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
