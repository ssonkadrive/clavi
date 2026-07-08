'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import SkillCheckboxes from '@/components/SkillCheckboxes'
import { updateAcademyConditions } from './actions'

interface SkillCategory {
  id: string
  parent_id: string | null
  level: 'major' | 'middle' | 'minor'
  name: string
  display_order: number
  is_active: boolean
}

interface ConditionsData {
  regions?: string | null
  pay_min?: number | null
  pay_max?: number | null
  weekdays?: string | null
  description?: string | null
  required_skills?: string[] | null
}

interface ConditionsFormProps {
  userId: string
  categories: SkillCategory[]
  initialRequiredSkills?: string[]
  initialConditions?: ConditionsData
}

export default function ConditionsForm({
  userId,
  categories,
  initialRequiredSkills = [],
  initialConditions = {},
}: ConditionsFormProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [region, setRegion] = useState('')
  const [payMin, setPayMin] = useState('')
  const [payMax, setPayMax] = useState('')
  const [weekdays, setWeekdays] = useState('all')
  const [description, setDescription] = useState('')

  console.log('[ConditionsForm] 마운트됨, initialConditions:', initialConditions)

  useEffect(() => {
    if (initialConditions) {
      setRegion(initialConditions.regions || '')
      setPayMin(initialConditions.pay_min ? String(initialConditions.pay_min) : '')
      setPayMax(initialConditions.pay_max ? String(initialConditions.pay_max) : '')
      setWeekdays(initialConditions.weekdays || 'all')
      setDescription(initialConditions.description || '')
    }
  }, [initialConditions])

  const handleSave = async (requiredSkillIds: string[]) => {
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      console.log('[ConditionsForm] 저장 시작:', {
        userId,
        requiredSkillIds,
      })

      const result = await updateAcademyConditions({
        userId,
        region: region.trim() || '미설정',
        payMin: payMin ? parseInt(payMin) : null,
        payMax: payMax ? parseInt(payMax) : null,
        weekdays,
        description: description.trim(),
        requiredSkills: requiredSkillIds,
      })

      if (result.error) {
        console.error('[ConditionsForm] 저장 실패:', result.error)
        setError(result.error)
        return
      }

      setSuccess('조건이 저장되었습니다!')
      setTimeout(() => {
        router.push('/academy')
      }, 1500)
    } catch (err) {
      console.error('[ConditionsForm] 저장 중 오류:', err)
      setError('저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-8">
      {/* 에러 메시지 */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      {/* 성공 메시지 */}
      {success && (
        <div className="rounded-md bg-green-50 p-4 border border-green-200">
          <p className="text-sm font-medium text-green-800">{success}</p>
        </div>
      )}

      {/* 기본 조건 섹션 */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">기본 조건</h2>

        <div className="space-y-6">
          {/* 지역 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              지역 <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              disabled={isSaving}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              placeholder="예: 서울 강남구"
            />
          </div>

          {/* 시급 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                최소 시급
              </label>
              <input
                type="number"
                value={payMin}
                onChange={(e) => setPayMin(e.target.value)}
                disabled={isSaving}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="예: 10000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                최대 시급
              </label>
              <input
                type="number"
                value={payMax}
                onChange={(e) => setPayMax(e.target.value)}
                disabled={isSaving}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="예: 15000"
              />
            </div>
          </div>

          {/* 근무 요일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              근무 요일
            </label>
            <select
              value={weekdays}
              onChange={(e) => setWeekdays(e.target.value)}
              disabled={isSaving}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="all">요일 무관</option>
              <option value="weekdays">평일만</option>
              <option value="weekends">주말만</option>
            </select>
          </div>

          {/* 추가 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              추가 설명
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSaving}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              placeholder="원하는 강사의 특징이나 추가 요구사항을 입력하세요."
              rows={4}
            />
          </div>
        </div>
      </div>

      {/* 필요 역량 섹션 */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">필요 역량 (스킬)</h2>
        <p className="text-sm text-gray-600 mb-4">
          이곳에서 선택한 스킬은 강사와의 매칭을 위한 CMS(CLAVI Match Score) 계산에 사용됩니다.
        </p>
        <SkillCheckboxes
          categories={categories}
          initialSelectedIds={initialRequiredSkills}
          type="academy"
          onSave={handleSave}
        />
      </div>
    </div>
  )
}
