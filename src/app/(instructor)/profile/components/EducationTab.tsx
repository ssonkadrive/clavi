'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Education {
  school_name: string
  degree: string
  major: string
  graduation_year: number
}

const DEFAULT_EDUCATION: Education = {
  school_name: '',
  degree: '대졸',
  major: '',
  graduation_year: new Date().getFullYear(),
}

export default function EducationTab() {
  const [education, setEducation] = useState<Education>(DEFAULT_EDUCATION)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadEducation()
  }, [])

  const loadEducation = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) {
        setEducation(DEFAULT_EDUCATION)
        return
      }

      const userId = authData.user.id
      if (!userId) {
        console.error('[EducationTab] userId가 없습니다')
        setEducation(DEFAULT_EDUCATION)
        return
      }

      console.log('[EducationTab] 학력 로드 시작, userId:', userId, '타입:', typeof userId)

      const { data, error } = await supabase
        .from('instructor_profiles')
        .select('education')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('[EducationTab] DB 조회 에러:', error)
        // 행이 없으면 기본값 사용
        setEducation(DEFAULT_EDUCATION)
      } else if (data?.education) {
        // 로드된 데이터 상세 로깅
        console.log('[EducationTab] 로드된 education 원본:', JSON.stringify(data.education, null, 2))
        console.log('[EducationTab] education 타입:', typeof data.education)
        console.log('[EducationTab] education은 객체인가:', data.education !== null && typeof data.education === 'object')

        // 로드된 데이터 확인 및 안전하게 설정
        const loaded = data.education as Partial<Education>
        console.log('[EducationTab] 파싱된 필드들:', {
          school_name: loaded.school_name,
          degree: loaded.degree,
          major: loaded.major,
          graduation_year: loaded.graduation_year,
        })

        setEducation({
          school_name: loaded.school_name ?? '',
          degree: loaded.degree ?? '대졸',
          major: loaded.major ?? '',
          graduation_year: typeof loaded.graduation_year === 'number' ? loaded.graduation_year : new Date().getFullYear(),
        })
      } else {
        console.log('[EducationTab] data.education이 없음:', data)
        setEducation(DEFAULT_EDUCATION)
      }
    } catch (err) {
      console.error('[EducationTab] 학력 로드 실패:', err)
      setEducation(DEFAULT_EDUCATION)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      // 데이터 유효성 확인
      if (!education.school_name.trim()) {
        alert('학교명을 입력하세요.')
        return
      }

      setIsSaving(true)

      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) throw new Error('사용자 정보 없음')

      const userId = authData.user.id
      if (!userId) throw new Error('userId가 없습니다')

      console.log('[EducationTab] 저장 시작, userId:', userId)
      console.log('[EducationTab] 저장할 데이터:', JSON.stringify(education, null, 2))
      console.log('[EducationTab] 데이터 타입:', {
        school_name: typeof education.school_name,
        degree: typeof education.degree,
        major: typeof education.major,
        graduation_year: typeof education.graduation_year,
      })

      // education 객체를 명시적으로 구성
      const educationPayload = {
        school_name: education.school_name || '',
        degree: education.degree || '대졸',
        major: education.major || '',
        graduation_year: education.graduation_year || new Date().getFullYear(),
      }

      console.log('[EducationTab] 명시적 payload:', JSON.stringify(educationPayload, null, 2))

      // 먼저 update 시도 (기존 행 업데이트)
      const { data: updateData, error: updateError, status: updateStatus } = await supabase
        .from('instructor_profiles')
        .update({ education: educationPayload })
        .eq('user_id', userId)

      console.log('[EducationTab] UPDATE 결과:', {
        status: updateStatus,
        data: updateData,
        error: updateError,
      })

      if (updateError) {
        // 특정 에러 코드 확인
        console.log('[EducationTab] UPDATE 에러 상세:', {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
        })

        // 행이 없으면 insert 시도 (새 행 생성)
        if (updateError.code === 'PGRST116' || updateError.code === 'NODATA' || updateStatus === 406) {
          console.log('[EducationTab] 기존 데이터 없음, INSERT 시도')

          const { data: insertData, error: insertError } = await supabase
            .from('instructor_profiles')
            .insert({ user_id: userId, education: educationPayload })

          console.log('[EducationTab] INSERT 결과:', {
            data: insertData,
            error: insertError,
          })

          if (insertError) throw insertError
        } else {
          throw updateError
        }
      }

      console.log('[EducationTab] 저장 완료')

      // 저장 후 다시 조회하여 실제로 뭐가 저장되었는지 확인
      console.log('[EducationTab] 저장 후 검증 시작...')
      const { data: verifyData, error: verifyError } = await supabase
        .from('instructor_profiles')
        .select('education')
        .eq('user_id', userId)
        .single()

      if (verifyError) {
        console.error('[EducationTab] 검증 조회 실패:', verifyError)
      } else {
        console.log('[EducationTab] 저장된 데이터 검증:', JSON.stringify(verifyData, null, 2))
        console.log('[EducationTab] 각 필드 확인:', {
          school_name: verifyData?.education?.school_name,
          degree: verifyData?.education?.degree,
          major: verifyData?.education?.major,
          graduation_year: verifyData?.education?.graduation_year,
        })
      }

      alert('학력이 저장되었습니다.')

      // 저장 후 재로드하여 상태 확인
      await loadEducation()
    } catch (err) {
      const message = err instanceof Error ? err.message : '알 수 없는 에러'
      console.error('[EducationTab] 저장 실패:', message, err)
      alert('저장 실패: ' + message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">로딩 중...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">학교명</label>
        <input
          type="text"
          value={education.school_name}
          onChange={(e) =>
            setEducation({ ...education, school_name: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="예: 서울대학교"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">학위</label>
        <select
          value={education.degree}
          onChange={(e) =>
            setEducation({ ...education, degree: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="초졸">초졸</option>
          <option value="중졸">중졸</option>
          <option value="고졸">고졸</option>
          <option value="대졸">대졸</option>
          <option value="대학원">대학원</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">전공</label>
        <input
          type="text"
          value={education.major}
          onChange={(e) =>
            setEducation({ ...education, major: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="예: 국어국문학"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">졸업년도</label>
        <input
          type="number"
          value={education.graduation_year || new Date().getFullYear()}
          onChange={(e) => {
            const year = e.target.value ? parseInt(e.target.value) : new Date().getFullYear()
            setEducation({
              ...education,
              graduation_year: isNaN(year) ? new Date().getFullYear() : year,
            })
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="1950"
          max={new Date().getFullYear()}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-medium"
      >
        {isSaving ? '저장 중...' : '저장하기'}
      </button>
    </div>
  )
}
