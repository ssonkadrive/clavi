import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/getSession'
import { redirect } from 'next/navigation'
import RecruitmentList, { RecruitmentItem } from '@/app/academy/components/RecruitmentList'

// interview_proposals.status + interview_date -> 화면용 상태 라벨
const toStatusLabel = (
  status: string,
  interviewDate: string | null
): RecruitmentItem['statusLabel'] => {
  if (status === 'pending') return '대기'
  if (status === 'declined') return '거절'
  // accepted: 면접 시간이 확정되면 완료, 아니면 진행중
  return interviewDate ? '완료' : '진행중'
}

export default async function RecruitmentPage() {
  const session = await getSession()

  if (!session || session.role !== 'academy') {
    redirect('/signin')
  }

  const supabase = await createClient()

  // 1. 이 원장이 보낸 면접 제안 조회
  const { data: proposalsData, error: proposalsError } = await supabase
    .from('interview_proposals')
    .select('id, instructor_user_id, status, created_at, interview_date')
    .eq('academy_user_id', session.userId)
    .order('created_at', { ascending: false })

  if (proposalsError) {
    console.error('[RecruitmentPage] interview_proposals 조회 실패:', proposalsError.message)
  }

  // 2. 강사 이름 조회 (instructor_profiles)
  const instructorUserIds = (proposalsData || []).map((p) => p.instructor_user_id)
  let profilesById: Record<string, string> = {}

  if (instructorUserIds.length > 0) {
    const { data: profilesData, error: profilesError } = await supabase
      .from('instructor_profiles')
      .select('user_id, name')
      .in('user_id', instructorUserIds)

    if (profilesError) {
      console.error('[RecruitmentPage] instructor_profiles 조회 실패:', profilesError.message)
    }

    profilesById = Object.fromEntries((profilesData || []).map((p) => [p.user_id, p.name]))
  }

  // 3. 화면용 데이터로 매핑
  const items: RecruitmentItem[] = (proposalsData || []).map((p) => ({
    id: p.id,
    instructorName: profilesById[p.instructor_user_id] || '알 수 없는 강사',
    statusLabel: toStatusLabel(p.status, p.interview_date),
    proposedAt: p.created_at,
  }))

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">채용현황</h1>
      <RecruitmentList items={items} />
    </div>
  )
}
