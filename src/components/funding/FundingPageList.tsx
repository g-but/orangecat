'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Plus, Share2, Users, Edit2, Trash2, Eye, EyeOff, Bitcoin as BitcoinIcon } from 'lucide-react'
import supabase from '@/services/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { fetchBitcoinWalletData } from '@/services/bitcoin'
import Link from 'next/link'

interface PageData {
  id: string;
  title: string;
  description: string;
  bitcoin_address: string;
  is_active: boolean;
  is_public: boolean;
  total_funding: number;
  contributor_count: number;
  created_at: string;
  updated_at: string;
  current_balance?: number;
  user_id?: string;
}

export default function FundingPageList() {
  const router = useRouter()
  const { user } = useAuth()
  const [pages, setPages] = useState<PageData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPagesWithBalances = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data: fetchedPages, error: fetchError } = await supabase
        .from('funding_pages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      if (fetchedPages) {
        const pagesWithBalances = await Promise.all(
          fetchedPages.map(async (page: PageData) => {
            let balanceValue: number | undefined = undefined;
            if (page.bitcoin_address) {
              try {
                const walletData = await fetchBitcoinWalletData(page.bitcoin_address);
                balanceValue = walletData?.balance; 
              } catch (balanceError) {
                console.warn(`Failed to fetch balance for ${page.bitcoin_address}:`, balanceError);
              }
            }
            return { ...page, current_balance: balanceValue };
          })
        );
        setPages(pagesWithBalances);
      }

    } catch (err) {
      console.error('Error loading pages:', err);
      setError('Failed to load funding pages');
      toast.error('Failed to load funding pages');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadPagesWithBalances();
    }
  }, [user, loadPagesWithBalances]);

  const handleToggleStatus = async (pageId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('funding_pages')
        .update({ is_active: !isActive })
        .eq('id', pageId);
      if (error) throw error;
      setPages(pages.map(p => p.id === pageId ? { ...p, is_active: !isActive } : p));
      toast.success(`Page ${isActive ? 'deactivated' : 'activated'}`);
    } catch (err) {
      toast.error('Failed to update page status');
    }
  };

  const handleToggleVisibility = async (pageId: string, isPublic: boolean) => {
    try {
      const { error } = await supabase
        .from('funding_pages')
        .update({ is_public: !isPublic })
        .eq('id', pageId);
      if (error) throw error;
      setPages(pages.map(p => p.id === pageId ? { ...p, is_public: !isPublic } : p));
      toast.success(`Page visibility ${isPublic ? 'set to private' : 'set to public'}`);
    } catch (err) {
      toast.error('Failed to update page visibility');
    }
  };
  
  const handleDeletePage = async (pageId: string) => {
    if (!confirm('Are you sure you want to delete this page? This action cannot be undone.')) return;
    try {
      const { error } = await supabase.from('funding_pages').delete().eq('id', pageId);
      if (error) throw error;
      setPages(pages.filter(p => p.id !== pageId));
      toast.success('Page deleted successfully');
    } catch (err) {
      toast.error('Failed to delete page');
    }
  };

  if (loading && pages.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center text-red-500 p-4">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Your Funding Pages</h2>
        <Link href="/dashboard/pages/new">
          <Button>
            <Plus className="w-5 h-5 mr-2" />
            Create New Page
          </Button>
        </Link>
      </div>

      {pages.length === 0 && !loading ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No funding pages yet</h3>
          <p className="text-gray-500 mb-6">Create your first funding page to start accepting Bitcoin donations.</p>
          <Link href="/dashboard/pages/new">
            <Button>
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Page
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {pages.map((page) => (
            <Card key={page.id} className="p-6 hover:shadow-lg transition-shadow duration-200">
              <div className="flex flex-col sm:flex-row justify-between items-start mb-4">
                <div className="flex-grow">
                  <h3 className="text-xl font-semibold mb-1">{page.title}</h3>
                  <p className="text-sm text-gray-500 mb-1 break-all">{page.bitcoin_address}</p>
                   {page.current_balance !== undefined ? (
                    <p className="text-sm text-green-600 font-medium">
                      Live Balance: {page.current_balance.toFixed(8)} BTC
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400">Fetching balance...</p>
                  )}
                </div>
                <div className="flex items-center space-x-2 mt-3 sm:mt-0 flex-wrap">
                  <Button variant={page.is_active ? "outline" : "secondary"} size="sm" onClick={() => handleToggleStatus(page.id, page.is_active)} className="text-xs px-2 py-1">
                    {page.is_active ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />} {page.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button variant={page.is_public ? "outline" : "secondary"} size="sm" onClick={() => handleToggleVisibility(page.id, page.is_public)} className="text-xs px-2 py-1">
                    {page.is_public ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />} {page.is_public ? 'Make Private' : 'Make Public'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/pages/${page.id}/edit`)} className="text-xs px-2 py-1">
                    <Edit2 className="w-3 h-3 mr-1" /> Edit
                  </Button>
                   <Button variant="danger" size="sm" onClick={() => handleDeletePage(page.id)} className="text-xs px-2 py-1">
                    <Trash2 className="w-3 h-3 mr-1" /> Delete
                  </Button>
                  <Link href={`/fund-us/${page.id}`} passHref legacyBehavior>
                    <a target="_blank" rel="noopener noreferrer" className="inline-block">
                      <Button variant="ghost" size="sm" className="text-xs px-2 py-1">
                         <Share2 className="w-3 h-3 mr-1" /> View Public
                      </Button>
                    </a>
                  </Link>
                </div>
              </div>
              <p className="text-gray-600 mb-4 line-clamp-3">{page.description}</p>
              <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-4 mt-4">
                <div className="flex items-center">
                  <BitcoinIcon className="w-4 h-4 mr-1 text-yellow-500" /> 
                  <span>Total Confirmed (DB): {(page.total_funding || 0).toFixed(8)} BTC</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  <span>{page.contributor_count || 0} contributors</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 