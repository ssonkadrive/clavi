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

-- 6. 학생이 강사 검색에 필요한 테이블을 읽을 수 있도록 SELECT 정책 추가
-- (기존 정책이 academy 전용인 경우 대비, 인증된 사용자 전체 허용)
DROP POLICY IF EXISTS "Authenticated users can view instructor profiles"
  ON instructor_profiles;
CREATE POLICY "Authenticated users can view instructor profiles"
  ON instructor_profiles
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can view instructor conditions"
  ON instructor_conditions;
CREATE POLICY "Authenticated users can view instructor conditions"
  ON instructor_conditions
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can view skill categories"
  ON skill_categories;
CREATE POLICY "Authenticated users can view skill categories"
  ON skill_categories
  FOR SELECT
  TO authenticated
  USING (true);

-- 6-1. notifications.type CHECK 제약조건에 학생-강사 알림 타입 추가
-- (기존 constraint가 'proposal' 등 5개 값만 허용해서 session_request류 INSERT가
--  모두 조용히 실패하고 있었음)
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS valid_type;
ALTER TABLE notifications ADD CONSTRAINT valid_type
  CHECK (type = ANY (ARRAY[
    'proposal'::text,
    'response_accept'::text,
    'response_reject'::text,
    'interview_proposed'::text,
    'interview_confirmed'::text,
    'session_request'::text,
    'session_accepted'::text,
    'session_rejected'::text
  ]));

-- 6-2. notifications.recipient_role CHECK 제약조건에 'student' 추가
-- (기존 constraint가 'instructor', 'academy'만 허용해서 강사->학생 알림 INSERT가
--  모두 조용히 실패하고 있었음)
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS valid_role;
ALTER TABLE notifications ADD CONSTRAINT valid_role
  CHECK (recipient_role = ANY (ARRAY['instructor'::text, 'academy'::text, 'student'::text]));

-- 7. 강사가 자신에게 수강 신청한 학생 정보를 조회할 수 있도록 SELECT 정책 추가
-- (강사-학생 관계가 있는 경우에만 허용, 무관한 학생 정보는 조회 불가)
DROP POLICY IF EXISTS "Instructors can view students who requested them"
  ON students;
CREATE POLICY "Instructors can view students who requested them"
  ON students
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM instructor_sessions
      WHERE instructor_sessions.student_user_id = students.user_id
      AND instructor_sessions.instructor_user_id = auth.uid()
    )
  );
