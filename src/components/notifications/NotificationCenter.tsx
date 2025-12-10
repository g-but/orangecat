'use client';

import { useState, useEffect } from 'react';
import {
  Bell,
  X,
  Check,
  Bitcoin,
  Zap,
  Users,
  MessageSquare,
  TrendingUp,
  Calendar,
  Settings,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import MessagePanel from '@/components/messaging/MessagePanel';

interface Notification {
  id: string;
  type: 'payment' | 'lightning' | 'project' | 'social' | 'system' | 'message';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  metadata?: {
    amount?: number;
    projectId?: string;
    currency?: 'BTC' | 'SATS';
    userId?: string;
    conversationId?: string;
    messageId?: string;
  };
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export default function NotificationCenter({
  isOpen,
  onClose,
  className = '',
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'payments' | 'projects' | 'messages'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showMessages, setShowMessages] = useState(false);

  // Mock notifications data (in real app, fetch from API)
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'payment',
        title: 'New Bitcoin Payment Received',
        message: 'You received 0.001 BTC for your "Open Source Project" project',
        timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
        read: false,
        actionUrl: '/dashboard',
        metadata: { amount: 0.001, projectId: 'camp_1', currency: 'BTC' },
      },
      {
        id: '2',
        type: 'lightning',
        title: 'Lightning Payment Received',
        message: 'You received 50,000 sats via Lightning for your project',
        timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
        read: false,
        actionUrl: '/dashboard',
        metadata: { amount: 50000, projectId: 'camp_1', currency: 'SATS' },
      },
      {
        id: '3',
        type: 'project',
        title: 'Project Milestone Reached',
        message: 'Your "Open Source Project" reached 50% of its funding goal!',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        read: true,
        actionUrl: '/project/open-source-project',
        metadata: { projectId: 'camp_1' },
      },
      {
        id: '4',
        type: 'social',
        title: 'New Project Supporter',
        message: 'Alice joined your project as a supporter',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
        read: true,
        actionUrl: '/project/open-source-project/supporters',
        metadata: { projectId: 'camp_1', userId: 'user_alice' },
      },
      {
        id: '5',
        type: 'system',
        title: 'Weekly Analytics Report',
        message: 'Your weekly project performance report is ready',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        read: true,
        actionUrl: '/dashboard',
      },
    ];

    setTimeout(() => {
      setNotifications(mockNotifications);
      setIsLoading(false);
    }, 500);
  }, []);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'payment':
        return <Bitcoin className="w-5 h-5 text-orange-500" />;
      case 'lightning':
        return <Zap className="w-5 h-5 text-yellow-500" />;
      case 'project':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'social':
        return <Users className="w-5 h-5 text-blue-500" />;
      case 'message':
        return <MessageSquare className="w-5 h-5 text-purple-500" />;
      case 'system':
        return <Settings className="w-5 h-5 text-gray-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') {
      return !notification.read;
    }
    if (filter === 'payments') {
      return ['payment', 'lightning'].includes(notification.type);
    }
    if (filter === 'projects') {
      return notification.type === 'project';
    }
    if (filter === 'messages') {
      return notification.type === 'message';
    }
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
    toast.success('All notifications marked as read');
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast.success('Notification deleted');
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    if (notification.type === 'message' && notification.metadata?.conversationId) {
      // Open message conversation
      setShowMessages(true);
      onClose(); // Close notification center
      return;
    }

    if (notification.actionUrl) {
      // In a real app, navigate to the URL
      // Navigate to notification URL
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
          {/* Filter Tabs */}
          <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
            {[
              { key: 'all', label: 'All' },
              { key: 'unread', label: 'Unread' },
              { key: 'payments', label: 'Payments' },
              { key: 'projects', label: 'Projects' },
              { key: 'messages', label: 'Messages' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
                  filter === tab.key
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
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                <Check className="w-4 h-4 mr-1" />
                Mark all read
              </Button>
            </div>
          )}

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-start gap-3 p-3 bg-gray-100 rounded-lg">
                      <div className="w-5 h-5 bg-gray-300 rounded"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-300 rounded mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No notifications found</p>
              </div>
            ) : (
              filteredNotifications.map(notification => (
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
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4
                            className={`text-sm font-medium ${
                              notification.read ? 'text-gray-900' : 'text-gray-900'
                            }`}
                          >
                            {notification.title}
                          </h4>
                          <p
                            className={`text-sm mt-1 ${
                              notification.read ? 'text-gray-600' : 'text-gray-700'
                            }`}
                          >
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notification.read && (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="p-1 hover:bg-white rounded"
                              title="Mark as read"
                            >
                              <Check className="w-3 h-3 text-green-500" />
                            </button>
                          )}

                          <button
                            onClick={e => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="p-1 hover:bg-white rounded"
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
              ))
            )}
          </div>

          {/* Footer Actions */}
          {filteredNotifications.length > 0 && (
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
                <Button variant="outline" size="sm" className="flex-1">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Panel */}
      <MessagePanel
        isOpen={showMessages}
        onClose={() => setShowMessages(false)}
      />
    </div>
  );
}
