'use client'

import { useState } from 'react'
import { respondToInterviewProposal } from './actions'

interface InterviewResponseButtonProps {
  proposalId: string
  action: 'accepted' | 'declined'
  label: string
}

export default function InterviewResponseButton({
  proposalId,
  action,
  label,
}: InterviewResponseButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    setError('')

    try {
      const result = await respondToInterviewProposal(proposalId, action)

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        // 페이지 새로고침해서 최신 상태 반영
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      }
    } catch (err) {
      setError('응답 중 오류가 발생했습니다.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const buttonColor = action === 'accepted' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isLoading || success}
        className={`flex-1 ${buttonColor} text-white py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isLoading ? '처리 중...' : success ? '완료' : label}
      </button>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">응답이 저장되었습니다.</p>
        </div>
      )}
    </>
  )
}
