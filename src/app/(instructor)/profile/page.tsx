import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/getSession'
import LogoutButton from '@/components/LogoutButton'

export default async function ProfilePage() {
  const session = await getSession()

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">강사 프로필</h1>
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">로그인이 필요합니다.</p>
          </div>
        </div>
      </div>
    )
  }

  const supabase = await createClient()

  // 사용자 정보 조회 (이메일, 가입일)
  const { data: userData } = await supabase
    .from('users')
    .select('id, email, created_at')
    .eq('id', session.userId)
    .single()

  // 강사 프로필 정보 조회
  const { data: profileData } = await supabase
    .from('instructor_profiles')
    .select('name, education, degree_type, degree_status')
    .eq('user_id', session.userId)
    .single()

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getDegreeStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return '취득 완료'
      case 'pursuing':
        return '취득 중'
      case 'not_pursuing':
        return '미취득'
      default:
        return status
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">강사 프로필</h1>

        {/* 프로필 정보 카드 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-8">
            <div className="space-y-6">
              {/* 이름 */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  이름
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {profileData?.name || '미입력'}
                </p>
              </div>

              {/* 이메일 */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  이메일
                </p>
                <p className="mt-2 text-gray-700">{userData?.email || session.email}</p>
              </div>

              {/* 가입일 */}
              {userData?.created_at && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    가입일
                  </p>
                  <p className="mt-2 text-gray-700">{formatDate(userData.created_at)}</p>
                </div>
              )}

              {/* 학력 */}
              {profileData?.education && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    학력
                  </p>
                  <p className="mt-2 text-gray-700">{profileData.education}</p>
                </div>
              )}

              {/* 학위 유형 */}
              {profileData?.degree_type && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    학위 유형
                  </p>
                  <p className="mt-2 text-gray-700">{profileData.degree_type}</p>
                </div>
              )}

              {/* 학위 상태 */}
              {profileData?.degree_status && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    학위 상태
                  </p>
                  <p className="mt-2 text-gray-700">
                    {getDegreeStatusLabel(profileData.degree_status)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="space-y-3">
          <a
            href="/profile/edit"
            className="block w-full text-center rounded-md bg-blue-600 py-3 px-4 text-white font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            프로필 수정
          </a>
          <a
            href="/profile/skills"
            className="block w-full text-center rounded-md bg-purple-600 py-3 px-4 text-white font-medium hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            역량 관리
          </a>
          <a
            href="/dashboard"
            className="block w-full text-center rounded-md bg-green-600 py-3 px-4 text-white font-medium hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            대시보드
          </a>
          <LogoutButton className="w-full" />
        </div>
      </div>
    </div>
  )
}
