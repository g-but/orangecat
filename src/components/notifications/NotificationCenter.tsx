'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  X,
  Check,
  Bitcoin,
  Users,
  MessageSquare,
  Heart,
  AtSign,
  Settings,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import MessagePanel from '@/components/messaging/MessagePanel';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

// Map UI filter to API filter
type UIFilter = 'all' | 'unread' | 'payments' | 'social' | 'messages';

function getAPIFilter(uiFilter: UIFilter): 'all' | 'unread' | string {
  switch (uiFilter) {
    case 'payments':
      return 'payment'; // Filter by payment type
    case 'social':
      return 'follow'; // Filter by follow type (social)
    case 'messages':
      return 'message';
    default:
      return uiFilter;
  }
}

export default function NotificationCenter({
  isOpen,
  onClose,
  className = '',
}: NotificationCenterProps) {
  const router = useRouter();
  const [uiFilter, setUIFilter] = useState<UIFilter>('all');
  const [showMessages, setShowMessages] = useState(false);

  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    hasMore,
    loadMore,
    markAsRead,
    deleteNotification,
    clearRead,
    refresh,
  } = useNotifications({
    filter: getAPIFilter(uiFilter),
    limit: 20,
    realtime: true,
  });

  const getNotificationIcon = (notification: Notification) => {
    // If notification has a source actor with avatar, show avatar
    if (notification.source_actor?.avatar_url) {
      return (
        <Avatar className="h-8 w-8">
          <AvatarImage src={notification.source_actor.avatar_url} />
          <AvatarFallback>
            {notification.source_actor.display_name?.charAt(0) || '?'}
          </AvatarFallback>
        </Avatar>
      );
    }

    // Otherwise show type-based icon
    switch (notification.type) {
      case 'payment':
      case 'project_funded':
        return <Bitcoin className="w-5 h-5 text-bitcoin-orange" />;
      case 'follow':
        return <Users className="w-5 h-5 text-blue-500" />;
      case 'message':
        return <MessageSquare className="w-5 h-5 text-purple-500" />;
      case 'comment':
        return <MessageSquare className="w-5 h-5 text-green-500" />;
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'mention':
        return <AtSign className="w-5 h-5 text-tiffany" />;
      case 'system':
        return <Settings className="w-5 h-5 text-gray-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAsRead('all');
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await deleteNotification(id);
      toast.success('Notification deleted');
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  const handleClearRead = async () => {
    try {
      await clearRead();
      toast.success('Cleared read notifications');
    } catch {
      toast.error('Failed to clear notifications');
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await handleMarkAsRead(notification.id);
    }

    if (notification.type === 'message') {
      // Open message panel
      setShowMessages(true);
      onClose();
      return;
    }

    if (notification.action_url) {
      router.push(notification.action_url);
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-20">
      <Card className={`w-full max-w-md max-h-[80vh] flex flex-col ${className}`}>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex flex-col flex-1 overflow-hidden">
          {/* Error State */}
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 text-red-600 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error.message}</span>
              <Button variant="ghost" size="sm" onClick={refresh} className="ml-auto">
                Retry
              </Button>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
            {[
              { key: 'all', label: 'All' },
              { key: 'unread', label: 'Unread' },
              { key: 'payments', label: 'Payments' },
              { key: 'social', label: 'Social' },
              { key: 'messages', label: 'Messages' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setUIFilter(tab.key as UIFilter)}
                className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
                  uiFilter === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          {unreadCount > 0 && (
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-gray-600">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </span>
              <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
                <Check className="w-4 h-4 mr-1" />
                Mark all read
              </Button>
            </div>
          )}

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {isLoading && notifications.length === 0 ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-start gap-3 p-3 bg-gray-100 rounded-lg">
                      <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-300 rounded mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No notifications found</p>
                {uiFilter !== 'all' && (
                  <button
                    onClick={() => setUIFilter('all')}
                    className="text-tiffany text-sm mt-2 hover:underline"
                  >
                    View all notifications
                  </button>
                )}
              </div>
            ) : (
              <>
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`group relative p-3 rounded-lg border transition-colors cursor-pointer ${
                      notification.read
                        ? 'bg-white border-gray-200 hover:bg-gray-50'
                        : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </h4>
                            {notification.message && (
                              <p
                                className={`text-sm mt-1 ${
                                  notification.read ? 'text-gray-600' : 'text-gray-700'
                                }`}
                              >
                                {notification.message}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              {formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notification.read && (
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification.id);
                                }}
                                className="p-1 hover:bg-white rounded min-h-[44px] min-w-[44px] flex items-center justify-center"
                                title="Mark as read"
                              >
                                <Check className="w-3 h-3 text-green-500" />
                              </button>
                            )}

                            <button
                              onClick={e => {
                                e.stopPropagation();
                                handleDeleteNotification(notification.id);
                              }}
                              className="p-1 hover:bg-white rounded min-h-[44px] min-w-[44px] flex items-center justify-center"
                              title="Delete notification"
                            >
                              <Trash2 className="w-3 h-3 text-red-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Visual indicator for unread */}
                    {!notification.read && (
                      <div className="absolute top-3 right-3 w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                ))}

                {/* Load More */}
                {hasMore && (
                  <div className="pt-2 text-center">
                    <Button variant="ghost" size="sm" onClick={loadMore} disabled={isLoading}>
                      {isLoading ? 'Loading...' : 'Load more'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Actions */}
          {notifications.length > 0 && (
            <div className="pt-4 mt-4 border-t border-gray-200">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setShowMessages(true);
                    onClose();
                  }}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Messages
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={handleClearRead}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Read
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Panel */}
      <MessagePanel isOpen={showMessages} onClose={() => setShowMessages(false)} />
    </div>
  );
}
