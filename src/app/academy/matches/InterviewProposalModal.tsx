'use client'

import { useState } from 'react'
import { createProposal } from './actions'

interface InterviewProposalModalProps {
  instructorUserId: string
  instructorName: string
}

export default function InterviewProposalModal({
  instructorUserId,
  instructorName,
}: InterviewProposalModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleProposal = async () => {
    setIsLoading(true)
    setError('')

    try {
      const result = await createProposal(instructorUserId)

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => {
          setIsOpen(false)
          setSuccess(false)
          // 페이지 새로고침 (제안 상태 업데이트)
          window.location.reload()
        }, 2000)
      }
    } catch (err) {
      setError('제안 중 오류가 발생했습니다.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
      >
        채용 제안하기
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              채용 제안
            </h2>
            <p className="text-gray-600 mb-6">
              <span className="font-semibold">{instructorName}</span> 강사에게 채용 제안을 보내시겠습니까?
            </p>
            <p className="text-sm text-gray-500 mb-6">
              제안을 보내면 강사가 수락 또는 거절할 수 있습니다. 수락 시 면접 일정을 제안할 수 있습니다.
            </p>

            {/* 에러 메시지 */}
            {error && (
              <div className="rounded-md bg-red-50 p-3 mb-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* 성공 메시지 */}
            {success && (
              <div className="rounded-md bg-green-50 p-3 mb-4">
                <p className="text-sm text-green-800">✓ 채용 제안이 전송되었습니다!</p>
              </div>
            )}

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 font-medium"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleProposal}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {isLoading ? '전송 중...' : '제안하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
