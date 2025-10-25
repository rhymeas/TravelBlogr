'use client'

import { useState, useEffect } from 'react'
import { Bell, X, Check, Settings, Filter } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { createClientSupabase } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

interface Notification {
  id: string
  type: 'trip_invite' | 'new_post' | 'location_update' | 'comment' | 'like' | 'follow'
  title: string
  message: string
  data?: any
  read: boolean
  created_at: string
  user?: {
    id: string
    name: string
    avatar?: string
  }
}

interface NotificationSystemProps {
  userId: string
}

export function NotificationSystem({ userId }: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showPanel, setShowPanel] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState({
    email: true,
    push: true,
    inApp: true,
    types: {
      trip_invite: true,
      new_post: true,
      location_update: false,
      comment: true,
      like: false,
      follow: true
    }
  })
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [supabase, setSupabase] = useState<any>(null)

  // Initialize Supabase client on client side only
  useEffect(() => {
    setSupabase(createClientSupabase())
  }, [])

  useEffect(() => {
    if (!supabase) return

    loadNotifications()
    loadSettings()

    // Subscribe to real-time notifications
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload: any) => {
          handleNewNotification(payload.new)
        }
      )
      .subscribe()

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          users (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      const formattedNotifications: Notification[] = (data || []).map((notif: any) => ({
        id: notif.id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        data: notif.data,
        read: notif.read,
        created_at: notif.created_at,
        user: notif.users ? {
          id: notif.users.id,
          name: notif.users.full_name || 'Anonymous',
          avatar: notif.users.avatar_url
        } : undefined
      }))

      setNotifications(formattedNotifications)
      setUnreadCount(formattedNotifications.filter(n => !n.read).length)
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  const loadSettings = async () => {
    try {
      const { data } = await supabase
        .from('user_settings')
        .select('notification_settings')
        .eq('user_id', userId)
        .single()

      if (data?.notification_settings) {
        setSettings(prev => ({ ...prev, ...data.notification_settings }))
      }
    } catch (error) {
      console.error('Error loading notification settings:', error)
    }
  }

  const handleNewNotification = (notification: any) => {
    const formattedNotif: Notification = {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      read: false,
      created_at: notification.created_at
    }

    setNotifications(prev => [formattedNotif, ...prev.slice(0, 49)])
    setUnreadCount(prev => prev + 1)

    // Show in-app notification
    if (settings.inApp && settings.types[notification.type as keyof typeof settings.types]) {
      toast.success(notification.title)
    }

    // Show browser notification
    if (settings.push && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icon-192x192.png',
        tag: notification.id
      })
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) throw error

      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) throw error

      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error

      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      setUnreadCount(prev => {
        const notification = notifications.find(n => n.id === notificationId)
        return notification && !notification.read ? prev - 1 : prev
      })
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const saveSettings = async () => {
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          notification_settings: settings
        })

      if (error) throw error

      toast.success('Notification settings saved')
      setShowSettings(false)
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    }
  }

  const filteredNotifications = notifications.filter(n => 
    filter === 'all' || (filter === 'unread' && !n.read)
  )

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'trip_invite':
        return '🎒'
      case 'new_post':
        return '📝'
      case 'location_update':
        return '📍'
      case 'comment':
        return '💬'
      case 'like':
        return '❤️'
      case 'follow':
        return '👥'
      default:
        return '🔔'
    }
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {showPanel && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border z-50">
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Notifications</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPanel(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Filter and Actions */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={filter === 'unread' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('unread')}
                >
                  Unread ({unreadCount})
                </Button>
              </div>

              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Mark all read
                </Button>
              )}
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="p-4 border-b bg-gray-50">
              <h4 className="font-medium mb-3">Notification Settings</h4>
              
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.email}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        email: e.target.checked 
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                    />
                    Email
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.push}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        push: e.target.checked 
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                    />
                    Push
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.inApp}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        inApp: e.target.checked 
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                    />
                    In-app
                  </label>
                </div>

                <div className="space-y-2">
                  {Object.entries(settings.types).map(([type, enabled]) => (
                    <label key={type} className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          types: { ...prev.types, [type]: e.target.checked }
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                      />
                      {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </label>
                  ))}
                </div>

                <Button onClick={saveSettings} size="sm" className="w-full">
                  Save Settings
                </Button>
              </div>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No notifications</p>
                <p className="text-sm mt-1">
                  {filter === 'unread' ? 'All caught up!' : 'Notifications will appear here'}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-lg">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm">{notification.title}</p>
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                          
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Mark read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
