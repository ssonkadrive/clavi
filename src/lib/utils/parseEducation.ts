export interface Education {
  school_name: string
  degree: string
  major: string
  graduation_year: number
  school_id?: string | null
}

// instructor_profiles.education은 text 컬럼에 JSON 문자열로 저장되어 있음
export function parseEducation(raw: unknown): Education | null {
  if (!raw) return null

  let parsed: any = raw
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed)
    } catch {
      return null
    }
  }

  if (!parsed || typeof parsed !== 'object') return null

  return {
    school_name: parsed.school_name ?? '',
    degree: parsed.degree ?? '',
    major: parsed.major ?? '',
    graduation_year: parsed.graduation_year ?? null,
    school_id: parsed.school_id ?? null,
  }
}

// "학교 전공 학위 (졸업연도)" 형식으로 표시
export function formatEducation(raw: unknown): string {
  const edu = parseEducation(raw)
  if (!edu || !edu.school_name) return ''

  const parts = [edu.school_name, edu.major, edu.degree].filter(Boolean)
  const suffix = edu.graduation_year ? ` (${edu.graduation_year})` : ''
  return parts.join(' ') + suffix
}
