'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SigninPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // 1. Supabase 로그인
      console.log('[signin] 로그인 시도:', email)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        console.error('[signin] 로그인 에러:', authError)
        setError(authError.message || '로그인에 실패했습니다.')
        setLoading(false)
        return
      }

      if (!authData.user) {
        console.error('[signin] 사용자 정보 없음')
        setError('로그인에 실패했습니다.')
        setLoading(false)
        return
      }

      console.log('[signin] 로그인 성공:', authData.user.id)

      // 2. users 테이블에서 role 조회
      console.log('[signin] 사용자 role 조회')
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', authData.user.id)
        .single()

      if (userError) {
        console.error('[signin] 사용자 조회 에러:', userError)
        setError('사용자 정보를 불러올 수 없습니다.')
        setLoading(false)
        return
      }

      if (!userData) {
        console.error('[signin] 사용자 데이터 없음')
        setError('사용자 정보를 찾을 수 없습니다.')
        setLoading(false)
        return
      }

      console.log('[signin] 사용자 role:', userData.role)

      // 3. role에 따라 리다이렉트
      if (userData.role === 'instructor') {
        console.log('[signin] 강사로 리다이렉트: /profile')
        router.push('/profile')
      } else if (userData.role === 'academy') {
        console.log('[signin] 학원으로 리다이렉트: /academy')
        router.push('/academy')
      } else {
        console.error('[signin] 알 수 없는 role:', userData.role)
        setError('알 수 없는 사용자 유형입니다.')
        setLoading(false)
      }
    } catch (err) {
      console.error('[signin] 예상치 못한 에러:', err)
      setError('예상치 못한 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            로그인
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            또는{' '}
            <a href="/auth/signup" className="font-medium text-blue-600 hover:text-blue-500">
              새 계정을 만들기
            </a>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSignin}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              이메일
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 py-2 px-4 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="text-center text-sm text-gray-600">
          <p>
            계정이 없으신가요?{' '}
            <a href="/auth/signup" className="font-medium text-blue-600 hover:text-blue-500">
              회원가입
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
