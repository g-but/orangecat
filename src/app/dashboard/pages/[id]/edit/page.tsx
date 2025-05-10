'use client'

interface Props {
  params: {
    id: string
  }
}

const EditFundingPage = ({ params }: Props) => {
  return (
    <div>
      <h1>Edit Page for ID: {params.id}</h1>
    </div>
  )
}

export default EditFundingPage 