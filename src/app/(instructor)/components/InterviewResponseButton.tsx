'use client'

import { useState, useEffect } from 'react'
import { respondProposal } from '@/app/academy/matches/actions'

interface InterviewResponseButtonProps {
  proposalId: string
  instructorUserId: string
  academyName: string
}

export default function InterviewResponseButton({
  proposalId,
  instructorUserId,
  academyName,
}: InterviewResponseButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showToast, setShowToast] = useState(false)

  // 토스트 메시지 자동 사라지기
  useEffect(() => {
    if (success) {
      setShowToast(true)
      const timer = setTimeout(() => {
        window.location.reload()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [success])

  const handleResponse = async (response: 'accept' | 'reject') => {
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await respondProposal(proposalId, response)

      if (result.error) {
        setError(result.error)
      } else {
        const message = response === 'accept' ? '수락했습니다!' : '거절했습니다.'
        setSuccess(message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '오류가 발생했습니다.'
      setError(errorMessage)
      console.error('[InterviewResponseButton] 오류:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* 토스트 메시지 (성공/에러) */}
      {success && showToast && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-in fade-in">
          <span className="text-xl">✓</span>
          <span>{success}</span>
        </div>
      )}

      {error && !success && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-in fade-in">
          <span className="text-xl">✗</span>
          <span>{error}</span>
        </div>
      )}

      {/* 응답 버튼 (성공 후에는 숨김) */}
      {!success && (
        <div className="mt-8 border-t pt-8">
          {/* 에러 메시지 */}
          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-4">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          {/* 버튼 그룹 */}
          <div className="flex gap-3">
            <button
              onClick={() => handleResponse('accept')}
              disabled={isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-md transition-colors font-medium text-lg"
            >
              {isLoading ? '처리 중...' : '✓ 수락'}
            </button>
            <button
              onClick={() => handleResponse('reject')}
              disabled={isLoading}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-md transition-colors font-medium text-lg"
            >
              {isLoading ? '처리 중...' : '✗ 거절'}
            </button>
          </div>

          {/* 안내 문구 */}
          <p className="text-sm text-gray-600 mt-4 text-center">
            {academyName}의 채용 제안에 수락 또는 거절을 선택해주세요.
          </p>
        </div>
      )}
    </>
  )
}
