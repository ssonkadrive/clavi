'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

interface LogoutButtonProps {
  className?: string
}

export default function LogoutButton({ className = '' }: LogoutButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('[LogoutButton] 로그아웃 에러:', error)
        alert('로그아웃에 실패했습니다.')
        setIsLoading(false)
        return
      }

      console.log('[LogoutButton] 로그아웃 성공')
      router.push('/signin')
    } catch (err) {
      console.error('[LogoutButton] 예상치 못한 에러:', err)
      alert('로그아웃 중 오류가 발생했습니다.')
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className={`bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg transition-colors font-medium disabled:cursor-not-allowed ${className}`}
    >
      {isLoading ? '로그아웃 중...' : '로그아웃'}
    </button>
  )
}
