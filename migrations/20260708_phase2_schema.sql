-- CLAVI Phase 2: DB 스키마 추가
-- 실행 날짜: 2026-07-08

-- 1. instructor_profiles에 years_of_experience 컬럼 추가
ALTER TABLE instructor_profiles
ADD COLUMN IF NOT EXISTS years_of_experience INT DEFAULT 0;

-- 2. instructor_statistics 테이블 생성
CREATE TABLE IF NOT EXISTS instructor_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL UNIQUE REFERENCES instructors(id) ON DELETE CASCADE,
  profile_views INT DEFAULT 0,
  proposals_received INT DEFAULT 0,
  proposals_accepted INT DEFAULT 0,
  messages_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- instructor_statistics RLS 정책
ALTER TABLE instructor_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can view own stats"
  ON instructor_statistics FOR SELECT
  USING (
    instructor_id = auth.uid()
  );

CREATE POLICY "Academies can view instructor stats"
  ON instructor_statistics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM instructors
      WHERE instructors.id = instructor_id
    )
  );

-- 3. academy_statistics 테이블 생성
CREATE TABLE IF NOT EXISTS academy_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL UNIQUE REFERENCES academies(id) ON DELETE CASCADE,
  instructors_viewed INT DEFAULT 0,
  proposals_sent INT DEFAULT 0,
  proposals_accepted INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- academy_statistics RLS 정책
ALTER TABLE academy_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Academies can view own stats"
  ON academy_statistics FOR SELECT
  USING (
    academy_id IN (
      SELECT id FROM academies
      WHERE academies.user_id = auth.uid()
    )
  );

-- 4. 테스트 데이터 삽입 (테스트 계정 기준)
-- 주의: 실제 UUIDs는 테스트 계정의 user_id와 academy_id로 대체 필요

-- 테스트 강사 통계 (user_id: clavi.p0.test@mailinator.com의 ID 사용)
-- 테스트 학원 통계 (user_id: clavi.p0.academy@mailinator.com의 academy ID 사용)

-- 마이그레이션 완료 로그
SELECT 'Phase 2 Schema Migration Completed' as status;
