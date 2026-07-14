-- ============================================
-- 원장 면접 일정 제안 마이그레이션
-- (Supabase SQL Editor에 그대로 복사/붙여넣기 후 실행)
-- ============================================

-- 1. interview_proposals: 원장이 제안하는 면접 날짜 + 슬롯 단위
--    - proposed_date: 원장이 제안한 면접 날짜 (강사가 확정하면 interview_date로 옮겨짐)
--    - interview_slot_minutes: 30 또는 60 (기본 30)
ALTER TABLE interview_proposals
  ADD COLUMN IF NOT EXISTS proposed_date DATE,
  ADD COLUMN IF NOT EXISTS interview_slot_minutes INTEGER DEFAULT 30;

-- 2. notifications INSERT 정책
--    기존 마이그레이션(001)에는 SELECT/UPDATE 정책만 있어 INSERT가 RLS에 의해 차단됨.
--    제안 당사자(원장 또는 강사)는 자신이 속한 제안과 연결된 알림을 생성할 수 있어야 한다.
--    (원장 -> 강사, 강사 -> 원장 방향 알림 모두 허용)
DROP POLICY IF EXISTS "Participants can create notifications" ON notifications;
CREATE POLICY "Participants can create notifications" ON notifications
  FOR INSERT
  WITH CHECK (
    related_proposal_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM interview_proposals ip
      WHERE ip.id = related_proposal_id
        AND (ip.academy_user_id = auth.uid() OR ip.instructor_user_id = auth.uid())
    )
  );

-- 3. authenticated 롤에 명시적 GRANT
GRANT SELECT, INSERT, UPDATE ON notifications TO authenticated;

-- ============================================
-- 확인용 SELECT (선택)
-- ============================================
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'interview_proposals' ORDER BY ordinal_position;
--
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'notifications';
