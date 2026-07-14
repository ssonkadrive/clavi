// 강사 화면용: CMS 점수 대신 강점 문구 생성
// 가중치가 높은 스킬 위주로 2~3개의 강점을 선택해 표시

export interface WeightedSkill {
  skill_id: string
  weight: number
}

export function generateStrengthMessage(
  instructorSkills: string[],
  requiredSkillsWithWeight: WeightedSkill[],
  skillNames: Record<string, string>
): string {
  // 1단계: 강사가 보유한 스킬 중 학원이 요구한 스킬만 필터링
  const matchedSkills = requiredSkillsWithWeight.filter(req =>
    instructorSkills.includes(req.skill_id)
  )

  // 매칭된 스킬이 없으면 기본 문구
  if (matchedSkills.length === 0) {
    return '이 학원과 함께 성장할 좋은 기회예요'
  }

  // 2단계: 가중치 높은 순서로 정렬
  const sortedSkills = matchedSkills.sort((a, b) => b.weight - a.weight)

  // 3단계: 상위 2~3개 선택
  const topSkillsCount = Math.min(3, sortedSkills.length)
  const topSkills = sortedSkills
    .slice(0, topSkillsCount)
    .map(s => skillNames[s.skill_id] || '알 수 없는 스킬')

  // 4단계: 문구 생성 (조사 없는 형식)
  const skillsList = topSkills.join(', ')

  if (matchedSkills.length === requiredSkillsWithWeight.length) {
    // 모든 스킬 보유
    return `당신의 강점: ${skillsList} 🎯`
  } else if (matchedSkills.length >= 2) {
    // 2개 이상 보유
    return `당신의 강점: ${skillsList}`
  } else {
    // 1개만 보유
    return `당신의 강점: ${skillsList}`
  }
}
