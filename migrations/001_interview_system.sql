-- ============================================
-- 면접 예약 시스템 마이그레이션
-- ============================================

-- 1. interview_proposals 테이블 수정
-- 기존 proposed_date, proposed_time 삭제 (대신 interview_date, interview_time 사용)
-- 원장이 제안한 시간대 저장 컬럼 추가

ALTER TABLE interview_proposals
ADD COLUMN IF NOT EXISTS proposed_time_range_start TIME,
ADD COLUMN IF NOT EXISTS proposed_time_range_end TIME,
ADD COLUMN IF NOT EXISTS interview_date DATE,
ADD COLUMN IF NOT EXISTS interview_time TIME;

-- proposed_date, proposed_time 컬럼이 존재하면 삭제 (데이터 미리 백업)
-- 주의: 실제 데이터가 있다면 먼저 확인 후 진행
-- ALTER TABLE interview_proposals DROP COLUMN IF EXISTS proposed_date;
-- ALTER TABLE interview_proposals DROP COLUMN IF EXISTS proposed_time;

-- 2. notifications 테이블 생성 (알림 시스템)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL,
  recipient_role TEXT NOT NULL CHECK (recipient_role IN ('instructor', 'academy')),
  type TEXT NOT NULL CHECK (type IN ('proposal', 'response_accept', 'response_reject', 'interview_proposed', 'interview_confirmed')),
  related_proposal_id UUID REFERENCES interview_proposals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- notifications 인덱스 (빠른 조회)
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, recipient_role);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- 3. RLS (Row Level Security) 설정
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 자신의 알림만 조회 가능
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT
  USING (recipient_id = auth.uid());

-- 자신의 알림만 업데이트 가능
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- 4. 테스트 데이터 삽입 (선택사항)
-- INSERT INTO notifications (recipient_id, recipient_role, type, related_proposal_id, title, message)
-- VALUES (
--   'test-instructor-id',
--   'instructor',
--   'proposal',
--   NULL,
--   'OOO 학원에서 채용 제안했습니다',
--   '면접 일정을 조율해주세요.'
-- );

-- ============================================
-- 마이그레이션 확인용 SELECT
-- ============================================
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'interview_proposals' ORDER BY ordinal_position;
--
-- SELECT * FROM notifications LIMIT 5;
