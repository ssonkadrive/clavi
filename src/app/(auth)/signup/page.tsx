'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'instructor' | 'academy'>('instructor')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // 1. auth.users에 계정 생성
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) {
        console.error('Auth signup error:', authError)
        setError(authError.message || '회원가입에 실패했습니다.')
        setLoading(false)
        return
      }

      if (!authData.user) {
        console.error('No user returned from signup')
        setError('회원가입에 실패했습니다.')
        setLoading(false)
        return
      }

      // 2. public.users 테이블에 사용자 정보 저장
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          role,
          is_admin: false,
          agreed_at: new Date().toISOString(),
        })

      if (insertError) {
        console.error('Insert user error:', insertError)
        setError('사용자 정보 저장에 실패했습니다.')
        setLoading(false)
        return
      }

      // 3. 로그인하고 role에 따라 리다이렉트
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (loginError) {
        console.error('Auto login error:', loginError)
        setError('로그인에 실패했습니다.')
        setLoading(false)
        return
      }

      // role에 따라 다른 페이지로 이동
      if (role === 'instructor') {
        router.push('/profile')
      } else {
        router.push('/academy')
      }
    } catch (err) {
      console.error('Unexpected signup error:', err)
      setError('예상치 못한 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            회원가입
          </h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSignup}>
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
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
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
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              역할 선택
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="role"
                  value="instructor"
                  checked={role === 'instructor'}
                  onChange={(e) => setRole(e.target.value as 'instructor' | 'academy')}
                  className="h-4 w-4 border-gray-300"
                />
                <span className="ml-3 text-sm font-medium text-gray-700">강사</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="role"
                  value="academy"
                  checked={role === 'academy'}
                  onChange={(e) => setRole(e.target.value as 'instructor' | 'academy')}
                  className="h-4 w-4 border-gray-300"
                />
                <span className="ml-3 text-sm font-medium text-gray-700">학원</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 py-2 px-4 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '가입 중...' : '가입하기'}
          </button>
        </form>

        <p className="mt-2 text-center text-sm text-gray-600">
          이미 계정이 있으신가요?{' '}
          <a href="/auth/signin" className="font-medium text-blue-600 hover:text-blue-500">
            로그인
          </a>
        </p>
      </div>
    </div>
  )
}
