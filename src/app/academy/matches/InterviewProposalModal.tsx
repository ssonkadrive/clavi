'use client'

import { useState, useEffect } from 'react'
import { submitInterviewProposal } from './actions'

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
  const [hasPendingProposal, setHasPendingProposal] = useState(false)
  const [formData, setFormData] = useState({
    proposedDate: '',
    proposedTime: '',
    message: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // 컴포넌트 마운트 시 기존 pending 제안 확인
  useEffect(() => {
    const checkPendingProposal = async () => {
      try {
        const response = await fetch('/api/check-pending-proposal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instructorUserId,
          }),
        })
        const data = await response.json()
        setHasPendingProposal(data.hasPending)
      } catch (err) {
        console.error('기존 제안 확인 중 에러:', err)
      }
    }

    checkPendingProposal()
  }, [instructorUserId])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await submitInterviewProposal(
        instructorUserId,
        formData.proposedDate,
        formData.proposedTime,
        formData.message
      )

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setFormData({ proposedDate: '', proposedTime: '', message: '' })
        setTimeout(() => {
          setIsOpen(false)
          setSuccess(false)
          setHasPendingProposal(true)
        }, 2000)
      }
    } catch (err) {
      setError('면접 제안 중 오류가 발생했습니다.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (hasPendingProposal) {
    return (
      <div className="w-full text-center py-2 px-4 bg-yellow-100 text-yellow-800 rounded-md text-sm font-medium">
        이미 제안을 보냈습니다
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
      >
        면접 제안하기
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              면접 제안하기
            </h2>
            <p className="text-gray-600 mb-6">
              {instructorName} 강사에게 면접을 제안합니다.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 제안 날짜 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  제안 날짜 <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  name="proposedDate"
                  value={formData.proposedDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 제안 시간 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  제안 시간 <span className="text-red-600">*</span>
                </label>
                <input
                  type="time"
                  name="proposedTime"
                  value={formData.proposedTime}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 메시지 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  추가 메시지
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="면접에 대한 추가 정보를 입력하세요."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="rounded-md bg-red-50 p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* 성공 메시지 */}
              {success && (
                <div className="rounded-md bg-green-50 p-3">
                  <p className="text-sm text-green-800">면접 제안이 전송되었습니다!</p>
                </div>
              )}

              {/* 버튼 */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? '전송 중...' : '제안 보내기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
