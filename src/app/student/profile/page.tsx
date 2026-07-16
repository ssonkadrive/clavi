'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface StudentProfile {
  name: string
  grade?: string
  interests?: string
  profile_image_url?: string
}

export default function StudentProfilePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState<StudentProfile>({
    name: '',
    grade: '',
    interests: '',
    profile_image_url: '',
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const supabase = createClient()
        const { data: userData } = await supabase.auth.getUser()

        if (!userData.user) {
          setError('사용자 정보를 불러올 수 없습니다.')
          return
        }

        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('name, grade, interests, profile_image_url')
          .eq('user_id', userData.user.id)
          .single()

        if (studentError && studentError.code !== 'PGRST116') {
          throw studentError
        }

        if (studentData) {
          setProfile({
            name: studentData.name || '',
            grade: studentData.grade || '',
            interests: studentData.interests || '',
            profile_image_url: studentData.profile_image_url || '',
          })
        }
      } catch (err) {
        console.error('Profile load error:', err)
        setError('프로필 로드에 실패했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleSave = async () => {
    try {
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        setError('사용자 정보를 불러올 수 없습니다.')
        return
      }

      const { error: updateError } = await supabase
        .from('students')
        .update({
          name: profile.name,
          grade: profile.grade,
          interests: profile.interests,
        })
        .eq('user_id', userData.user.id)

      if (updateError) throw updateError

      alert('프로필이 저장되었습니다.')
      setIsEditing(false)
    } catch (err) {
      console.error('Save error:', err)
      setError('프로필 저장에 실패했습니다.')
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">로딩 중...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">프로필</h1>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {isEditing ? '취소' : '수정하기'}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          {/* 프로필 이미지 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">프로필 사진</label>
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-4xl">
              {profile.profile_image_url ? (
                <img
                  src={profile.profile_image_url}
                  alt="프로필"
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                '📷'
              )}
            </div>
          </div>

          {/* 이름 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">이름</label>
            {isEditing ? (
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900">{profile.name || '-'}</p>
            )}
          </div>

          {/* 학년 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">학년</label>
            {isEditing ? (
              <input
                type="text"
                value={profile.grade}
                onChange={(e) => setProfile({ ...profile, grade: e.target.value })}
                placeholder="예: 초등학교 3학년"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900">{profile.grade || '-'}</p>
            )}
          </div>

          {/* 관심 과목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">관심 과목</label>
            {isEditing ? (
              <input
                type="text"
                value={profile.interests}
                onChange={(e) => setProfile({ ...profile, interests: e.target.value })}
                placeholder="예: 수학, 영어, 과학"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900">{profile.interests || '-'}</p>
            )}
          </div>

          {isEditing && (
            <button
              onClick={handleSave}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              저장하기
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
