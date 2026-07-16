-- 1. users 테이블의 role CHECK constraint 수정 (student 역할 추가)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('instructor', 'academy', 'student'));

-- 2. instructor_sessions 테이블 생성
CREATE TABLE IF NOT EXISTS instructor_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instructor_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  requested_at timestamp with time zone NOT NULL DEFAULT NOW(),
  responded_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT NOW(),
  updated_at timestamp with time zone NOT NULL DEFAULT NOW(),
  UNIQUE(student_user_id, instructor_user_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_instructor_sessions_student_user_id
  ON instructor_sessions(student_user_id);
CREATE INDEX IF NOT EXISTS idx_instructor_sessions_instructor_user_id
  ON instructor_sessions(instructor_user_id);
CREATE INDEX IF NOT EXISTS idx_instructor_sessions_status
  ON instructor_sessions(status);

-- 3. RLS 정책 설정
ALTER TABLE instructor_sessions ENABLE ROW LEVEL SECURITY;

-- 학생이 자신의 신청 조회/삽입
CREATE POLICY "Students can insert their own session requests"
  ON instructor_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = student_user_id);

CREATE POLICY "Students can view their own session requests"
  ON instructor_sessions
  FOR SELECT
  USING (auth.uid() = student_user_id);

-- 강사가 자신에게 온 신청 조회/수정
CREATE POLICY "Instructors can view and update session requests for themselves"
  ON instructor_sessions
  FOR SELECT
  USING (auth.uid() = instructor_user_id);

CREATE POLICY "Instructors can update their session requests"
  ON instructor_sessions
  FOR UPDATE
  USING (auth.uid() = instructor_user_id);

-- 4. Grant 설정
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON instructor_sessions TO authenticated;

-- 5. 업데이트 트리거 (updated_at 자동 갱신)
CREATE OR REPLACE FUNCTION update_instructor_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_instructor_sessions_updated_at
  ON instructor_sessions;

CREATE TRIGGER trigger_update_instructor_sessions_updated_at
  BEFORE UPDATE ON instructor_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_instructor_sessions_updated_at();
