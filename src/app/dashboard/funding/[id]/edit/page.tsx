'use client'

type PageProps = {
  params: {
    id: string
  }
}

export default function EditFundingPage({
  params,
}: PageProps) {
  return (
    <div>
      <h1>Edit Page for ID: {params.id}</h1>
    </div>
  )
} 