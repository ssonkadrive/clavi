'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { sendMessage, getMessages } from '../../[id]/messages/actions'

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
  sender_type: 'instructor' | 'academy'
}

export default function AcademyProposalMessagesPage() {
  const params = useParams()
  const proposalId = params.id as string

  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  console.log('[AcademyProposalMessagesPage] 마운트됨, proposalId:', proposalId)

  // 메시지 자동 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 초기 메시지 로드 및 현재 사용자 ID 가져오기
  useEffect(() => {
    if (!proposalId) {
      console.log('[AcademyProposalMessagesPage] proposalId가 없습니다.')
      setIsLoading(false)
      return
    }

    const loadMessages = async () => {
      console.log('[AcademyProposalMessagesPage] 메시지 로드 시작:', proposalId)
      setIsLoading(true)
      setError('')

      try {
        const result = await getMessages(proposalId)
        console.log('[AcademyProposalMessagesPage] 메시지 로드 결과:', {
          hasError: !!result.error,
          messageCount: result.data?.messages?.length || 0,
        })

        if (result.error) {
          setError(result.error)
          setMessages([])
        } else if (result.data) {
          setMessages(result.data.messages || [])
          setCurrentUserId(result.data.currentUserId || '')
        }
      } catch (err) {
        console.error('[AcademyProposalMessagesPage] 메시지 로드 실패:', err)
        setError('메시지를 불러올 수 없습니다.')
        setMessages([])
      } finally {
        setIsLoading(false)
      }
    }

    loadMessages()
  }, [proposalId])

  // 메시지 전송
  const handleSendMessage = async (e: React.FormEvent) => {
    console.log('[handleSendMessage] 폼 제출됨')
    e.preventDefault()

    if (!newMessage.trim()) {
      console.log('[handleSendMessage] 메시지가 비어있음')
      return
    }

    console.log('[handleSendMessage] 메시지 전송 준비:', {
      proposalId,
      messageLength: newMessage.trim().length,
    })

    setIsSending(true)
    setError('')

    try {
      console.log('[handleSendMessage] sendMessage 호출:', proposalId, newMessage.trim())
      const result = await sendMessage(proposalId, newMessage.trim())

      console.log('[handleSendMessage] sendMessage 응답:', result)

      if (result.error) {
        console.error('[handleSendMessage] 에러 응답:', result.error)
        setError(result.error)
      } else if (result.data) {
        console.log('[handleSendMessage] 성공 응답, 메시지 추가:', result.data)
        setMessages([...messages, result.data])
        setNewMessage('')
        console.log('[handleSendMessage] 메시지 목록 업데이트 완료')
      }
    } catch (err) {
      console.error('[handleSendMessage] 예외 발생:', err)
      setError('메시지 전송에 실패했습니다.')
    } finally {
      setIsSending(false)
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()

    if (isToday) {
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">면접 메시지</h1>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-700">메시지를 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">면접 메시지</h1>
          <Link
            href={`/academy/proposals/${proposalId}`}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            상세보기
          </Link>
        </div>

        {/* 메시지 컨테이너 */}
        <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col h-screen md:h-auto md:min-h-96">
          {/* 메시지 목록 */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">아직 메시지가 없습니다.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isCurrentUser = msg.sender_id === currentUserId
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${
                        isCurrentUser
                          ? 'bg-blue-500 text-white rounded-br-none'
                          : 'bg-gray-200 text-gray-900 rounded-bl-none'
                      }`}
                    >
                      <p className="break-words text-sm md:text-base">{msg.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isCurrentUser ? 'text-blue-100' : 'text-gray-600'
                        }`}
                      >
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border-t border-red-200 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* 입력창 */}
          <form onSubmit={handleSendMessage} className="border-t p-4 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="메시지를 입력하세요..."
                disabled={isSending}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              />
              <button
                type="submit"
                disabled={isSending || !newMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                {isSending ? '전송 중...' : '전송'}
              </button>
            </div>
          </form>
        </div>

        {/* 돌아가기 버튼 (모바일) */}
        <div className="mt-6 md:hidden">
          <Link
            href={`/academy/proposals/${proposalId}`}
            className="block text-center bg-gray-200 hover:bg-gray-300 text-gray-900 py-2 px-4 rounded-lg transition-colors font-medium"
          >
            돌아가기
          </Link>
        </div>
      </div>
    </div>
  )
}
