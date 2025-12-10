"use client"

import { useState } from 'react'
import { EntityForm } from '@/components/create/EntityForm'
import { assetConfig, type AssetFormData } from '@/config/entity-configs'
import { AssetTemplates, type AssetTemplate } from '@/components/create/templates'

export default function CreateAssetPage() {
  const [initialValues, setInitialValues] = useState<Partial<AssetFormData>>({})

  const handleTemplateSelect = (template: AssetTemplate) => {
    setInitialValues(template.data)
  }

  return (
    <div className="space-y-10">
      <EntityForm config={assetConfig} initialValues={initialValues} />
      <AssetTemplates onSelectTemplate={handleTemplateSelect} />
    </div>
  )
}
