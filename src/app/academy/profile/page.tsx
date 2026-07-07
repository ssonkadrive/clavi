'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AcademyProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [academyName, setAcademyName] = useState('')
  const [region, setRegion] = useState('')
  const [bio, setBio] = useState('')
  const [contact, setContact] = useState('')

  console.log('[AcademyProfilePage] 페이지 로드 시작')

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true)
      setError('')

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setError('로그인이 필요합니다.')
          router.push('/signin')
          return
        }

        const { data: academy } = await supabase
          .from('academies')
          .select('academy_name, region, bio, contact')
          .eq('user_id', user.id)
          .single()

        if (academy) {
          setAcademyName(academy.academy_name || '')
          setRegion(academy.region || '')
          setBio(academy.bio || '')
          setContact(academy.contact || '')
        }
      } catch (err) {
        console.error('[AcademyProfilePage] 로드 실패:', err)
        setError('프로필을 불러올 수 없습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [supabase, router])

  const handleSave = async () => {
    if (!academyName.trim()) {
      setError('학원명은 필수입니다.')
      return
    }

    if (!region.trim()) {
      setError('지역은 필수입니다.')
      return
    }

    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('로그인이 필요합니다.')
        return
      }

      const { error: updateError } = await supabase
        .from('academies')
        .update({
          academy_name: academyName.trim(),
          region: region.trim(),
          bio: bio.trim(),
          contact: contact.trim(),
        })
        .eq('user_id', user.id)

      if (updateError) {
        console.error('[AcademyProfilePage] 저장 실패:', updateError)
        setError('프로필 저장에 실패했습니다.')
        return
      }

      setSuccess('프로필이 저장되었습니다!')
      setIsEditing(false)
      setTimeout(() => {
        router.push('/academy')
      }, 1500)
    } catch (err) {
      console.error('[AcademyProfilePage] 저장 중 오류:', err)
      setError('저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">학원 프로필</h1>
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
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">학원 프로필</h1>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              수정
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-md bg-green-50 p-4 border border-green-200">
            <p className="text-sm font-medium text-green-800">{success}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              학원명 <span className="text-red-600">*</span>
            </label>
            {isEditing ? (
              <input
                type="text"
                value={academyName}
                onChange={(e) => setAcademyName(e.target.value)}
                disabled={isSaving}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="학원명을 입력하세요"
              />
            ) : (
              <p className="text-gray-900">{academyName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              지역 <span className="text-red-600">*</span>
            </label>
            {isEditing ? (
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                disabled={isSaving}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="지역을 입력하세요"
              />
            ) : (
              <p className="text-gray-900">{region}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              소개
            </label>
            {isEditing ? (
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={isSaving}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="학원 소개를 입력하세요"
                rows={4}
              />
            ) : (
              <p className="text-gray-900 whitespace-pre-wrap">{bio || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              연락처
            </label>
            {isEditing ? (
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                disabled={isSaving}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="예: 02-123-4567"
              />
            ) : (
              <p className="text-gray-900">{contact || '-'}</p>
            )}
          </div>

          {isEditing && (
            <div className="space-y-3 pt-6">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg transition-colors font-medium"
              >
                {isSaving ? '저장 중...' : '저장'}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
                className="w-full bg-gray-200 hover:bg-gray-300 disabled:bg-gray-400 text-gray-900 py-3 px-4 rounded-lg transition-colors font-medium"
              >
                취소
              </button>
            </div>
          )}

          {!isEditing && (
            <div className="flex gap-3 pt-6">
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors font-medium"
              >
                수정하기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
