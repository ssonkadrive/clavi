import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/getSession'

export default async function HomePage() {
  const session = await getSession()

  // 로그인한 경우: role에 따라 대시보드로 리다이렉트
  if (session) {
    if (session.role === 'instructor') {
      redirect('/dashboard')
    } else if (session.role === 'academy') {
      redirect('/academy')
    }
  }

  // 로그인하지 않은 경우: 로그인 페이지로 리다이렉트
  redirect('/signin')
}
