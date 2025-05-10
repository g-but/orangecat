'use client'

import { NextPage } from 'next'

interface PageProps {
  params: {
    id: string
  }
}

const EditFundingPage: NextPage<PageProps> = ({ params }) => {
  return (
    <div>
      <h1>Edit Page for ID: {params.id}</h1>
    </div>
  )
}

export default EditFundingPage 