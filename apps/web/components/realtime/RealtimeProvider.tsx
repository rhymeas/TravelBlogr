// @ts-nocheck - Supabase Realtime has complex type definitions
'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { createClientSupabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface RealtimeContextType {
  isConnected: boolean
  subscribe: (channel: string, callback: (payload: any) => void) => RealtimeChannel | null
  unsubscribe: (channel: RealtimeChannel) => void
  broadcast: (channel: string, event: string, payload: any) => void
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined)

export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider')
  }
  return context
}

interface RealtimeProviderProps {
  children: ReactNode
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [channels, setChannels] = useState<Map<string, RealtimeChannel>>(new Map())
  const supabase = createClientSupabase()

  useEffect(() => {
    // Monitor connection status
    const handleConnect = () => {
      setIsConnected(true)
      console.log('Realtime connected')
    }

    const handleDisconnect = () => {
      setIsConnected(false)
      console.log('Realtime disconnected')
    }

    const handleError = (error: any) => {
      console.error('Realtime error:', error)
      toast.error('Connection error. Some features may not work properly.')
    }

    // Set up connection monitoring
    supabase.realtime.onOpen(handleConnect)
    supabase.realtime.onClose(handleDisconnect)
    supabase.realtime.onError(handleError)

    return () => {
      // Clean up all channels
      channels.forEach(channel => {
        supabase.removeChannel(channel)
      })
      setChannels(new Map())
    }
  }, [])

  const subscribe = (channelName: string, callback: (payload: any) => void): RealtimeChannel | null => {
    try {
      // Check if channel already exists
      if (channels.has(channelName)) {
        console.warn(`Channel ${channelName} already exists`)
        return channels.get(channelName) || null
      }

      const channel = supabase
        .channel(channelName)
        .on('postgres_changes', { event: '*', schema: 'public' }, callback)
        .on('broadcast', { event: '*' }, callback)
        .on('presence', { event: '*' }, callback)
        .subscribe((status) => {
          console.log(`Channel ${channelName} subscription status:`, status)
          if (status === 'SUBSCRIBED') {
            console.log(`Successfully subscribed to ${channelName}`)
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`Failed to subscribe to ${channelName}`)
            toast.error(`Failed to connect to ${channelName}`)
          }
        })

      setChannels(prev => new Map(prev).set(channelName, channel))
      return channel
    } catch (error) {
      console.error('Error subscribing to channel:', error)
      toast.error('Failed to subscribe to real-time updates')
      return null
    }
  }

  const unsubscribe = (channel: RealtimeChannel) => {
    try {
      supabase.removeChannel(channel)
      
      // Remove from our channels map
      setChannels(prev => {
        const newChannels = new Map(prev)
        for (const [name, ch] of Array.from(newChannels.entries())) {
          if (ch === channel) {
            newChannels.delete(name)
            break
          }
        }
        return newChannels
      })
    } catch (error) {
      console.error('Error unsubscribing from channel:', error)
    }
  }

  const broadcast = (channelName: string, event: string, payload: any) => {
    try {
      const channel = channels.get(channelName)
      if (channel) {
        channel.send({
          type: 'broadcast',
          event,
          payload
        })
      } else {
        console.warn(`Channel ${channelName} not found for broadcasting`)
      }
    } catch (error) {
      console.error('Error broadcasting message:', error)
    }
  }

  const value: RealtimeContextType = {
    isConnected,
    subscribe,
    unsubscribe,
    broadcast
  }

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  )
}

// Hook for trip-specific real-time updates
export function useTripRealtime(tripId: string) {
  const { subscribe, unsubscribe, broadcast } = useRealtime()
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!tripId) return

    const channelName = `trip:${tripId}`
    const newChannel = subscribe(channelName, (payload) => {
      console.log('Trip update received:', payload)
      
      // Handle different types of updates
      switch (payload.eventType) {
        case 'INSERT':
          if (payload.table === 'posts') {
            toast.success('New post added to trip!')
          }
          break
        case 'UPDATE':
          if (payload.table === 'trips') {
            toast('Trip updated')
          }
          break
        case 'DELETE':
          if (payload.table === 'posts') {
            toast('Post removed from trip')
          }
          break
      }
    })

    setChannel(newChannel)

    return () => {
      if (newChannel) {
        unsubscribe(newChannel)
      }
    }
  }, [tripId, subscribe, unsubscribe])

  const broadcastTripUpdate = (event: string, data: any) => {
    if (tripId) {
      broadcast(`trip:${tripId}`, event, data)
    }
  }

  return {
    broadcastTripUpdate
  }
}

// Hook for user presence (who's viewing the trip)
export function useTripPresence(tripId: string, userId: string) {
  const { subscribe, unsubscribe } = useRealtime()
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])

  useEffect(() => {
    if (!tripId || !userId) return

    const channelName = `trip-presence:${tripId}`
    const channel = subscribe(channelName, (payload) => {
      if (payload.event === 'presence') {
        // Handle presence updates
        const { joins, leaves } = payload.payload
        
        setOnlineUsers(prev => {
          let updated = [...prev]
          
          // Add new users
          Object.keys(joins).forEach(key => {
            const user = joins[key][0]
            if (user && !updated.includes(user.user_id)) {
              updated.push(user.user_id)
            }
          })
          
          // Remove users who left
          Object.keys(leaves).forEach(key => {
            const user = leaves[key][0]
            if (user) {
              updated = updated.filter(id => id !== user.user_id)
            }
          })
          
          return updated
        })
      }
    })

    // Track our presence
    if (channel) {
      channel.track({
        user_id: userId,
        online_at: new Date().toISOString()
      })
    }

    return () => {
      if (channel) {
        unsubscribe(channel)
      }
    }
  }, [tripId, userId, subscribe, unsubscribe])

  return {
    onlineUsers: onlineUsers.filter(id => id !== userId) // Exclude current user
  }
}
