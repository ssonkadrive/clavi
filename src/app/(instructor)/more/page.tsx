'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function InstructorMorePage() {
  const router = useRouter()

  const handleLogout = async () => {
    // 로그아웃 로직
    alert('로그아웃 되었습니다')
    router.push('/signin')
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">더보기</h1>

      <div className="space-y-2">
        <Link href="/profile" className="block bg-white p-4 rounded-lg border">
          👤 프로필 관리
        </Link>
        <Link href="/profile/edit" className="block bg-white p-4 rounded-lg border">
          ✏️ 프로필 수정
        </Link>
        <Link href="/settings" className="block bg-white p-4 rounded-lg border">
          ⚙️ 설정
        </Link>
        <Link href="/help" className="block bg-white p-4 rounded-lg border">
          ❓ 고객센터
        </Link>
      </div>

      <button
        onClick={handleLogout}
        className="w-full bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 font-bold"
      >
        🚪 로그아웃
      </button>
    </div>
  )
}
