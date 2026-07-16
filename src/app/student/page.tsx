import Link from 'next/link'

export default function StudentHomePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">학생 플랫폼</h1>

        {/* 메인 CTA 카드 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">강사 찾기</h2>
          <p className="text-gray-600 mb-4">
            자격 있는 강사를 찾아 수업을 예약하세요.
          </p>
          <Link
            href="/student/instructors"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            강사 목록 보기
          </Link>
        </div>

        {/* 최근 활동 카드 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">최근 활동</h2>
          <p className="text-gray-600">활동이 없습니다.</p>
        </div>
      </div>
    </div>
  )
}
