'use server'

import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/getSession'

export interface ProposalRow {
  id: string
  instructor_user_id: string
  created_at: string
  status: string
  responded_at?: string
  instructor_name?: string
  daysToAccept?: number
}

export interface AcademyDashboardData {
  stats: {
    instructorsViewed: number
    proposalsSent: number
    proposalsAccepted: number
    avgMatchingDays: number
  }
  recentProposals: ProposalRow[]
}

export async function getAcademyDashboardData(): Promise<{
  data?: AcademyDashboardData
  error?: string
}> {
  console.log('[getAcademyDashboardData] ===== 조회 시작 =====')

  try {
    const session = await getSession()
    console.log('[getAcademyDashboardData] 세션:', {
      userId: session?.userId,
      role: session?.role,
      email: session?.email,
    })

    if (!session || session.role !== 'academy') {
      console.error('[getAcademyDashboardData] 권한 없음')
      return { error: '학원만 접근 가능합니다.' }
    }

    const supabase = await createClient()

    // 1. academy_statistics에서 기본 통계 조회 (academy_user_id = auth.uid())
    console.log('[getAcademyDashboardData] academy_statistics 조회 시도:', {
      userId: session.userId,
      role: session.role,
    })

    const { data: statsData, error: statsError } = await supabase
      .from('academy_statistics')
      .select('instructors_viewed, proposals_sent, proposals_accepted')
      .eq('academy_user_id', session.userId)
      .maybeSingle()

    console.log('[getAcademyDashboardData] academy_statistics 조회 결과:', {
      found: !!statsData,
      error: statsError?.message,
      errorCode: statsError?.code,
      data: statsData,
    })

    console.log('[getAcademyDashboardData] statsData 전체:', statsData)
    console.log('[getAcademyDashboardData] statsData 타입:', typeof statsData)
    console.log('[getAcademyDashboardData] statsData null?:', statsData === null)
    console.log('[getAcademyDashboardData] statsData undefined?:', statsData === undefined)

    let stats = {
      instructors_viewed: statsData?.instructors_viewed || 0,
      proposals_sent: statsData?.proposals_sent || 0,
      proposals_accepted: statsData?.proposals_accepted || 0,
    }

    console.log('[getAcademyDashboardData] stats 처리 후:', stats)

    if (statsError) {
      console.warn('[getAcademyDashboardData] 통계 조회 에러:', statsError.message)
    }

    // 3. interview_proposals (최근 10개) 조회
    console.log('[getAcademyDashboardData] 최근 제안 조회')
    const { data: proposalsData, error: proposalsError } = await supabase
      .from('interview_proposals')
      .select('id, instructor_user_id, created_at, status, responded_at')
      .eq('academy_user_id', session.userId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (proposalsError) {
      console.error('[getAcademyDashboardData] 제안 조회 실패:', proposalsError)
      return { error: '제안 데이터를 불러올 수 없습니다.' }
    }

    // 4. instructor_profiles 조인 (강사명 조회)
    const instructorIds = (proposalsData || []).map((p) => p.instructor_user_id)
    let instructorMap: Record<string, string> = {}

    if (instructorIds.length > 0) {
      const { data: instructorsData, error: instructorsError } = await supabase
        .from('instructor_profiles')
        .select('user_id, name')
        .in('user_id', instructorIds)

      if (instructorsError) {
        console.warn('[getAcademyDashboardData] 강사 정보 조회 실패:', instructorsError)
      } else {
        instructorMap = Object.fromEntries(
          (instructorsData || []).map((p) => [p.user_id, p.name])
        )
      }
    }

    // 5. 제안 데이터에 강사명 및 소요일 추가
    const recentProposals: ProposalRow[] = (proposalsData || []).map((p) => {
      let daysToAccept: number | undefined = undefined

      if (p.responded_at && p.created_at) {
        const created = new Date(p.created_at)
        const responded = new Date(p.responded_at)
        daysToAccept = Math.floor((responded.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
      }

      return {
        id: p.id,
        instructor_user_id: p.instructor_user_id,
        created_at: p.created_at,
        status: p.status,
        responded_at: p.responded_at,
        instructor_name: instructorMap[p.instructor_user_id] || '알 수 없는 강사',
        daysToAccept,
      }
    })

    // 6. 평균 매칭 시간 계산
    const acceptedProposals = recentProposals.filter((p) => p.responded_at && p.daysToAccept !== undefined)
    const avgMatchingDays =
      acceptedProposals.length > 0
        ? Math.round(
            acceptedProposals.reduce((sum, p) => sum + (p.daysToAccept || 0), 0) /
              acceptedProposals.length
          )
        : 0

    console.log('[getAcademyDashboardData] 데이터 조회 성공', {
      instructorsViewed: stats.instructors_viewed,
      proposalsSent: stats.proposals_sent,
      proposalsAccepted: stats.proposals_accepted,
      avgMatchingDays,
      recentProposalsCount: recentProposals.length,
    })

    return {
      data: {
        stats: {
          instructorsViewed: stats.instructors_viewed,
          proposalsSent: stats.proposals_sent,
          proposalsAccepted: stats.proposals_accepted,
          avgMatchingDays,
        },
        recentProposals,
      },
    }
  } catch (error: any) {
    console.error('[getAcademyDashboardData] 예외 발생:', error)
    return { error: '대시보드 데이터를 불러올 수 없습니다.' }
  }
}
