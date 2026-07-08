'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ProfileEditPage() {
  const router = useRouter()
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // 프로필 데이터
  const [name, setName] = useState('')
  const [education, setEducation] = useState('')
  const [degreeType, setDegreeType] = useState('')
  const [degreeStatus, setDegreeStatus] = useState('')
  const [currentUserId, setCurrentUserId] = useState('')

  console.log('[ProfileEditPage] 페이지 로드 시작')

  // 초기 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setError('')

      try {
        // 현재 사용자 정보 가져오기
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setError('로그인이 필요합니다.')
          router.push('/auth/signin')
          return
        }

        setCurrentUserId(user.id)

        // 강사 프로필 정보 조회
        const { data: profileData } = await supabase
          .from('instructor_profiles')
          .select('name, education, degree_type, degree_status')
          .eq('user_id', user.id)
          .single()

        if (profileData) {
          setName(profileData.name || '')
          setEducation(profileData.education || '')
          setDegreeType(profileData.degree_type || '')
          setDegreeStatus(profileData.degree_status || '')
        }
      } catch (err) {
        console.error('[ProfileEditPage] 데이터 로드 실패:', err)
        setError('데이터를 불러올 수 없습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [supabase, router])

  // 저장 핸들러
  const handleSave = async () => {
    if (!name.trim()) {
      setError('이름은 필수입니다.')
      return
    }

    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      // 강사 프로필 정보 업데이트
      const { error: updateError } = await supabase
        .from('instructor_profiles')
        .update({
          name: name.trim(),
          education: education.trim(),
          degree_type: degreeType,
          degree_status: degreeStatus,
        })
        .eq('user_id', currentUserId)

      if (updateError) {
        console.error('[ProfileEditPage] 프로필 업데이트 실패:', updateError)
        setError('프로필 저장에 실패했습니다.')
        return
      }

      setSuccess('프로필이 저장되었습니다!')
      setTimeout(() => {
        router.push('/profile')
      }, 1500)
    } catch (err) {
      console.error('[ProfileEditPage] 저장 중 오류:', err)
      setError('저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">프로필 수정</h1>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-700">로딩 중...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/profile" className="text-blue-600 hover:text-blue-700 mb-6 inline-block font-medium">
          ← 뒤로 가기
        </Link>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">프로필 수정</h1>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {/* 성공 메시지 */}
        {success && (
          <div className="mb-6 rounded-md bg-green-50 p-4 border border-green-200">
            <p className="text-sm font-medium text-green-800">{success}</p>
          </div>
        )}

        {/* 기본 정보 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">기본 정보</h2>

          <div className="space-y-6">
            {/* 이름 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이름 <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSaving}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                placeholder="강사 이름을 입력하세요"
              />
            </div>

            {/* 학력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                학력
              </label>
              <input
                type="text"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                disabled={isSaving}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                placeholder="예: 서울대학교"
              />
            </div>

            {/* 학위 유형 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                학위 유형
              </label>
              <input
                type="text"
                value={degreeType}
                onChange={(e) => setDegreeType(e.target.value)}
                disabled={isSaving}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                placeholder="예: 학사, 석사, 박사"
              />
            </div>

            {/* 학위 상태 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                학위 상태
              </label>
              <select
                value={degreeStatus}
                onChange={(e) => setDegreeStatus(e.target.value)}
                disabled={isSaving}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="">선택하세요</option>
                <option value="completed">취득 완료</option>
                <option value="pursuing">취득 중</option>
                <option value="not_pursuing">미취득</option>
              </select>
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="space-y-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg transition-colors font-medium"
          >
            {isSaving ? '저장 중...' : '저장'}
          </button>
          <Link
            href="/profile"
            className="block w-full text-center bg-gray-200 hover:bg-gray-300 text-gray-900 py-3 px-4 rounded-lg transition-colors font-medium"
          >
            취소
          </Link>
        </div>
      </div>
    </div>
  )
}
