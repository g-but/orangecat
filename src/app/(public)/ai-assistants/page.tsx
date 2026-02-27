'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ROUTES } from '@/config/routes';
import {
  Bot,
  Star,
  MessageSquare,
  Search,
  Filter,
  Loader2,
  ChevronDown,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Button from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { logger } from '@/utils/logger';

interface AIAssistant {
  id: string;
  title: string;
  description?: string | null;
  avatar_url?: string | null;
  category?: string | null;
  pricing_model: string;
  price_per_message?: number | null;
  free_messages_per_day?: number | null;
  average_rating?: number | null;
  total_ratings?: number | null;
  total_conversations?: number | null;
  user?: {
    username?: string;
    name?: string;
    avatar_url?: string;
  };
}

const CATEGORIES = [
  'All Categories',
  'General',
  'Education',
  'Creative',
  'Business',
  'Technology',
  'Healthcare & Medical',
  'Legal',
  'Productivity',
  'Entertainment',
];

const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'recent', label: 'Recently Added' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
];

function formatPrice(assistant: AIAssistant): string {
  if (assistant.pricing_model === 'free') {
    return 'Free';
  }
  if (assistant.free_messages_per_day && assistant.free_messages_per_day > 0) {
    return `${assistant.free_messages_per_day} free/day`;
  }
  if (assistant.price_per_message) {
    return `${assistant.price_per_message?.toFixed(8) || '0'} BTC/msg`;
  }
  return 'Paid';
}

function AssistantCard({ assistant }: { assistant: AIAssistant }) {
  return (
    <Link
      href={`/ai-chat/${assistant.id}`}
      className="block bg-white rounded-xl border border-gray-200 hover:border-sky-300 hover:shadow-md transition-all p-6"
    >
      <div className="flex items-start gap-4">
        <Avatar className="h-14 w-14 flex-shrink-0">
          <AvatarImage src={assistant.avatar_url || undefined} />
          <AvatarFallback className="bg-purple-100 text-purple-600">
            <Bot className="h-8 w-8" />
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{assistant.title}</h3>

          {assistant.category && (
            <span className="inline-block text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded mt-1">
              {assistant.category}
            </span>
          )}

          {assistant.description && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{assistant.description}</p>
          )}

          <div className="flex items-center gap-4 mt-3 text-sm">
            {assistant.average_rating !== null &&
              assistant.average_rating !== undefined &&
              assistant.average_rating > 0 && (
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="font-medium">{assistant.average_rating.toFixed(1)}</span>
                  {assistant.total_ratings && assistant.total_ratings > 0 && (
                    <span className="text-gray-400">({assistant.total_ratings})</span>
                  )}
                </div>
              )}

            {assistant.total_conversations !== null &&
              assistant.total_conversations !== undefined &&
              assistant.total_conversations > 0 && (
                <div className="flex items-center gap-1 text-gray-500">
                  <MessageSquare className="h-4 w-4" />
                  <span>{assistant.total_conversations.toLocaleString()}</span>
                </div>
              )}

            <div className="flex items-center gap-1 text-green-600 font-medium">
              <Zap className="h-4 w-4" />
              <span>{formatPrice(assistant)}</span>
            </div>
          </div>

          {assistant.user?.username && (
            <p className="text-xs text-gray-400 mt-2">by @{assistant.user.username}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function AIAssistantsDiscoveryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [assistants, setAssistants] = useState<AIAssistant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('q') || '');
  const [category, setCategory] = useState(searchParams?.get('category') || 'All Categories');
  const [sortBy, setSortBy] = useState(searchParams?.get('sort') || 'popular');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const loadAssistants = useCallback(
    async (resetPage = false) => {
      setIsLoading(true);
      try {
        const currentPage = resetPage ? 1 : page;
        const params = new URLSearchParams();

        if (searchQuery) {
          params.set('q', searchQuery);
        }
        if (category && category !== 'All Categories') {
          params.set('category', category);
        }
        params.set('sort', sortBy);
        params.set('page', currentPage.toString());
        params.set('limit', '20');

        const response = await fetch(`/api/ai-assistants?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
          if (resetPage) {
            setAssistants(data.data || []);
            setPage(1);
          } else {
            setAssistants(prev => (currentPage === 1 ? data.data : [...prev, ...data.data]));
          }
          setTotalCount(data.pagination?.total || 0);
          setHasMore((data.data?.length || 0) === 20);
        }
      } catch (error) {
        logger.error('Error loading assistants', error, 'AI');
      } finally {
        setIsLoading(false);
      }
    },
    [searchQuery, category, sortBy, page]
  );

  useEffect(() => {
    loadAssistants(true);
  }, [searchQuery, category, sortBy]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) {
      params.set('q', searchQuery);
    }
    if (category !== 'All Categories') {
      params.set('category', category);
    }
    params.set('sort', sortBy);
    router.push(`/ai-assistants?${params.toString()}`);
  };

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    const params = new URLSearchParams();
    if (searchQuery) {
      params.set('q', searchQuery);
    }
    if (newCategory !== 'All Categories') {
      params.set('category', newCategory);
    }
    params.set('sort', sortBy);
    router.push(`/ai-assistants?${params.toString()}`);
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    const params = new URLSearchParams();
    if (searchQuery) {
      params.set('q', searchQuery);
    }
    if (category !== 'All Categories') {
      params.set('category', category);
    }
    params.set('sort', newSort);
    router.push(`/ai-assistants?${params.toString()}`);
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
    loadAssistants(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <Bot className="h-8 w-8 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Assistants</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover AI assistants created by the community. Chat with experts in various fields,
              get help with tasks, or just have a conversation.
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row gap-4 max-w-3xl mx-auto">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search assistants..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
            </form>

            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    {category === 'All Categories' ? 'Category' : category}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {CATEGORIES.map(cat => (
                    <DropdownMenuItem
                      key={cat}
                      onClick={() => handleCategoryChange(cat)}
                      className={category === cat ? 'bg-gray-100' : ''}
                    >
                      {cat}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <TrendingUp className="h-4 w-4" />
                    {SORT_OPTIONS.find(s => s.value === sortBy)?.label || 'Sort'}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {SORT_OPTIONS.map(option => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => handleSortChange(option.value)}
                      className={sortBy === option.value ? 'bg-gray-100' : ''}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {totalCount > 0 && (
          <p className="text-sm text-gray-500 mb-4">
            {totalCount} assistant{totalCount !== 1 ? 's' : ''} found
          </p>
        )}

        {isLoading && assistants.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : assistants.length === 0 ? (
          <div className="text-center py-20">
            <Bot className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No assistants found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || category !== 'All Categories'
                ? 'Try adjusting your search or filters'
                : 'Be the first to create an AI assistant!'}
            </p>
            <Link href={ROUTES.DASHBOARD.AI_ASSISTANTS_CREATE}>
              <Button>Create Assistant</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assistants.map(assistant => (
                <AssistantCard key={assistant.id} assistant={assistant} />
              ))}
            </div>

            {hasMore && (
              <div className="text-center mt-8">
                <Button variant="outline" onClick={loadMore} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
