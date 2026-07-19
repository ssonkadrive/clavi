-- 면접 시간 더블부킹 체크용 함수
-- interview_proposals에는 강사 본인 것만 SELECT 가능한 RLS가 걸려 있어서
-- (interview_proposals_instructor_select: auth.uid() = instructor_user_id)
-- 강사 세션으로는 "같은 학원의 다른 강사" 확정 면접 row를 직접 조회할 수 없다.
-- 그렇다고 SELECT 정책을 넓히면 다른 강사들의 면접 정보 전체가 노출되므로,
-- boolean 결과만 반환하는 SECURITY DEFINER 함수로 RLS를 우회해 겹침 여부만 확인한다.
CREATE OR REPLACE FUNCTION check_interview_time_conflict(
  p_academy_user_id uuid,
  p_interview_date date,
  p_interview_time time,
  p_exclude_proposal_id uuid
) RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM interview_proposals
    WHERE academy_user_id = p_academy_user_id
      AND interview_date = p_interview_date
      AND interview_time = p_interview_time
      AND id != p_exclude_proposal_id
  );
$$;

GRANT EXECUTE ON FUNCTION check_interview_time_conflict(uuid, date, time, uuid) TO authenticated;
