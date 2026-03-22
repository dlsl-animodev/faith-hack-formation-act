-- Faith Hack — initial schema (ordered for FK integrity)

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_code TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  ended_at TIMESTAMPTZ,
  summary JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  submitted BOOLEAN DEFAULT FALSE,
  debug_summary TEXT,
  completion_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  display_name TEXT,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  is_leader BOOLEAN DEFAULT FALSE,
  position INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bugs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  is_custom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE app_state (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  current_phase INT NOT NULL DEFAULT 1,
  total_groups INT NOT NULL DEFAULT 0,
  groups_submitted INT NOT NULL DEFAULT 0,
  active_event_code TEXT REFERENCES events(event_code),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO app_state (id, current_phase, total_groups, groups_submitted, active_event_code)
VALUES (1, 1, 0, 0, NULL)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE sharing_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  position INT NOT NULL,
  prompt_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (session_id)
);

CREATE INDEX idx_groups_event_id ON groups(event_id);
CREATE INDEX idx_sessions_event_id ON sessions(event_id);
CREATE INDEX idx_sessions_group_id ON sessions(group_id);
CREATE INDEX idx_bugs_session_id ON bugs(session_id);
CREATE INDEX idx_sharing_prompts_group_id ON sharing_prompts(group_id);

-- RLS: enabled on all tables. Application data access uses the Supabase service role in
-- Next.js Route Handlers (bypasses RLS). Anon/authenticated roles have no policies here,
-- so direct client DB access is denied — bugs and session data are never exposed via anon.

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE sharing_prompts ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE app_state IS 'Singleton row id=1; only service role should write.';
