'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface Location {
  id: string
  name: string
  description: string
  content: any // JSONB content from CMS
  country: string
  region: string
}

interface LocationContentProps {
  location: Location
}

export function LocationContent({ location }: LocationContentProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Render rich content from CMS (Novel editor format)
  const renderContent = (content: any) => {
    if (!content) return null

    // This is a simplified renderer - in a real app you'd use a proper JSON renderer
    if (typeof content === 'string') {
      return <p className="text-gray-700 leading-relaxed">{content}</p>
    }

    if (content.type === 'doc' && content.content) {
      return (
        <div className="prose prose-lg max-w-none">
          {content.content.map((node: any, index: number) => (
            <div key={index}>
              {renderNode(node)}
            </div>
          ))}
        </div>
      )
    }

    return <p className="text-gray-700 leading-relaxed">{location.description}</p>
  }

  const renderNode = (node: any) => {
    switch (node.type) {
      case 'paragraph':
        return (
          <p className="mb-4 text-gray-700 leading-relaxed">
            {node.content?.map((textNode: any, index: number) => (
              <span key={index}>{textNode.text}</span>
            ))}
          </p>
        )
      
      case 'heading':
        const HeadingTag = `h${node.attrs?.level || 2}` as keyof JSX.IntrinsicElements
        return (
          <HeadingTag className="font-bold text-gray-900 mb-3 mt-6">
            {node.content?.map((textNode: any, index: number) => (
              <span key={index}>{textNode.text}</span>
            ))}
          </HeadingTag>
        )
      
      case 'bulletList':
        return (
          <ul className="list-disc list-inside mb-4 space-y-2">
            {node.content?.map((listItem: any, index: number) => (
              <li key={index} className="text-gray-700">
                {listItem.content?.[0]?.content?.map((textNode: any, textIndex: number) => (
                  <span key={textIndex}>{textNode.text}</span>
                ))}
              </li>
            ))}
          </ul>
        )
      
      case 'orderedList':
        return (
          <ol className="list-decimal list-inside mb-4 space-y-2">
            {node.content?.map((listItem: any, index: number) => (
              <li key={index} className="text-gray-700">
                {listItem.content?.[0]?.content?.map((textNode: any, textIndex: number) => (
                  <span key={textIndex}>{textNode.text}</span>
                ))}
              </li>
            ))}
          </ol>
        )
      
      case 'blockquote':
        return (
          <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 mb-4">
            {node.content?.map((paragraph: any, index: number) => (
              <p key={index}>
                {paragraph.content?.map((textNode: any, textIndex: number) => (
                  <span key={textIndex}>{textNode.text}</span>
                ))}
              </p>
            ))}
          </blockquote>
        )
      
      default:
        return null
    }
  }

  const contentPreview = location.description
  const hasMoreContent = location.content && Object.keys(location.content).length > 0
  const shouldShowExpandButton = contentPreview.length > 300 || hasMoreContent

  return (
    <div className="space-y-6">
      {/* Main Description */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          About {location.name}
        </h2>
        
        <div className={`${!isExpanded && shouldShowExpandButton ? 'line-clamp-4' : ''}`}>
          {isExpanded || !shouldShowExpandButton ? (
            <div>
              {hasMoreContent ? renderContent(location.content) : (
                <p className="text-gray-700 leading-relaxed">{location.description}</p>
              )}
            </div>
          ) : (
            <p className="text-gray-700 leading-relaxed">{contentPreview}</p>
          )}
        </div>

        {shouldShowExpandButton && (
          <Button
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-3 p-0 h-auto text-blue-600 hover:text-blue-700"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Read more
              </>
            )}
          </Button>
        )}
      </div>

      {/* Key Highlights */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Why Visit {location.name}?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">1</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Stunning Natural Beauty</h4>
              <p className="text-sm text-gray-600">
                Experience breathtaking landscapes and pristine natural environments.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">2</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Rich Cultural Heritage</h4>
              <p className="text-sm text-gray-600">
                Discover local traditions, history, and authentic cultural experiences.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">3</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Adventure Activities</h4>
              <p className="text-sm text-gray-600">
                From hiking to water sports, find your perfect adventure activity.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg">
            <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">4</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Local Cuisine</h4>
              <p className="text-sm text-gray-600">
                Taste authentic local dishes and discover unique culinary traditions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Nature</Badge>
          <Badge variant="secondary">Adventure</Badge>
          <Badge variant="secondary">Culture</Badge>
          <Badge variant="secondary">Photography</Badge>
          <Badge variant="secondary">Family Friendly</Badge>
          <Badge variant="secondary">Outdoor Activities</Badge>
        </div>
      </div>
    </div>
  )
}
