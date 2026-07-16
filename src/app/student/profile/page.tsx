'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface StudentProfile {
  name: string
  grade?: string
  interests?: string[]
  profile_image_url?: string
}

const AVAILABLE_SUBJECTS = ['피아노', '연기', '태권도', '미술', '수학', '영어', '과학', '기타']
const GRADES = Array.from({ length: 12 }, (_, i) => `${i + 1}학년`)

export default function StudentProfilePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [profile, setProfile] = useState<StudentProfile>({
    name: '',
    grade: '',
    interests: [],
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
          const interests = Array.isArray(studentData.interests)
            ? studentData.interests
            : typeof studentData.interests === 'string' && studentData.interests
              ? studentData.interests.split(',').map((s: string) => s.trim())
              : []

          setProfile({
            name: studentData.name || '',
            grade: studentData.grade || '',
            interests: interests,
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        setError('사용자 정보를 불러올 수 없습니다.')
        return
      }

      // 파일을 Supabase 스토리지에 업로드
      const fileName = `${userData.user.id}-${Date.now()}`
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('profile-images')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      // 공개 URL 생성
      const { data: publicUrlData } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName)

      setProfile({ ...profile, profile_image_url: publicUrlData.publicUrl })
    } catch (err) {
      console.error('Image upload error:', err)
      setError('이미지 업로드에 실패했습니다.')
    }
  }

  const handleInterestChange = (subject: string) => {
    setProfile((prev) => ({
      ...prev,
      interests: prev.interests?.includes(subject)
        ? prev.interests.filter((s) => s !== subject)
        : [...(prev.interests || []), subject],
    }))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        setError('사용자 정보를 불러올 수 없습니다.')
        return
      }

      if (!profile.name.trim()) {
        setError('이름을 입력하세요.')
        return
      }

      // interests를 쉼표로 구분된 문자열로 변환
      const interestsString = (profile.interests || []).join(',')

      const { error: updateError } = await supabase
        .from('students')
        .update({
          name: profile.name,
          grade: profile.grade,
          interests: interestsString,
          profile_image_url: profile.profile_image_url,
        })
        .eq('user_id', userData.user.id)

      if (updateError) throw updateError

      alert('프로필이 저장되었습니다.')
      setIsEditing(false)
      setError(null)
    } catch (err) {
      console.error('Save error:', err)
      setError('프로필 저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
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
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-4xl flex-shrink-0">
                {profile.profile_image_url ? (
                  <img
                    src={profile.profile_image_url}
                    alt="프로필"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  '📷'
                )}
              </div>
              {isEditing && (
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                />
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
              <select
                value={profile.grade}
                onChange={(e) => setProfile({ ...profile, grade: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">선택하세요</option>
                {GRADES.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-gray-900">{profile.grade || '-'}</p>
            )}
          </div>

          {/* 관심 과목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">관심 과목</label>
            {isEditing ? (
              <div className="grid grid-cols-2 gap-3">
                {AVAILABLE_SUBJECTS.map((subject) => (
                  <label key={subject} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={profile.interests?.includes(subject) || false}
                      onChange={() => handleInterestChange(subject)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">{subject}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-gray-900">
                {profile.interests && profile.interests.length > 0
                  ? profile.interests.join(', ')
                  : '-'}
              </p>
            )}
          </div>

          {isEditing && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
            >
              {isSaving ? '저장 중...' : '저장하기'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
