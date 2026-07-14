'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { selectInterviewTime } from '@/app/(instructor)/matches/actions'

interface SelectInterviewTimeModalProps {
  proposalId: string
  proposedDate: string // YYYY-MM-DD
  timeRangeStart: string // HH:MM
  timeRangeEnd: string // HH:MM
  slotMinutes: number // 30 또는 60
  interviewDate?: string // 이미 선택된 면접 날짜
  interviewTime?: string // 이미 선택된 면접 시간
}

export default function SelectInterviewTimeModal({
  proposalId,
  proposedDate,
  timeRangeStart,
  timeRangeEnd,
  slotMinutes,
  interviewDate,
  interviewTime,
}: SelectInterviewTimeModalProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  // 이미 선택된 시간이 있으면 초기값으로 설정
  const [selectedTime, setSelectedTime] = useState(interviewTime || '')

  // 이미 면접 시간이 확정된 상태인지 확인
  const isAlreadySelected = !!interviewDate && !!interviewTime

  // 시간 슬롯 생성 (proposedDate 내에서)
  const timeSlots = useMemo(() => {
    const [startHour, startMin] = timeRangeStart.split(':').map(Number)
    const [endHour, endMin] = timeRangeEnd.split(':').map(Number)

    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin

    const slots: string[] = []
    let current = startMinutes

    while (current < endMinutes) {
      const hour = String(Math.floor(current / 60)).padStart(2, '0')
      const min = String(current % 60).padStart(2, '0')
      slots.push(`${hour}:${min}`)
      current += slotMinutes
    }

    return slots
  }, [timeRangeStart, timeRangeEnd, slotMinutes])

  // 날짜 포매팅 (2026-07-13 → "7월 13일")
  const formatProposedDate = () => {
    const date = new Date(proposedDate + 'T00:00:00')
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${month}월 ${day}일`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (!selectedTime) {
      setError('면접 시간을 선택해주세요.')
      setIsLoading(false)
      return
    }

    try {
      const result = await selectInterviewTime(proposalId, selectedTime)

      if (result.error) {
        setError(result.error)
      } else {
        // 토스트 표시 후 모달 닫기
        const toastMessage = isAlreadySelected
          ? `✓ 면접 시간이 변경되었습니다!`
          : `✓ ${formatProposedDate()} ${selectedTime}에 면접이 확정되었습니다!`

        setToast(toastMessage)
        setTimeout(() => {
          setIsOpen(false)
          setSelectedTime('')
          setToast('')
          router.refresh()
        }, 1000)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '오류가 발생했습니다.'
      setError(errorMessage)
      console.error('[SelectInterviewTimeModal] 오류:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setIsOpen(false)
    // 이미 선택된 경우 원래 값으로 복원, 아니면 초기화
    setSelectedTime(interviewTime || '')
    setError('')
  }

  return (
    <>
      {/* 성공 토스트 */}
      {toast && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-md z-[60] flex items-center gap-2">
          <span>{toast}</span>
        </div>
      )}

      {/* 버튼 */}
      {isAlreadySelected ? (
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-900">
              면접이 이미 확정되었습니다: <span className="font-semibold">{formatProposedDate()} {interviewTime}</span>
            </p>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 px-6 rounded-lg transition-colors font-bold"
          >
            변경하기
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-lg transition-colors font-medium"
        >
          면접 시간 선택하기
        </button>
      )}

      {/* 모달 배경 */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          {/* 모달 */}
          <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isAlreadySelected ? '면접 시간 변경' : '면접 시간 선택'}
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              {isAlreadySelected ? (
                <>
                  현재 선택: <span className="font-semibold">{formatProposedDate()} {interviewTime}</span>
                  <br />
                  <span className="text-xs text-gray-500">다른 시간으로 변경할 수 있습니다.</span>
                </>
              ) : (
                <>
                  {formatProposedDate()} {timeRangeStart}~{timeRangeEnd} 범위에서 원하는 시간을 선택해주세요.
                  <br />
                  <span className="text-xs text-gray-500">({slotMinutes}분 단위)</span>
                </>
              )}
            </p>

            {/* 에러 메시지 */}
            {error && (
              <div className="rounded-lg bg-red-50 p-4 mb-4">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}

            {/* 폼 */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 시간 슬롯 그리드 */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  면접 시간 선택
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {timeSlots.map((time) => {
                    const isCurrentTime = time === interviewTime
                    const isSelected = selectedTime === time

                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        disabled={isLoading}
                        className={`py-2 px-3 rounded-lg font-medium text-sm transition-all relative ${
                          isSelected
                            ? 'bg-green-500 text-white shadow-md'
                            : isCurrentTime
                            ? 'bg-blue-100 text-blue-900 border-2 border-blue-500'
                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                        } ${isLoading ? 'disabled:cursor-not-allowed disabled:opacity-50' : ''}`}
                      >
                        {time}
                        {isCurrentTime && <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">✓</span>}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 선택된 시간 표시 */}
              {selectedTime && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    선택된 시간: <span className="font-semibold">{formatProposedDate()} {selectedTime}</span>
                  </p>
                </div>
              )}

              {/* 버튼 그룹 */}
              <div className="flex gap-3 pt-4">
                {isAlreadySelected ? (
                  <>
                    <button
                      type="submit"
                      disabled={isLoading || selectedTime === interviewTime}
                      className="flex-1 bg-blue-700 hover:bg-blue-800 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg transition-colors font-bold"
                    >
                      {isLoading ? '변경 중...' : '변경하기'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={isLoading}
                      className="flex-1 bg-gray-400 hover:bg-gray-500 disabled:bg-gray-300 text-white py-3 px-4 rounded-lg transition-colors font-semibold"
                    >
                      유지하기
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="submit"
                      disabled={isLoading || !selectedTime}
                      className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg transition-colors font-semibold"
                    >
                      {isLoading ? '확정 중...' : '확정하기'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={isLoading}
                      className="flex-1 bg-gray-400 hover:bg-gray-500 disabled:bg-gray-300 text-white py-3 px-4 rounded-lg transition-colors font-semibold"
                    >
                      취소
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
