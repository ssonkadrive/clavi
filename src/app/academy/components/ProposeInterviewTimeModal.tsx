'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { proposeInterviewTime } from '@/app/academy/matches/actions'

interface ProposeInterviewTimeModalProps {
  proposalId: string
  instructorName: string
}

// 로컬 시간대 기준 오늘 날짜 (YYYY-MM-DD) — date input의 min 값으로 사용
const getToday = () => new Date().toLocaleDateString('en-CA')

export default function ProposeInterviewTimeModal({
  proposalId,
  instructorName,
}: ProposeInterviewTimeModalProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const today = getToday()
  const [proposedDate, setProposedDate] = useState('')
  const [timeRangeStart, setTimeRangeStart] = useState('14:00')
  const [timeRangeEnd, setTimeRangeEnd] = useState('16:00')
  const [slotMinutes, setSlotMinutes] = useState(30)

  const resetForm = () => {
    setProposedDate('')
    setTimeRangeStart('14:00')
    setTimeRangeEnd('16:00')
    setSlotMinutes(30)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (!proposedDate) {
      setError('면접 날짜를 선택해주세요.')
      setIsLoading(false)
      return
    }

    try {
      const result = await proposeInterviewTime(
        proposalId,
        proposedDate,
        timeRangeStart,
        timeRangeEnd,
        slotMinutes
      )

      if (result.error) {
        setError(result.error)
      } else {
        // 모달을 닫고 상단 토스트 표시
        setIsOpen(false)
        resetForm()
        setToast(result.warning ? `✓ 면접 일정을 제안했습니다! (${result.warning})` : '✓ 면접 일정을 제안했습니다!')
        setTimeout(() => {
          setToast('')
          router.refresh()
        }, result.warning ? 4000 : 2000)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '오류가 발생했습니다.'
      setError(errorMessage)
      console.error('[ProposeInterviewTimeModal] 오류:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setIsOpen(false)
    resetForm()
  }

  return (
    <>
      {/* 성공 토스트 (InterviewResponseButton과 동일 스타일) */}
      {toast && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-[60] flex items-center gap-2">
          <span>{toast}</span>
        </div>
      )}

      {/* 버튼 */}
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md transition-colors font-medium"
      >
        면접 일정 제안하기
      </button>

      {/* 모달 배경 */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          {/* 모달 */}
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">면접 일정 제안</h2>
            <p className="text-gray-600 mb-6">{instructorName} 강사에게 면접 가능 일정을 제안합니다.</p>

            {/* 에러 메시지 */}
            {error && (
              <div className="rounded-md bg-red-50 p-4 mb-4">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}

            {/* 폼 */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 면접 날짜 */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  면접 날짜
                </label>
                <input
                  type="date"
                  value={proposedDate}
                  min={today}
                  onChange={(e) => setProposedDate(e.target.value)}
                  disabled={isLoading}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">오늘 이후 날짜만 선택할 수 있습니다.</p>
              </div>

              {/* 시작 시간 */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  면접 시작 시간
                </label>
                <input
                  type="time"
                  value={timeRangeStart}
                  onChange={(e) => setTimeRangeStart(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* 종료 시간 */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  면접 종료 시간
                </label>
                <input
                  type="time"
                  value={timeRangeEnd}
                  onChange={(e) => setTimeRangeEnd(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* 슬롯 단위 */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  면접 단위
                </label>
                <div className="space-y-2">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="slotMinutes"
                      value="30"
                      checked={slotMinutes === 30}
                      onChange={() => setSlotMinutes(30)}
                      disabled={isLoading}
                      className="w-4 h-4 text-blue-600 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <span className="ml-3 text-gray-700">30분 단위</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="slotMinutes"
                      value="60"
                      checked={slotMinutes === 60}
                      onChange={() => setSlotMinutes(60)}
                      disabled={isLoading}
                      className="w-4 h-4 text-blue-600 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <span className="ml-3 text-gray-700">60분 단위</span>
                  </label>
                </div>
              </div>

              {/* 버튼 그룹 */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-md transition-colors font-medium"
                >
                  {isLoading ? '제안 중...' : '제안하기'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-900 py-2 px-4 rounded-md transition-colors font-medium"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
