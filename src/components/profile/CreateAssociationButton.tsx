'use client'

import { useState } from 'react'
import { Plus, X, Check, Loader2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import AssociationService from '@/services/supabase/associations'
import type { CreateAssociationInput } from '@/services/supabase/associations'

interface CreateAssociationButtonProps {
  onAssociationCreated?: () => void
  className?: string
}

export default function CreateAssociationButton({ 
  onAssociationCreated,
  className = '' 
}: CreateAssociationButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<CreateAssociationInput>>({
    target_entity_type: 'project',
    relationship_type: 'created',
    visibility: 'public'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.target_entity_id || !formData.target_entity_type || !formData.relationship_type) {
      return
    }

    setLoading(true)
    try {
      await AssociationService.createAssociation(formData as CreateAssociationInput)
      setIsOpen(false)
      setFormData({
        target_entity_type: 'project',
        relationship_type: 'created',
        visibility: 'public'
      })
      onAssociationCreated?.()
    } catch (error) {
      alert('Failed to create association. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 ${className}`}
      >
        <Plus className="w-4 h-4" />
        Add Connection
      </Button>
    )
  }

  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>Add New Connection</span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Entity Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entity Type
            </label>
            <select
              value={formData.target_entity_type}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                target_entity_type: e.target.value as CreateAssociationInput['target_entity_type']
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="project">Campaign</option>
              <option value="organization">Organization</option>
              <option value="project">Project</option>
              <option value="profile">Profile</option>
              <option value="collective">Collective</option>
            </select>
          </div>

          {/* Entity ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entity ID or Username
            </label>
            <input
              type="text"
              value={formData.target_entity_id || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, target_entity_id: e.target.value }))}
              placeholder="Enter entity ID or username"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          {/* Relationship Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Relationship
            </label>
            <select
              value={formData.relationship_type}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                relationship_type: e.target.value as CreateAssociationInput['relationship_type']
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="created">Created</option>
              <option value="founded">Founded</option>
              <option value="supports">Supports</option>
              <option value="collaborates">Collaborates</option>
              <option value="maintains">Maintains</option>
              <option value="member">Member</option>
              <option value="leader">Leader</option>
              <option value="contributor">Contributor</option>
              <option value="advisor">Advisor</option>
            </select>
          </div>

          {/* Role (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role (Optional)
            </label>
            <input
              type="text"
              value={formData.role || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              placeholder="e.g., Lead Developer, Co-founder"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Create Connection
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 