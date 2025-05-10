'use client'

type PageProps = {
  params: {
    id: string
  }
}

export default function EditFundraisingCampaignPage({
  params,
}: PageProps) {
  return (
    <div>
      <h1>Edit Campaign: {params.id}</h1>
    </div>
  )
} 