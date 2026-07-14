import Link from 'next/link'

export default function AcademyProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <Link href="/academy" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">👤 프로필</h1>
        </div>

        {/* 준비 중 메시지 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-600 text-lg">🚧 준비 중입니다</p>
          <p className="text-gray-500 text-sm mt-2">원장 프로필 페이지는 곧 제공될 예정입니다.</p>
        </div>
      </div>
    </div>
  )
}
