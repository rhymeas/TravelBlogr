'use client'

/**
 * MediaLibrary - Media Management Component
 * 
 * Browse, upload, and manage media files for blog posts.
 * Integrates with Supabase Storage.
 */

import { useState, useEffect } from 'react'
import { Upload, Search, Grid, List, Trash2, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { OptimizedImage } from '@/components/ui/OptimizedImage'
import { getBrowserSupabase } from '@/lib/supabase'
import { uploadFile, getPublicUrl, deleteFile } from '@/lib/supabase'

interface MediaFile {
  id: string
  url: string
  thumbnail_url?: string
  type: 'image' | 'video' | 'document'
  title?: string
  filename: string
  size: number
  width?: number
  height?: number
  created_at: string
}

interface MediaLibraryProps {
  onSelect?: (file: MediaFile) => void
  allowMultiple?: boolean
  fileType?: 'image' | 'video' | 'document' | 'all'
  className?: string
}

export function MediaLibrary({
  onSelect,
  allowMultiple = false,
  fileType = 'all',
  className = ''
}: MediaLibraryProps) {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  useEffect(() => {
    fetchFiles()
  }, [fileType])

  const fetchFiles = async () => {
    try {
      setIsLoading(true)
      const supabase = getBrowserSupabase()

      let query = supabase
        .from('media_files')
        .select('*')
        .order('created_at', { ascending: false })

      if (fileType !== 'all') {
        query = query.eq('type', fileType)
      }

      const { data, error } = await query

      if (error) throw error

      setFiles(data || [])
    } catch (error) {
      console.error('Error fetching media files:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files
    if (!uploadedFiles || uploadedFiles.length === 0) return

    setIsUploading(true)

    try {
      const supabase = getBrowserSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      for (const file of Array.from(uploadedFiles)) {
        // Upload to Supabase Storage
        const path = `${user.id}/${Date.now()}-${file.name}`
        const bucket = 'images' // or 'trip-images', 'profile-avatars', etc.

        await uploadFile(bucket, path, file)
        const url = getPublicUrl(bucket, path)

        // Save metadata to database
        const { error } = await supabase
          .from('media_files')
          .insert({
            user_id: user.id,
            url,
            type: file.type.startsWith('image/') ? 'image' : 'document',
            filename: file.name,
            size: file.size,
            mime_type: file.type
          })

        if (error) throw error
      }

      await fetchFiles()
    } catch (error) {
      console.error('Error uploading files:', error)
      alert('Failed to upload files')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (fileId: string, filePath: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return

    try {
      const supabase = getBrowserSupabase()

      // Delete from storage
      const bucket = 'images'
      await deleteFile(bucket, filePath)

      // Delete from database
      const { error } = await supabase
        .from('media_files')
        .delete()
        .eq('id', fileId)

      if (error) throw error

      setFiles(files.filter(f => f.id !== fileId))
    } catch (error) {
      console.error('Error deleting file:', error)
      alert('Failed to delete file')
    }
  }

  const handleSelect = (file: MediaFile) => {
    if (allowMultiple) {
      const newSelected = new Set(selectedFiles)
      if (newSelected.has(file.id)) {
        newSelected.delete(file.id)
      } else {
        newSelected.add(file.id)
      }
      setSelectedFiles(newSelected)
    } else {
      onSelect?.(file)
    }
  }

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  const filteredFiles = files.filter(file =>
    file.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.title?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Media Library</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
          </Button>
          <label className="cursor-pointer">
            <input
              type="file"
              multiple
              accept={fileType === 'image' ? 'image/*' : '*'}
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
            <span className={`inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all ${
              isUploading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-rausch-500 to-kazan-500 text-white hover:shadow-lg'
            }`}>
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload'}
            </span>
          </label>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Files Grid/List */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-gray-500">No files found</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filteredFiles.map((file) => (
            <Card
              key={file.id}
              className={`group relative overflow-hidden cursor-pointer transition-all ${
                selectedFiles.has(file.id) ? 'ring-2 ring-rausch-500' : ''
              }`}
              onClick={() => handleSelect(file)}
            >
              <div className="aspect-square relative bg-gray-100">
                {file.type === 'image' ? (
                  <OptimizedImage
                    src={file.url}
                    alt={file.title || file.filename}
                    fill
                    preset="thumbnail"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-4xl">📄</span>
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation()
                      copyUrl(file.url)
                    }}
                  >
                    {copiedUrl === file.url ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(file.id, file.url)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="p-2">
                <p className="text-xs text-gray-600 truncate">{file.filename}</p>
                <p className="text-xs text-gray-400">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredFiles.map((file) => (
            <Card
              key={file.id}
              className={`p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all ${
                selectedFiles.has(file.id) ? 'ring-2 ring-rausch-500' : ''
              }`}
              onClick={() => handleSelect(file)}
            >
              <div className="h-12 w-12 bg-gray-100 rounded flex-shrink-0">
                {file.type === 'image' ? (
                  <OptimizedImage
                    src={file.url}
                    alt={file.title || file.filename}
                    width={48}
                    height={48}
                    preset="thumbnail"
                    className="object-cover rounded"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-2xl">📄</span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{file.filename}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB • {new Date(file.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    copyUrl(file.url)
                  }}
                >
                  {copiedUrl === file.url ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(file.id, file.url)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

