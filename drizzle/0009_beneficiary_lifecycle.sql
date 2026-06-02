ALTER TABLE users ADD COLUMN tracking_phase TEXT NOT NULL DEFAULT 'job_search';

CREATE TABLE user_tracking_phases (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  reason TEXT,
  created_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX user_tracking_phases_user_id_idx ON user_tracking_phases(user_id, created_at DESC);

ALTER TABLE coach_groups ADD COLUMN archived_at TIMESTAMPTZ;
CREATE INDEX coach_groups_archived_at_idx ON coach_groups(archived_at) WHERE archived_at IS NOT NULL;


