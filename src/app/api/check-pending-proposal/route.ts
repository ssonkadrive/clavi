import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/getSession'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { instructorUserId } = await request.json()

    const session = await getSession()
    if (!session || session.role !== 'academy') {
      return NextResponse.json(
        { error: '학원만 접근 가능합니다.' },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    const { data: proposal, error } = await supabase
      .from('interview_proposals')
      .select('id')
      .eq('academy_user_id', session.userId)
      .eq('instructor_user_id', instructorUserId)
      .eq('status', 'pending')
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[check-pending-proposal] 에러:', error.message)
      return NextResponse.json(
        { error: '확인 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      hasPending: !!proposal,
    })
  } catch (error) {
    console.error('[check-pending-proposal] 예외:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
