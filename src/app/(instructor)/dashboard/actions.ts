'use server'

import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/getSession'

export interface InstructorDashboardData {
  stats: {
    profileViews: number
    proposalsReceived: number
    proposalsAccepted: number
    messagesCount: number
    acceptanceRate: number
  }
  chartData: Array<{
    date: string
    count: number
  }>
}

export async function getInstructorDashboardData(): Promise<{
  data?: InstructorDashboardData
  error?: string
}> {
  console.log('[getInstructorDashboardData] ===== 조회 시작 =====')

  try {
    const session = await getSession()
    console.log('[getInstructorDashboardData] 세션:', {
      userId: session?.userId,
      role: session?.role,
      email: session?.email,
    })

    if (!session || session.role !== 'instructor') {
      console.error('[getInstructorDashboardData] 권한 없음')
      return { error: '강사만 접근 가능합니다.' }
    }

    const supabase = await createClient()

    // 1. instructor_statistics에서 기본 통계 조회
    console.log('[getInstructorDashboardData] instructor_statistics 조회 시도:', {
      userId: session.userId,
      role: session.role,
    })

    const { data: statsData, error: statsError } = await supabase
      .from('instructor_statistics')
      .select('profile_views, proposals_received, proposals_accepted, messages_count')
      .eq('instructor_id', session.userId)
      .maybeSingle()

    console.log('[getInstructorDashboardData] instructor_statistics 조회 결과:', {
      found: !!statsData,
      error: statsError?.message,
      errorCode: statsError?.code,
      data: statsData,
    })

    console.log('[getInstructorDashboardData] statsData 전체:', statsData)
    console.log('[getInstructorDashboardData] statsData 타입:', typeof statsData)
    console.log('[getInstructorDashboardData] statsData null?:', statsData === null)
    console.log('[getInstructorDashboardData] statsData undefined?:', statsData === undefined)

    let stats = {
      profile_views: statsData?.profile_views || 0,
      proposals_received: statsData?.proposals_received || 0,
      proposals_accepted: statsData?.proposals_accepted || 0,
      messages_count: statsData?.messages_count || 0,
    }

    console.log('[getInstructorDashboardData] stats 처리 후:', stats)

    if (statsError) {
      console.warn('[getInstructorDashboardData] 통계 조회 에러:', statsError.message)
    }

    // 2. 지난 7일 제안 현황 조회
    console.log('[getInstructorDashboardData] 지난 7일 제안 조회')
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const sevenDaysAgoStr = sevenDaysAgo.toISOString()

    const { data: recentProposals, error: proposalsError } = await supabase
      .from('interview_proposals')
      .select('id, created_at')
      .eq('instructor_user_id', session.userId)
      .gte('created_at', sevenDaysAgoStr)
      .order('created_at', { ascending: true })

    if (proposalsError) {
      console.error('[getInstructorDashboardData] 제안 조회 실패:', proposalsError)
      return { error: '데이터를 불러올 수 없습니다.' }
    }

    // 3. 날짜별 그룹화
    const chartDataMap: Record<string, number> = {}
    ;(recentProposals || []).forEach((proposal) => {
      const date = new Date(proposal.created_at).toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
      })
      chartDataMap[date] = (chartDataMap[date] || 0) + 1
    })

    // 4. 차트 데이터 생성 (날짜순 정렬)
    const chartData = Object.entries(chartDataMap)
      .sort((a, b) => {
        const dateA = new Date(a[0])
        const dateB = new Date(b[0])
        return dateA.getTime() - dateB.getTime()
      })
      .map(([date, count]) => ({
        date,
        count,
      }))

    // 5. 수락률 계산
    const acceptanceRate =
      stats.proposals_received > 0
        ? Math.round((stats.proposals_accepted / stats.proposals_received) * 100)
        : 0

    console.log('[getInstructorDashboardData] 데이터 조회 성공', {
      profileViews: stats.profile_views,
      proposalsReceived: stats.proposals_received,
      proposalsAccepted: stats.proposals_accepted,
      acceptanceRate,
      chartDataPoints: chartData.length,
    })

    return {
      data: {
        stats: {
          profileViews: stats.profile_views,
          proposalsReceived: stats.proposals_received,
          proposalsAccepted: stats.proposals_accepted,
          messagesCount: stats.messages_count,
          acceptanceRate,
        },
        chartData,
      },
    }
  } catch (error: any) {
    console.error('[getInstructorDashboardData] 예외 발생:', error)
    return { error: '대시보드 데이터를 불러올 수 없습니다.' }
  }
}
