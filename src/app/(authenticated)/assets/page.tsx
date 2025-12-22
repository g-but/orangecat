'use client';

import { useEffect, useMemo, useState } from 'react';
import { Briefcase } from 'lucide-react';
import EntityListShell from '@/components/entity/EntityListShell';
import CommerceList from '@/components/commerce/CommerceList';
import CommercePagination from '@/components/commerce/CommercePagination';
import Button from '@/components/ui/Button';

type AssetItem = {
  id: string;
  title: string;
  type: string;
  estimated_value: number | null;
  currency: string;
  verification_status: string;
  created_at?: string;
};

export default function AssetsPage() {
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [total, setTotal] = useState(0);
  const offset = useMemo(() => (page - 1) * limit, [page, limit]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/assets?limit=${limit}&offset=${offset}`, {
          credentials: 'include',
        });
        const json = await res.json();
        if (!cancelled) {
          setAssets(json.data || []);
          setTotal(json.metadata?.total || 0);
        }
      } catch (e) {
        if (!cancelled) {
          setError('Failed to load assets');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [limit, offset]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this asset? This cannot be undone.')) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/assets/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) {
        throw new Error('Failed to delete asset');
      }
      setAssets(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      alert('Could not delete asset. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const headerActions = <Button href="/assets/create">Create Asset</Button>;

  return (
    <EntityListShell
      title="Assets"
      description="List and manage your non‑Bitcoin assets. Use them as collateral for loans."
      headerActions={headerActions}
    >
      {loading ? (
        <div className="rounded-xl border bg-white p-6">Loading…</div>
      ) : error ? (
        <div className="rounded-xl border bg-white p-6 text-red-600">{error}</div>
      ) : (
        <>
          <CommerceList
            items={assets as any}
            makeHref={(a: any) => `/assets/${a.id}`}
            makeBadge={(a: any) => a.type?.replace('_', ' ')}
            makePriceLabel={(a: any) =>
              a.estimated_value ? `${a.estimated_value} ${a.currency}` : undefined
            }
          />
          <CommercePagination page={page} limit={limit} total={total} onPageChange={setPage} />
        </>
      )}
    </EntityListShell>
  );
}
