import { useParams } from 'react-router-dom'

export default function IssueDetail() {
  const { owner, repo, number } = useParams()

  return (
    <div className="flex items-center justify-center min-h-screen">
      <h1 style={{ fontFamily: "'Space Mono', monospace" }} className="text-3xl text-[#f0f6fc]">
        IssueDetail — {owner}/{repo}#{number}
      </h1>
    </div>
  )
}
