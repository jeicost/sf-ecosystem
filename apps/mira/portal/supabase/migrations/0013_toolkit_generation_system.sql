-- ─── Fase 1: Toolkit Generation System ─────────────────────────────────────
-- Tables for queueing, tracking, and delivering generated content

-- Step 1: Create generation_queue table (track all generation requests)
CREATE TABLE IF NOT EXISTS generation_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_slug TEXT NOT NULL CHECK (tool_slug IN (
    'brand-briefing',
    'seo-audit',
    'content-pack',
    'marketing-audit',
    'action-plan',
    'investor-deck',
    'competitive-analysis',
    'brandbook-content-system'
  )),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  input_data JSONB NOT NULL, -- stores form inputs
  result_data JSONB, -- stores generation result
  error_message TEXT,
  n8n_execution_id TEXT, -- webhook execution ID from n8n
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  estimated_duration_minutes INTEGER DEFAULT 20
);

-- Step 2: Create deliverables table (final generated content)
CREATE TABLE IF NOT EXISTS deliverables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  generation_queue_id UUID NOT NULL REFERENCES generation_queue(id) ON DELETE CASCADE,
  tool_slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_type TEXT CHECK (file_type IN ('pdf', 'pptx', 'json', 'figma', 'slides', 'zip')),
  storage_url TEXT, -- S3 or Supabase storage URL
  preview_url TEXT, -- thumbnail or web preview URL
  size_bytes BIGINT,
  version INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('ready', 'archived', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE,
  downloads_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create generation_feedback table (user feedback on results)
CREATE TABLE IF NOT EXISTS generation_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deliverable_id UUID NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  needs_revision BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create generation_revisions table (track revisions/versions)
CREATE TABLE IF NOT EXISTS generation_revisions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deliverable_id UUID NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL,
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
  generation_queue_id UUID REFERENCES generation_queue(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(deliverable_id, revision_number)
);

-- Step 5: Create indices for performance
CREATE INDEX IF NOT EXISTS idx_generation_queue_client_id ON generation_queue(client_id);
CREATE INDEX IF NOT EXISTS idx_generation_queue_user_id ON generation_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_queue_status ON generation_queue(status);
CREATE INDEX IF NOT EXISTS idx_generation_queue_tool_slug ON generation_queue(tool_slug);
CREATE INDEX IF NOT EXISTS idx_generation_queue_created_at ON generation_queue(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_deliverables_client_id ON deliverables(client_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_tool_slug ON deliverables(tool_slug);
CREATE INDEX IF NOT EXISTS idx_deliverables_status ON deliverables(status);
CREATE INDEX IF NOT EXISTS idx_deliverables_created_at ON deliverables(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_generation_feedback_deliverable_id ON generation_feedback(deliverable_id);
CREATE INDEX IF NOT EXISTS idx_generation_revisions_deliverable_id ON generation_revisions(deliverable_id);

-- Step 6: Enable RLS (Row Level Security)
ALTER TABLE generation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_revisions ENABLE ROW LEVEL SECURITY;

-- Step 7: RLS Policies for generation_queue
CREATE POLICY "generation_queue: users can view their client's queue" ON generation_queue
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM mira_project_access
      WHERE client_id = generation_queue.client_id
    )
  );

CREATE POLICY "generation_queue: users can insert for their client" ON generation_queue
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM mira_project_access
      WHERE client_id = generation_queue.client_id
    )
  );

-- Step 8: RLS Policies for deliverables
CREATE POLICY "deliverables: users can view their client's deliverables" ON deliverables
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM mira_project_access
      WHERE client_id = deliverables.client_id
    )
  );

CREATE POLICY "deliverables: update downloads count" ON deliverables
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM mira_project_access
      WHERE client_id = deliverables.client_id
    )
  );

-- Step 9: RLS Policies for feedback/revisions
CREATE POLICY "generation_feedback: users can add feedback" ON generation_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "generation_feedback: users can view feedback" ON generation_feedback
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM mira_project_access
      WHERE client_id IN (
        SELECT client_id FROM deliverables
        WHERE id = generation_feedback.deliverable_id
      )
    )
  );

CREATE POLICY "generation_revisions: users can request revisions" ON generation_revisions
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM mira_project_access
      WHERE client_id IN (
        SELECT client_id FROM deliverables
        WHERE id = generation_revisions.deliverable_id
      )
    )
  );

-- Step 10: Create function to update deliverables.updated_at
CREATE OR REPLACE FUNCTION update_deliverables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deliverables_updated_at
BEFORE UPDATE ON deliverables
FOR EACH ROW
EXECUTE FUNCTION update_deliverables_updated_at();

-- Step 11: Create function to handle generation completion (called by n8n webhook)
CREATE OR REPLACE FUNCTION handle_generation_complete(
  queue_id UUID,
  result_data JSONB,
  file_url TEXT
)
RETURNS UUID AS $$
DECLARE
  v_deliverable_id UUID;
  v_queue_record RECORD;
BEGIN
  -- Get queue record
  SELECT * INTO v_queue_record FROM generation_queue WHERE id = queue_id;

  IF v_queue_record IS NULL THEN
    RAISE EXCEPTION 'Queue record not found: %', queue_id;
  END IF;

  -- Update queue status
  UPDATE generation_queue
  SET status = 'completed', result_data = result_data, completed_at = NOW()
  WHERE id = queue_id;

  -- Create deliverable
  INSERT INTO deliverables (
    client_id,
    generation_queue_id,
    tool_slug,
    title,
    description,
    file_type,
    storage_url,
    size_bytes
  ) VALUES (
    v_queue_record.client_id,
    queue_id,
    v_queue_record.tool_slug,
    COALESCE(result_data->>'title', v_queue_record.tool_slug),
    result_data->>'description',
    COALESCE(result_data->>'file_type', 'pdf'),
    file_url,
    COALESCE((result_data->>'size_bytes')::BIGINT, 0)
  ) RETURNING id INTO v_deliverable_id;

  RETURN v_deliverable_id;
END;
$$ LANGUAGE plpgsql;

-- ─── Notes ──────────────────────────────────────
-- - generation_queue tracks all generation requests (queued, processing, completed, failed)
-- - deliverables stores final output (PDF, PPTX, etc) with storage URLs
-- - n8n webhooks call handle_generation_complete() to create deliverables
-- - RLS ensures users only see their client's data
-- - Revisions system allows users to request changes without regenerating from scratch
-- - All timestamps are UTC for consistency
