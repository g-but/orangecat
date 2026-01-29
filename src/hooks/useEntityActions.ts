import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export function useEntityActions(entityType: string) {
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const router = useRouter();

  const deleteEntity = async (id: string) => {
    setDeletingIds(prev => new Set(prev).add(id));

    try {
      const response = await fetch(`/api/${entityType}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      toast.success(
        `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} deleted successfully`
      );
      router.refresh();
    } catch (error) {
      logger.error('Delete error', error, 'Entity');
      toast.error(`Failed to delete ${entityType}`);
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const isDeleting = (id: string) => deletingIds.has(id);

  return {
    deleteEntity,
    isDeleting,
  };
}
