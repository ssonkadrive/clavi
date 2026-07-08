'use client'

import { useState } from 'react'

interface Academy {
  id: string
  name: string
  location: string
  subject: string
  pay: number
  cms_score: number
  certified: boolean
}

const mockData: Academy[] = []

export default function FindAcademiesPage() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const current = mockData[currentIndex]

  const handleApply = () => {
    alert(`${current.name}에 지원했습니다!`)
  }

  const handleSkip = () => {
    if (currentIndex < mockData.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">학원찾기</h1>

      {/* 학원 카드 */}
      <div className="bg-white rounded-lg border p-6 text-center space-y-4">
        <div className="text-6xl">🏫</div>
        <div>
          <h2 className="text-2xl font-bold">{current.name}</h2>
          <p className="text-gray-500">{current.location}</p>
        </div>

        {/* 과목 & 시급 */}
        <div className="space-y-2">
          <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm inline-block">
            {current.subject}
          </div>
          <p className="text-2xl font-bold text-green-600">{current.pay}원/시</p>
        </div>

        {/* CMS 점수 */}
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-gray-600">평가점수</p>
          <p className="text-3xl font-bold text-blue-600">{current.cms_score}</p>
        </div>

        {current.certified && (
          <div className="bg-green-50 p-2 rounded text-green-700 font-medium">
            ✓ 인증됨
          </div>
        )}
      </div>

      {/* 버튼 */}
      <div className="flex gap-3 justify-center">
        <button
          onClick={handleSkip}
          className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-bold"
        >
          👎 아니요
        </button>
        <button
          onClick={handleApply}
          className="bg-red-500 text-white px-6 py-3 rounded-lg font-bold"
        >
          ❤️ 지원하기
        </button>
      </div>

      {/* 진행도 */}
      <p className="text-center text-sm text-gray-500">
        {currentIndex + 1} / {mockData.length}
      </p>
    </div>
  )
}
