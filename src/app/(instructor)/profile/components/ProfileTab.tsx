'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ProfileData {
  name: string
  email: string
  profile_image_url: string | null
  created_at: string
}

export default function ProfileTab() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) return

      const { data, error } = await supabase
        .from('instructor_profiles')
        .select('name, profile_image_url')
        .eq('user_id', authData.user.id)
        .single()

      if (error) throw error

      setProfile({
        name: data?.name || '이름 없음',
        email: authData.user.email || '',
        profile_image_url: data?.profile_image_url,
        created_at: authData.user.created_at || new Date().toISOString(),
      })
    } catch (err) {
      console.error('프로필 로드 실패:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const preview = URL.createObjectURL(file)
    setImagePreview(preview)

    try {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) return

      const fileName = `instructor-${authData.user.id}-${Date.now()}`
      await supabase.storage
        .from('profile-images')
        .upload(fileName, file)

      console.log('이미지 업로드 완료')
    } catch (err) {
      console.error('이미지 업로드 실패:', err)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">로딩 중...</div>
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-block mb-4">
          <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {imagePreview ? (
              <img src={imagePreview} alt="프로필" className="w-full h-full object-cover" />
            ) : profile?.profile_image_url ? (
              <img src={profile.profile_image_url} alt="프로필" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl">👤</span>
            )}
          </div>
        </div>
        <label className="inline-block px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium cursor-pointer">
          사진 변경
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </label>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">기본정보</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
          <input
            type="text"
            value={profile?.name || ''}
            readOnly
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
          <input
            type="email"
            value={profile?.email || ''}
            readOnly
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">가입일</label>
          <input
            type="text"
            value={new Date(profile?.created_at || '').toLocaleDateString('ko-KR')}
            readOnly
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
          />
        </div>
      </div>
    </div>
  )
}
