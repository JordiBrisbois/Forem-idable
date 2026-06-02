-- Security: Add CHECK constraints for enum-like columns
-- Ensures data integrity at the database level, complementing Zod validation

-- Users role: must be one of the allowed values
ALTER TABLE users ADD CONSTRAINT chk_users_role CHECK (role IN ('user', 'coach', 'admin'));

-- Applications status: must be a valid status
ALTER TABLE applications ADD CONSTRAINT chk_applications_status CHECK (status IN ('in_progress', 'follow_up', 'interview', 'accepted', 'rejected'));

-- Conversations type: must be direct or group
ALTER TABLE conversations ADD CONSTRAINT chk_conversations_type CHECK (type IN ('direct', 'group'));

-- Conversation messages type: must be text or job_share
ALTER TABLE conversation_messages ADD CONSTRAINT chk_messages_type CHECK (type IN ('text', 'job_share'));

-- Conversation messages content: limited to 4000 chars
ALTER TABLE conversation_messages ADD CONSTRAINT chk_message_content_length CHECK (length(content) <= 4000);

-- Application private notes content: limited to 10000 chars
ALTER TABLE application_private_notes ADD CONSTRAINT chk_note_content_length CHECK (length(content) <= 10000);

-- Application shared notes content: limited to 10000 chars
ALTER TABLE application_shared_notes ADD CONSTRAINT chk_shared_note_content_length CHECK (length(content) <= 10000);