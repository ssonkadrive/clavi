'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { updateHiringDecision } from './actions'

interface Skill {
  id: string
  name: string
}

interface Prospect {
  id: string
  instructor_user_id: string
  instructor_name: string
  education: string
  degree_status: string
  instructor_skills: Skill[]
  cms_score: number
  status: 'pending' | 'accepted' | 'declined'
  hiring_decision: string | null
}

export default function ProspectsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [prospects, setProspects] = useState<Prospect[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentUserId, setCurrentUserId] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)

  console.log('[ProspectsPage] 페이지 로드 시작')

  useEffect(() => {
    const loadProspects = async () => {
      setIsLoading(true)
      setError('')

      try {
        // 현재 사용자 확인
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setError('로그인이 필요합니다.')
          router.push('/auth/signin')
          return
        }

        setCurrentUserId(user.id)

        // 1. 학원의 채용 조건 조회 (required_skills)
        const { data: academyConditions, error: condError } = await supabase
          .from('academy_conditions')
          .select('required_skills')
          .eq('user_id', user.id)
          .single()

        if (condError) {
          console.error('[ProspectsPage] academy_conditions 조회 실패:', condError)
          setError('학원 정보를 불러올 수 없습니다.')
          return
        }

        const requiredSkills = academyConditions?.required_skills || []
        console.log('[ProspectsPage] requiredSkills:', requiredSkills)

        // 2. 학원이 보낸 면접 제안 중 상태가 'accepted' (면접본) 강사들 조회
        const { data: proposalsData, error: proposalsError } = await supabase
          .from('interview_proposals')
          .select('id, instructor_user_id, status, hiring_decision, created_at')
          .eq('academy_user_id', user.id)
          .eq('status', 'accepted') // 면접본 강사만

        if (proposalsError) {
          console.error('[ProspectsPage] interview_proposals 조회 실패:', proposalsError)
          setError('면접 정보를 불러올 수 없습니다.')
          return
        }

        if (!proposalsData || proposalsData.length === 0) {
          console.log('[ProspectsPage] 면접본 강사가 없음')
          setProspects([])
          setIsLoading(false)
          return
        }

        const instructorUserIds = proposalsData.map((p) => p.instructor_user_id)
        console.log('[ProspectsPage] instructorUserIds:', instructorUserIds)

        // 3. skill_categories 조회 (이름 변환용)
        console.log('[ProspectsPage] skill_categories 조회 시작')
        const { data: skillCategories, error: skillError } = await supabase
          .from('skill_categories')
          .select('id, name')
          .eq('is_active', true)

        if (skillError) {
          console.error('[ProspectsPage] skill_categories 조회 실패:', skillError)
        }

        const skillMap = new Map(skillCategories?.map(s => [s.id, s.name]) || [])
        console.log('[ProspectsPage] skillMap:', skillMap.size + '개 스킬 로드됨')

        // 4. 강사 프로필 정보 조회
        const { data: instructorProfiles, error: profileError } = await supabase
          .from('instructor_profiles')
          .select('user_id, name, education, degree_status')
          .in('user_id', instructorUserIds)

        if (profileError) {
          console.error('[ProspectsPage] instructor_profiles 조회 실패:', profileError)
        }

        // 5. 강사의 선택 역량 조회
        const { data: instructorConditions, error: instCondError } = await supabase
          .from('instructor_conditions')
          .select('user_id, selected_skills')
          .in('user_id', instructorUserIds)

        if (instCondError) {
          console.error('[ProspectsPage] instructor_conditions 조회 실패:', instCondError)
        }

        // 6. CMS 점수 계산 및 데이터 조합
        const prospectsData: Prospect[] = proposalsData.map((proposal) => {
          const profile = instructorProfiles?.find(
            (p) => p.user_id === proposal.instructor_user_id
          )
          const conditions = instructorConditions?.find(
            (c) => c.user_id === proposal.instructor_user_id
          )

          const selectedSkillIds = conditions?.selected_skills || []

          // UUID → { id, name } 변환
          const selectedSkillsWithNames: Skill[] = selectedSkillIds.map((skillId: string) => ({
            id: skillId,
            name: skillMap.get(skillId) || '알 수 없는 스킬',
          }))

          const cms = calculateWeightedCMS(selectedSkillIds, requiredSkills)

          return {
            id: proposal.id,
            instructor_user_id: proposal.instructor_user_id,
            instructor_name: profile?.name || '알 수 없는 강사',
            education: profile?.education || '',
            degree_status: profile?.degree_status || '',
            instructor_skills: selectedSkillsWithNames,
            cms_score: cms,
            status: proposal.status,
            hiring_decision: proposal.hiring_decision,
          }
        })

        // CMS 높은 순서로 정렬 (아직 결정 안 한 것부터)
        prospectsData.sort((a, b) => {
          if (!a.hiring_decision && b.hiring_decision) return -1
          if (a.hiring_decision && !b.hiring_decision) return 1
          return b.cms_score - a.cms_score
        })

        console.log('[ProspectsPage] 최종 prospects:', {
          개수: prospectsData.length,
          첫번째강사: prospectsData[0]?.instructor_name,
          첫번째강사스킬: prospectsData[0]?.instructor_skills.map(s => s.name),
        })
        setProspects(prospectsData)
      } catch (err) {
        console.error('[ProspectsPage] 오류:', err)
        setError('데이터를 불러올 수 없습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadProspects()
  }, [supabase, router])

  // CMS 점수 계산 함수 (가중치 기반)
  const calculateWeightedCMS = (
    instructorSkills: string[],
    requiredSkills: Array<{ skill_id: string; weight: number }>
  ): number => {
    if (requiredSkills.length === 0) return 0

    // 전체 가중치 합 계산
    const totalWeight = requiredSkills.reduce((sum, s) => sum + s.weight, 0)
    if (totalWeight === 0) return 0

    // 강사가 보유한 스킬의 가중치 합 계산
    const matchedWeight = requiredSkills.reduce((sum, req) => {
      return instructorSkills.includes(req.skill_id) ? sum + req.weight : sum
    }, 0)

    // 백분율 계산
    return Math.round((matchedWeight / totalWeight) * 100)
  }

  // CMS 배경색 결정
  const getCMSColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800'
    if (score >= 60) return 'bg-blue-100 text-blue-800'
    if (score >= 40) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  // 채용 제안 핸들러
  const handleHireOffer = async (proposalId: string) => {
    setProcessingId(proposalId)
    try {
      const result = await updateHiringDecision(proposalId, 'hired')
      if (result.error) {
        alert('채용 제안 실패: ' + result.error)
      } else {
        // 로컬 상태 업데이트
        setProspects(
          prospects.map((p) =>
            p.id === proposalId ? { ...p, hiring_decision: 'hired' } : p
          )
        )
        alert('채용 제안이 완료되었습니다!')
      }
    } catch (err) {
      console.error('채용 제안 오류:', err)
      alert('채용 제안 중 오류가 발생했습니다.')
    } finally {
      setProcessingId(null)
    }
  }

  // 채용 거절 핸들러
  const handleHireReject = async (proposalId: string) => {
    if (!confirm('정말 거절하시겠습니까?')) return

    setProcessingId(proposalId)
    try {
      const result = await updateHiringDecision(proposalId, 'rejected')
      if (result.error) {
        alert('거절 실패: ' + result.error)
      } else {
        // 로컬 상태 업데이트
        setProspects(
          prospects.map((p) =>
            p.id === proposalId ? { ...p, hiring_decision: 'rejected' } : p
          )
        )
        alert('거절되었습니다.')
      }
    } catch (err) {
      console.error('거절 오류:', err)
      alert('거절 중 오류가 발생했습니다.')
    } finally {
      setProcessingId(null)
    }
  }

  // 채용 결정 상태 배지
  const getHiringBadge = (decision: string | null) => {
    if (decision === 'hired') {
      return <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">✓ 채용됨</span>
    }
    if (decision === 'rejected') {
      return <span className="inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">✗ 거절됨</span>
    }
    return <span className="inline-block bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">검토 중</span>
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">면접 본 강사들</h1>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-700">로딩 중...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">면접 본 강사들</h1>
          <p className="mt-2 text-gray-600">CMS 점수 순으로 정렬되었습니다 (높은 순서 우선)</p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {/* 강사 목록이 없을 때 */}
        {prospects.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-700 mb-4">면접 본 강사가 없습니다.</p>
            <Link
              href="/academy"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
            >
              대시보드로 돌아가기
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {prospects.map((prospect) => (
              <div
                key={prospect.id}
                className={`rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden ${
                  prospect.hiring_decision === 'hired' ? 'bg-green-50 border-l-4 border-green-500'
                  : prospect.hiring_decision === 'rejected' ? 'bg-red-50 border-l-4 border-red-500'
                  : 'bg-white'
                }`}
              >
                <div className="p-6">
                  {/* 헤더: 이름 + CMS 점수 + 결정 상태 */}
                  <div className="flex items-start justify-between mb-6 pb-4 border-b">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-gray-900">
                        {prospect.instructor_name}
                      </h2>
                      {prospect.education && (
                        <p className="text-sm text-gray-600 mt-1">{prospect.education}</p>
                      )}
                    </div>
                    <div className="flex gap-3 items-center">
                      <div className={`px-4 py-2 rounded-lg ${getCMSColor(prospect.cms_score)}`}>
                        <p className="text-2xl font-bold">{prospect.cms_score}%</p>
                        <p className="text-xs font-medium mt-1">CMS</p>
                      </div>
                      {getHiringBadge(prospect.hiring_decision)}
                    </div>
                  </div>

                  {/* 강사 정보 */}
                  <div className="mb-6">
                    {prospect.degree_status && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">학위 상태:</span> {prospect.degree_status}
                      </div>
                    )}

                    {prospect.instructor_skills.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">보유 역량:</p>
                        <div className="flex flex-wrap gap-2">
                          {prospect.instructor_skills.map((skill) => (
                            <span
                              key={skill.id}
                              className="inline-block bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-xs font-medium"
                              title={skill.id}
                            >
                              {skill.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 액션 버튼 */}
                  {!prospect.hiring_decision && (
                    <div className="flex gap-3 pt-4 border-t">
                      <button
                        onClick={() => handleHireOffer(prospect.id)}
                        disabled={processingId === prospect.id}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-md transition-colors font-medium"
                      >
                        {processingId === prospect.id ? '처리 중...' : '✓ 채용 제안'}
                      </button>
                      <button
                        onClick={() => handleHireReject(prospect.id)}
                        disabled={processingId === prospect.id}
                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-md transition-colors font-medium"
                      >
                        {processingId === prospect.id ? '처리 중...' : '✗ 채용 거절'}
                      </button>
                      <Link
                        href={`/academy/proposals/${prospect.id}`}
                        className="flex-1 text-center bg-gray-200 hover:bg-gray-300 text-gray-900 py-2 px-4 rounded-md transition-colors font-medium"
                      >
                        상세보기
                      </Link>
                    </div>
                  )}
                  {prospect.hiring_decision && (
                    <div className="flex gap-3 pt-4 border-t">
                      <Link
                        href={`/academy/proposals/${prospect.id}`}
                        className="flex-1 text-center bg-gray-200 hover:bg-gray-300 text-gray-900 py-2 px-4 rounded-md transition-colors font-medium"
                      >
                        상세보기
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
