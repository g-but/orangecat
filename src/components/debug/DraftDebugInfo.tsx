'use client'

import { useDrafts } from '@/hooks/useDrafts'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/Card'

export default function DraftDebugInfo() {
  const { user, hydrated } = useAuth()
  const { 
    hasAnyDraft, 
    hasDrafts, 
    hasLocalDraft, 
    drafts, 
    localDraft, 
    getPrimaryDraft, 
    isLoading 
  } = useDrafts()

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  if (!hydrated || isLoading) {
    return (
      <Card className="mb-4 border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">🔍 Draft Debug Info</h3>
          <p className="text-yellow-700">Loading draft state...</p>
        </CardContent>
      </Card>
    )
  }

  const primaryDraft = getPrimaryDraft()

  return (
    <Card className="mb-4 border-yellow-200 bg-yellow-50">
      <CardContent className="p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">🔍 Draft Debug Info</h3>
        <div className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>User ID:</strong> {user?.id || 'None'}</p>
              <p><strong>Hydrated:</strong> {hydrated ? '✅' : '❌'}</p>
              <p><strong>Has Any Draft:</strong> {hasAnyDraft ? '✅' : '❌'}</p>
              <p><strong>Has DB Drafts:</strong> {hasDrafts ? '✅' : '❌'}</p>
              <p><strong>Has Local Draft:</strong> {hasLocalDraft ? '✅' : '❌'}</p>
            </div>
            <div>
              <p><strong>DB Drafts Count:</strong> {drafts.length}</p>
              <p><strong>Local Draft Title:</strong> {localDraft?.formData?.title || 'None'}</p>
              <p><strong>Primary Draft Type:</strong> {primaryDraft?.type || 'None'}</p>
              <p><strong>Primary Draft Title:</strong> {primaryDraft?.title || 'None'}</p>
            </div>
          </div>
          
          {drafts.length > 0 && (
            <div className="mt-3 p-2 bg-white rounded border">
              <p className="font-medium">Database Drafts:</p>
              <ul className="list-disc list-inside">
                {drafts.map((draft, index) => (
                  <li key={draft.id}>
                    {index + 1}. "{draft.title}" (ID: {draft.id})
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {localDraft && (
            <div className="mt-3 p-2 bg-white rounded border">
              <p className="font-medium">Local Draft:</p>
              <p>Title: "{localDraft.formData?.title || 'Untitled'}"</p>
              <p>Step: {localDraft.currentStep}</p>
              <p>Draft ID: {localDraft.draftId || 'None'}</p>
              <p>Last Saved: {localDraft.lastSaved?.toLocaleString() || 'Never'}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 