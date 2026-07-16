export default function StudentMessagesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">채팅</h1>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-600 text-lg">메시지가 없습니다.</p>
          <p className="text-gray-500 text-sm mt-2">강사와 채팅을 시작하세요.</p>
        </div>
      </div>
    </div>
  )
}
