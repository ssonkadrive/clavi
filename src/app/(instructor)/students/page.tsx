'use client'

import { useEffect, useState } from 'react'
import { getStudentSessions, respondToSessionRequest } from './actions'
import type { StudentSessionRequest } from './actions'

const STATUS_LABEL: Record<StudentSessionRequest['status'], string> = {
  pending: '대기중',
  accepted: '수락됨',
  rejected: '거절됨',
  completed: '완료',
}

const STATUS_STYLE: Record<StudentSessionRequest['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-gray-200 text-gray-600',
  completed: 'bg-blue-100 text-blue-700',
}

export default function InstructorStudentsPage() {
  const [requests, setRequests] = useState<StudentSessionRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [respondingId, setRespondingId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data, error } = await getStudentSessions()
      if (error || !data) {
        setLoadError(error || '데이터를 불러올 수 없습니다.')
      } else {
        setRequests(data)
      }
      setIsLoading(false)
    }
    load()
  }, [])

  const handleRespond = async (sessionId: string, status: 'accepted' | 'rejected') => {
    setRespondingId(sessionId)
    const result = await respondToSessionRequest(sessionId, status)
    setRespondingId(null)

    if (result.success) {
      setRequests((prev) =>
        prev.map((r) => (r.id === sessionId ? { ...r, status } : r))
      )
    } else {
      alert(result.error || '처리에 실패했습니다.')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 pb-24">
        <div className="max-w-2xl mx-auto text-center py-12">
          <p className="text-gray-600">수강 신청 목록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 pb-24">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">수강 신청 관리</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">{loadError}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 pb-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">수강 신청 관리</h1>

        {requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-600">아직 수강 신청이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {request.studentName}
                    </h3>
                    {request.grade && (
                      <p className="text-sm text-gray-500">{request.grade}</p>
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_STYLE[request.status]}`}
                  >
                    {STATUS_LABEL[request.status]}
                  </span>
                </div>

                {request.interests.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {request.interests.map((interest) => (
                      <span
                        key={interest}
                        className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-xs text-gray-400 mb-3">
                  신청일: {new Date(request.requestedAt).toLocaleDateString('ko-KR')}
                </p>

                {request.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRespond(request.id, 'accepted')}
                      disabled={respondingId === request.id}
                      className="flex-1 py-2 px-4 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                    >
                      수락
                    </button>
                    <button
                      onClick={() => handleRespond(request.id, 'rejected')}
                      disabled={respondingId === request.id}
                      className="flex-1 py-2 px-4 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:bg-gray-400 transition-colors"
                    >
                      거절
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
