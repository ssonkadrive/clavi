'use client'

import { useState, useEffect } from 'react'
import { updateAcademyInfo } from './actions'

interface AcademyInfoFormProps {
  initialAcademyName: string
  initialRegion: string
}

export default function AcademyInfoForm({
  initialAcademyName,
  initialRegion,
}: AcademyInfoFormProps) {
  const [academyName, setAcademyName] = useState(initialAcademyName)
  const [region, setRegion] = useState(initialRegion)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setMessage(null)
    }, 3000)

    return () => clearTimeout(timer)
  }, [message])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!academyName.trim()) {
      setMessage({ type: 'error', text: '학원명을 입력해주세요.' })
      return
    }

    if (!region.trim()) {
      setMessage({ type: 'error', text: '지역을 입력해주세요.' })
      return
    }

    setSaving(true)
    try {
      const result = await updateAcademyInfo({
        academy_name: academyName.trim(),
        region: region.trim(),
      })

      if (result.success) {
        setMessage({ type: 'success', text: '학원 정보가 저장되었습니다.' })
      } else {
        setMessage({ type: 'error', text: result.error || '저장에 실패했습니다.' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '저장 중 오류가 발생했습니다.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {message && (
        <div
          className={`rounded-md p-4 ${
            message.type === 'success' ? 'bg-green-50' : 'bg-red-50'
          }`}
        >
          <p
            className={`text-sm font-medium ${
              message.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}
          >
            {message.text}
          </p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label htmlFor="academyName" className="block text-sm font-medium text-gray-700">
            학원명
          </label>
          <input
            id="academyName"
            type="text"
            value={academyName}
            onChange={(e) => setAcademyName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="학원명을 입력하세요"
          />
        </div>

        <div>
          <label htmlFor="region" className="block text-sm font-medium text-gray-700">
            지역
          </label>
          <input
            id="region"
            type="text"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="지역을 입력하세요"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-md bg-blue-600 py-2 px-4 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </form>
    </div>
  )
}
