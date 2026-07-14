// 강사 화면용: 자신의 역량만 표시 (학원 조건 절대 노출 금지)
// CMS 원칙: 강사는 자신의 역량만 봄, 학원의 조건 모름

export interface WeightedSkill {
  skill_id: string
  weight: number
}

/**
 * 강사의 보유 역량만 표시 (학원 조건과 무관)
 * @param instructorSkills 강사의 선택된 역량 ID 배열
 * @param skillNames 역량 ID → 역량 이름 매핑
 * @returns 강사 역량 표시 문구
 */
export function generateStrengthMessage(
  instructorSkills: string[],
  skillNames: Record<string, string>
): string {
  // 보유한 역량이 없으면 기본 문구
  if (!instructorSkills || instructorSkills.length === 0) {
    return '역량을 선택하면 여기에 표시됩니다'
  }

  // 역량 이름 변환
  const skillNames_list = instructorSkills
    .map(skillId => skillNames[skillId] || '알 수 없는 역량')
    .filter(name => name !== '알 수 없는 역량')

  // 표시할 역량이 없으면 기본 문구
  if (skillNames_list.length === 0) {
    return '역량을 선택하면 여기에 표시됩니다'
  }

  // 역량 목록 생성 (최대 3개)
  const displaySkills = skillNames_list.slice(0, 3)
  const skillsList = displaySkills.join(', ')

  // "당신의 역량" 문구로 통일 (학원 조건 노출 금지)
  return `당신의 역량: ${skillsList}`
}

/**
 * @deprecated 학원 조건과의 매칭으로 강점을 표시하는 것은 CMS 원칙 위배
 * 강사는 학원의 조건을 절대 알면 안 됨
 */
export function generateStrengthMessage_DEPRECATED(
  instructorSkills: string[],
  requiredSkillsWithWeight: WeightedSkill[],
  skillNames: Record<string, string>
): string {
  // 이 함수는 사용하지 마세요
  // generateStrengthMessage를 사용하세요
  return generateStrengthMessage(instructorSkills, skillNames)
}
