export default function StudentInstructorsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">강사 찾기</h1>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-600 text-lg">강사 목록을 로드하고 있습니다.</p>
          <p className="text-gray-500 text-sm mt-2">현재 사용 가능한 강사가 없습니다.</p>
        </div>
      </div>
    </div>
  )
}
