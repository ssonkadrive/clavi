export default function VerificationTab() {
  return (
    <div className="space-y-6">
      <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
        <p className="text-lg font-semibold text-gray-900 mb-2">성범죄/아동학대 이력 조회</p>
        <p className="text-sm text-gray-600 mb-6">
          안전한 강사 매칭을 위해 신원검증을 진행합니다.
        </p>
        <button
          disabled
          className="px-6 py-3 bg-gray-400 text-white rounded-lg font-medium cursor-not-allowed"
        >
          신청하기
        </button>
        <p className="text-xs text-gray-500 mt-4">🚧 준비 중입니다. 곧 서비스될 예정입니다.</p>
      </div>
    </div>
  )
}
