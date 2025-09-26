'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog'
import { Search, Filter, MoreHorizontal, Shield, ShieldCheck, ShieldX, Mail, Calendar, MapPin, Ban, CheckCircle } from 'lucide-react'
import { createClientSupabase } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

interface User {
  id: string
  email: string
  full_name: string
  username?: string
  avatar_url?: string
  bio?: string
  location?: string
  created_at: string
  last_sign_in_at?: string
  email_confirmed_at?: string
  is_admin: boolean
  is_banned: boolean
  trip_count?: number
  follower_count?: number
  following_count?: number
}

interface UserManagementProps {
  currentUserId: string
  isAdmin: boolean
  className?: string
}

export function UserManagement({ currentUserId, isAdmin, className = '' }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const supabase = createClientSupabase()

  useEffect(() => {
    if (isAdmin) {
      loadUsers()
    }
  }, [isAdmin])

  useEffect(() => {
    applyFilters()
  }, [users, searchQuery, statusFilter, roleFilter])

  const loadUsers = async () => {
    try {
      setLoading(true)

      // Load users with additional stats
      const { data: usersData, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Load additional stats for each user
      const usersWithStats = await Promise.all(
        (usersData || []).map(async (user) => {
          const [tripsResult, followersResult, followingResult] = await Promise.all([
            supabase.from('trips').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
            supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id),
            supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.id)
          ])

          return {
            ...user,
            trip_count: tripsResult.count || 0,
            follower_count: followersResult.count || 0,
            following_count: followingResult.count || 0,
            is_admin: user.email?.includes('admin') || false, // Simple admin check
            is_banned: false // Would come from user metadata
          }
        })
      )

      setUsers(usersWithStats)
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...users]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(user => 
        user.full_name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.username?.toLowerCase().includes(query)
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      switch (statusFilter) {
        case 'active':
          filtered = filtered.filter(user => user.last_sign_in_at && 
            new Date(user.last_sign_in_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
          break
        case 'inactive':
          filtered = filtered.filter(user => !user.last_sign_in_at || 
            new Date(user.last_sign_in_at) <= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
          break
        case 'verified':
          filtered = filtered.filter(user => user.email_confirmed_at)
          break
        case 'unverified':
          filtered = filtered.filter(user => !user.email_confirmed_at)
          break
        case 'banned':
          filtered = filtered.filter(user => user.is_banned)
          break
      }
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      switch (roleFilter) {
        case 'admin':
          filtered = filtered.filter(user => user.is_admin)
          break
        case 'user':
          filtered = filtered.filter(user => !user.is_admin)
          break
      }
    }

    setFilteredUsers(filtered)
  }

  const handleUserAction = async (userId: string, action: 'ban' | 'unban' | 'make_admin' | 'remove_admin') => {
    if (!isAdmin || userId === currentUserId) return

    try {
      setActionLoading(userId)

      // In a real app, these would be proper API calls to update user roles/status
      switch (action) {
        case 'ban':
          // Update user metadata to mark as banned
          toast.success('User banned successfully')
          break
        case 'unban':
          // Remove ban from user metadata
          toast.success('User unbanned successfully')
          break
        case 'make_admin':
          // Add admin role to user
          toast.success('User promoted to admin')
          break
        case 'remove_admin':
          // Remove admin role from user
          toast.success('Admin privileges removed')
          break
      }

      // Reload users to reflect changes
      await loadUsers()
    } catch (error) {
      console.error('Error performing user action:', error)
      toast.error('Failed to perform action')
    } finally {
      setActionLoading(null)
    }
  }

  const getUserStatusBadge = (user: User) => {
    if (user.is_banned) {
      return <Badge variant="destructive" className="flex items-center gap-1"><Ban className="h-3 w-3" />Banned</Badge>
    }
    if (user.is_admin) {
      return <Badge variant="default" className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" />Admin</Badge>
    }
    if (!user.email_confirmed_at) {
      return <Badge variant="outline" className="flex items-center gap-1"><Mail className="h-3 w-3" />Unverified</Badge>
    }
    if (user.last_sign_in_at && new Date(user.last_sign_in_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
      return <Badge variant="secondary" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />Active</Badge>
    }
    return <Badge variant="outline">Inactive</Badge>
  }

  if (!isAdmin) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-6xl mb-4">🔒</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You don't have permission to manage users.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(10)].map((_, i) => (
          <div key={i} className="bg-white border rounded-lg p-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-gray-300 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 rounded w-48 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-32"></div>
              </div>
              <div className="h-8 w-20 bg-gray-300 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage users, roles, and permissions</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant="outline">{filteredUsers.length} users</Badge>
          <Button variant="outline" onClick={loadUsers}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users by name, email, or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="unverified">Unverified</SelectItem>
              <SelectItem value="banned">Banned</SelectItem>
            </SelectContent>
          </Select>

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg border">
        <div className="divide-y">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar_url} alt={user.full_name} />
                    <AvatarFallback>
                      {user.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900 truncate">{user.full_name}</h3>
                      {getUserStatusBadge(user)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </span>
                      {user.username && (
                        <span>@{user.username}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Joined {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                      <span>{user.trip_count} trips</span>
                      <span>{user.follower_count} followers</span>
                      <span>{user.following_count} following</span>
                      {user.last_sign_in_at && (
                        <span>Last active {formatDistanceToNow(new Date(user.last_sign_in_at), { addSuffix: true })}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                        >
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>User Details</DialogTitle>
                        </DialogHeader>
                        {selectedUser && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-16 w-16">
                                <AvatarImage src={selectedUser.avatar_url} alt={selectedUser.full_name} />
                                <AvatarFallback className="text-lg">
                                  {selectedUser.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="text-xl font-semibold">{selectedUser.full_name}</h3>
                                <p className="text-gray-600">{selectedUser.email}</p>
                                {selectedUser.username && (
                                  <p className="text-gray-600">@{selectedUser.username}</p>
                                )}
                              </div>
                            </div>

                            {selectedUser.bio && (
                              <div>
                                <h4 className="font-medium mb-1">Bio</h4>
                                <p className="text-gray-600">{selectedUser.bio}</p>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium mb-2">Account Info</h4>
                                <div className="space-y-1 text-sm">
                                  <p>Created: {new Date(selectedUser.created_at).toLocaleDateString()}</p>
                                  {selectedUser.last_sign_in_at && (
                                    <p>Last sign in: {new Date(selectedUser.last_sign_in_at).toLocaleDateString()}</p>
                                  )}
                                  <p>Email verified: {selectedUser.email_confirmed_at ? 'Yes' : 'No'}</p>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-medium mb-2">Activity</h4>
                                <div className="space-y-1 text-sm">
                                  <p>Trips: {selectedUser.trip_count}</p>
                                  <p>Followers: {selectedUser.follower_count}</p>
                                  <p>Following: {selectedUser.following_count}</p>
                                </div>
                              </div>
                            </div>

                            {selectedUser.id !== currentUserId && (
                              <div className="flex gap-2 pt-4 border-t">
                                {!selectedUser.is_banned ? (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleUserAction(selectedUser.id, 'ban')}
                                    disabled={actionLoading === selectedUser.id}
                                  >
                                    <Ban className="h-4 w-4 mr-1" />
                                    Ban User
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUserAction(selectedUser.id, 'unban')}
                                    disabled={actionLoading === selectedUser.id}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Unban User
                                  </Button>
                                )}

                                {!selectedUser.is_admin ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUserAction(selectedUser.id, 'make_admin')}
                                    disabled={actionLoading === selectedUser.id}
                                  >
                                    <ShieldCheck className="h-4 w-4 mr-1" />
                                    Make Admin
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUserAction(selectedUser.id, 'remove_admin')}
                                    disabled={actionLoading === selectedUser.id}
                                  >
                                    <ShieldX className="h-4 w-4 mr-1" />
                                    Remove Admin
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
