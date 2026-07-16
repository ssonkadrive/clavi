import { createClient } from '@/lib/supabase/server'

export interface Session {
  userId: string
  email: string
  role: 'instructor' | 'academy' | 'student'
  isAdmin: boolean
}

// 이 함수가 role/인증 판별의 유일한 진입점이다.
// 다른 곳에서 role을 직접 판단하지 말 것.
export async function getSession(): Promise<Session | null> {
  const supabase = await createClient()

  // 1. getUser()로 Auth 서버에서 인증된 사용자 확인
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !authUser) {
    return null
  }

  // 2. 인증된 사용자 ID로 DB에서 role 등 추가 정보 조회
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, role, is_admin')
    .eq('id', authUser.id)
    .single()

  if (error || !user) {
    return null
  }

  return {
    userId: user.id,
    email: user.email,
    role: user.role,
    isAdmin: user.is_admin,
  }
}
