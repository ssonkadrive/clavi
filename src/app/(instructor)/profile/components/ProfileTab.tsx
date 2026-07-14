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
  const [isSavingImage, setIsSavingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) {
        console.error('[ProfileTab] 사용자 정보를 가져올 수 없습니다')
        return
      }

      const userId = authData.user.id
      if (!userId) {
        console.error('[ProfileTab] userId가 없습니다')
        return
      }

      console.log('[ProfileTab] 프로필 로드 시작, userId:', userId)

      try {
        const { data, error } = await supabase
          .from('instructor_profiles')
          .select('profile_image_url')
          .eq('user_id', userId)
          .single()

        const profile_image_url = data?.profile_image_url || null

        setProfile({
          name: authData.user.user_metadata?.name || authData.user.email || '이름 없음',
          email: authData.user.email || '',
          profile_image_url,
          created_at: authData.user.created_at || new Date().toISOString(),
        })
      } catch (dbError) {
        console.error('DB 조회 에러 (무시함):', dbError)
        // instructor_profiles가 없을 수 있으니 auth 정보만 사용
        setProfile({
          name: authData.user.user_metadata?.name || authData.user.email || '이름 없음',
          email: authData.user.email || '',
          profile_image_url: null,
          created_at: authData.user.created_at || new Date().toISOString(),
        })
      }
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
    setIsSavingImage(true)

    try {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) throw new Error('사용자 정보 없음')

      const userId = authData.user.id
      if (!userId) throw new Error('userId가 없습니다')

      const fileName = `instructor-${userId}-${Date.now()}.jpg`

      console.log('[ProfileTab] 이미지 업로드 시작, fileName:', fileName)

      // 파일 업로드
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, file, { upsert: false })

      if (uploadError) {
        console.error('[ProfileTab] 업로드 에러:', {
          message: uploadError.message,
          error: uploadError,
        })
        // Bucket이 없으면 안내 메시지
        if (uploadError.message.includes('Bucket not found')) {
          throw new Error('프로필 이미지 저장소가 아직 설정되지 않았습니다. 관리자에게 문의하세요.')
        }
        throw uploadError
      }

      console.log('[ProfileTab] 업로드 완료, 공개 URL 생성 중')

      // 공개 URL 생성
      const { data } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName)

      const imageUrl = data.publicUrl
      console.log('[ProfileTab] 공개 URL:', imageUrl)

      // DB에 URL 저장
      const { error: dbError } = await supabase
        .from('instructor_profiles')
        .update({ profile_image_url: imageUrl })
        .eq('user_id', userId)

      if (dbError) {
        console.log('[ProfileTab] Update 실패, insert 시도...', dbError)
        const { error: insertError } = await supabase
          .from('instructor_profiles')
          .insert({ user_id: userId, profile_image_url: imageUrl })

        if (insertError) throw insertError
      }

      // UI 업데이트
      if (profile) {
        setProfile({ ...profile, profile_image_url: imageUrl })
      }
      alert('프로필 사진이 저장되었습니다.')
      console.log('[ProfileTab] 이미지 저장 완료')
    } catch (err) {
      const message = err instanceof Error ? err.message : '알 수 없는 에러'
      console.error('[ProfileTab] 이미지 저장 실패:', message, err)
      alert('이미지 저장 실패: ' + message)
    } finally {
      setIsSavingImage(false)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">로딩 중...</div>
  }

  if (!profile) {
    return <div className="text-center py-8 text-red-600">프로필 로드 실패</div>
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-block mb-4">
          <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {imagePreview ? (
              <img src={imagePreview} alt="프로필" className="w-full h-full object-cover" />
            ) : profile.profile_image_url ? (
              <img src={profile.profile_image_url} alt="프로필" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl">👤</span>
            )}
          </div>
        </div>
        <label className="inline-block px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-medium cursor-pointer">
          {isSavingImage ? '저장 중...' : '사진 변경'}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={isSavingImage}
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
            value={profile.name}
            readOnly
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
          <input
            type="email"
            value={profile.email}
            readOnly
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">가입일</label>
          <input
            type="text"
            value={new Date(profile.created_at).toLocaleDateString('ko-KR')}
            readOnly
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
          />
        </div>
      </div>
    </div>
  )
}
