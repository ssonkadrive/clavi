-- Add DELETE RLS policy to notifications table
-- Allow users to delete their own notifications

CREATE POLICY "Users can delete their own notifications"
ON notifications
FOR DELETE
USING (auth.uid() = recipient_id);
