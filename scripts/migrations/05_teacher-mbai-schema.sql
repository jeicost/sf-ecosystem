-- Phase 3.5: Teacher MBAI Instance Schema
-- Purpose: Educational platform with spaced repetition (future)
-- Apps: projects/forma
-- RLS Strategy: User + course isolation
-- Note: Deferred, created for completeness

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Courses
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  level TEXT DEFAULT 'intermediate',
  instructor_id UUID REFERENCES users(id),
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Course enrollments
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  progress_percent INT DEFAULT 0,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Content modules
CREATE TABLE IF NOT EXISTS content_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  order_index INT,
  module_type TEXT DEFAULT 'lesson',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Concept extraction from content
CREATE TABLE IF NOT EXISTS concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES content_modules(id) ON DELETE CASCADE,
  concept_text TEXT NOT NULL,
  importance_level TEXT DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Concept reviews (spaced repetition tracking)
CREATE TABLE IF NOT EXISTS concept_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  easiness_factor DECIMAL(3, 2) DEFAULT 2.5,
  repetition_count INT DEFAULT 0,
  interval_days INT DEFAULT 1,
  next_review_date TIMESTAMP,
  last_reviewed_at TIMESTAMP,
  quality_of_response INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, concept_id)
);

-- Sessions (learning sessions)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES content_modules(id),
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  duration_minutes INT,
  concepts_reviewed INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Quiz attempts
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES content_modules(id),
  score INT,
  total_points INT,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users: Own profile only" ON users
  FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "Courses: Published or instructor" ON courses
  FOR SELECT USING (
    is_published OR
    instructor_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Enrollments: Own enrollments" ON enrollments
  FOR ALL USING (
    user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  )
  WITH CHECK (
    user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Content modules: Via course access" ON content_modules
  FOR SELECT USING (
    course_id IN (
      SELECT course_id FROM enrollments
      WHERE user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    ) OR
    course_id IN (
      SELECT id FROM courses
      WHERE is_published AND instructor_id = (
        SELECT id FROM users WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Concepts: Via module access" ON concepts
  FOR SELECT USING (
    module_id IN (
      SELECT id FROM content_modules
      WHERE course_id IN (
        SELECT course_id FROM enrollments
        WHERE user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Concept reviews: Own reviews" ON concept_reviews
  FOR ALL USING (
    user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  )
  WITH CHECK (
    user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Sessions: Own sessions" ON sessions
  FOR ALL USING (
    user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  )
  WITH CHECK (
    user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Quiz attempts: Own attempts" ON quiz_attempts
  FOR ALL USING (
    user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  )
  WITH CHECK (
    user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_content_modules_course_id ON content_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_concepts_module_id ON concepts(module_id);
CREATE INDEX IF NOT EXISTS idx_concept_reviews_user_id ON concept_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_concept_reviews_next_review ON concept_reviews(next_review_date);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);

-- Grants
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
