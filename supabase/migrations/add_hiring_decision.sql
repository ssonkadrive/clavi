-- Add hiring_decision column to interview_proposals table
ALTER TABLE interview_proposals
ADD COLUMN hiring_decision TEXT DEFAULT NULL
CHECK (hiring_decision IN ('hired', 'rejected'));

-- Add updated_at column to track when hiring decision was made
ALTER TABLE interview_proposals
ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();

-- Create index for faster queries on hiring_decision
CREATE INDEX idx_interview_proposals_hiring_decision
ON interview_proposals(academy_user_id, hiring_decision);
