'use client'

/**
 * ContentBlockManager - Drag-and-Drop Content Block Manager
 * 
 * A component for managing content blocks on a page with drag-and-drop reordering.
 * Allows admins to add, edit, reorder, and delete content blocks.
 * 
 * Use cases:
 * - Blog page builder
 * - Landing page editor
 * - Dynamic page management
 */

import { useState, useEffect } from 'react'
import { Plus, GripVertical, Edit2, Trash2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { getBrowserSupabase } from '@/lib/supabase'

interface ContentBlock {
  id: string
  page_slug: string
  block_type: string
  block_key: string
  content: any
  display_order: number
  is_active: boolean
}

interface ContentBlockManagerProps {
  pageSlug: string
  isAdmin?: boolean
  onBlocksChange?: (blocks: ContentBlock[]) => void
}

export function ContentBlockManager({
  pageSlug,
  isAdmin = false,
  onBlocksChange
}: ContentBlockManagerProps) {
  const [blocks, setBlocks] = useState<ContentBlock[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  useEffect(() => {
    fetchBlocks()
  }, [pageSlug])

  const fetchBlocks = async () => {
    try {
      const supabase = getBrowserSupabase()
      const { data, error } = await supabase
        .from('content_blocks')
        .select('*')
        .eq('page_slug', pageSlug)
        .order('display_order', { ascending: true })

      if (error) throw error

      setBlocks(data || [])
      onBlocksChange?.(data || [])
    } catch (error) {
      console.error('Error fetching content blocks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    
    if (draggedIndex === null || draggedIndex === index) return

    const newBlocks = [...blocks]
    const draggedBlock = newBlocks[draggedIndex]
    
    // Remove from old position
    newBlocks.splice(draggedIndex, 1)
    
    // Insert at new position
    newBlocks.splice(index, 0, draggedBlock)
    
    // Update display_order
    newBlocks.forEach((block, idx) => {
      block.display_order = idx
    })
    
    setBlocks(newBlocks)
    setDraggedIndex(index)
  }

  const handleDragEnd = async () => {
    if (draggedIndex === null) return

    try {
      const supabase = getBrowserSupabase()
      
      // Update all blocks with new order
      const updates = blocks.map((block) => ({
        id: block.id,
        display_order: block.display_order
      }))

      const { error } = await supabase
        .from('content_blocks')
        .upsert(updates)

      if (error) throw error

      onBlocksChange?.(blocks)
    } catch (error) {
      console.error('Error updating block order:', error)
      // Revert on error
      fetchBlocks()
    } finally {
      setDraggedIndex(null)
    }
  }

  const handleToggleActive = async (blockId: string, currentState: boolean) => {
    try {
      const supabase = getBrowserSupabase()
      
      const { error } = await supabase
        .from('content_blocks')
        .update({ is_active: !currentState })
        .eq('id', blockId)

      if (error) throw error

      setBlocks(blocks.map(block => 
        block.id === blockId 
          ? { ...block, is_active: !currentState }
          : block
      ))
    } catch (error) {
      console.error('Error toggling block:', error)
    }
  }

  const handleDelete = async (blockId: string) => {
    if (!confirm('Are you sure you want to delete this block?')) return

    try {
      const supabase = getBrowserSupabase()
      
      const { error } = await supabase
        .from('content_blocks')
        .delete()
        .eq('id', blockId)

      if (error) throw error

      setBlocks(blocks.filter(block => block.id !== blockId))
    } catch (error) {
      console.error('Error deleting block:', error)
    }
  }

  if (!isAdmin) {
    return null
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Content Blocks ({blocks.length})
        </h3>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Block
        </Button>
      </div>

      {blocks.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500 mb-4">No content blocks yet</p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create First Block
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {blocks.map((block, index) => (
            <Card
              key={block.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`p-4 cursor-move transition-all ${
                draggedIndex === index ? 'opacity-50 scale-95' : ''
              } ${!block.is_active ? 'bg-gray-50 border-dashed' : ''}`}
            >
              <div className="flex items-center gap-4">
                {/* Drag Handle */}
                <div className="flex-shrink-0 text-gray-400 hover:text-gray-600">
                  <GripVertical className="h-5 w-5" />
                </div>

                {/* Block Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {block.block_type}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({block.block_key})
                    </span>
                    {!block.is_active && (
                      <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
                        Hidden
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    Order: {block.display_order}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(block.id, block.is_active)}
                  >
                    {block.is_active ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(block.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

