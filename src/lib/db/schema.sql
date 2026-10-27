-- Student Hub PostgreSQL Schema
-- Fully normalized relational architecture for Classes 9-12 education platform

-- 1. ACCOUNTS AND PERMISSIONS
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token TEXT,
    email_verification_sent_at TIMESTAMPTZ,
    password_reset_token TEXT,
    password_reset_expires_at TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS student_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_exam_year INT,
    bio TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. ACADEMIC CATALOGUE
CREATE TABLE IF NOT EXISTS curricula (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name_en TEXT NOT NULL,
    name_ur TEXT NOT NULL,
    country TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS boards (
    id TEXT PRIMARY KEY,
    curriculum_id TEXT NOT NULL REFERENCES curricula(id) ON DELETE RESTRICT,
    code TEXT NOT NULL,
    name_en TEXT NOT NULL,
    name_ur TEXT NOT NULL,
    jurisdiction TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS academic_levels (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    name_en TEXT NOT NULL,
    name_ur TEXT NOT NULL,
    grade_order INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name_en TEXT NOT NULL,
    name_ur TEXT NOT NULL,
    icon_name TEXT,
    category TEXT NOT NULL CHECK (category IN ('science', 'humanities', 'languages', 'compulsory', 'general')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subject_offerings (
    id TEXT PRIMARY KEY,
    curriculum_id TEXT NOT NULL REFERENCES curricula(id) ON DELETE RESTRICT,
    board_id TEXT REFERENCES boards(id) ON DELETE RESTRICT,
    academic_level_id TEXT NOT NULL REFERENCES academic_levels(id) ON DELETE RESTRICT,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    syllabus_year TEXT DEFAULT '2024-2026',
    description_en TEXT,
    description_ur TEXT,
    is_verified BOOLEAN DEFAULT TRUE,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_offering UNIQUE (curriculum_id, board_id, academic_level_id, subject_id)
);

CREATE TABLE IF NOT EXISTS chapters (
    id TEXT PRIMARY KEY,
    subject_offering_id TEXT NOT NULL REFERENCES subject_offerings(id) ON DELETE CASCADE,
    chapter_number INT NOT NULL,
    title_en TEXT NOT NULL,
    title_ur TEXT NOT NULL,
    description_en TEXT,
    description_ur TEXT,
    order_index INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS topics (
    id TEXT PRIMARY KEY,
    chapter_id TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    topic_number TEXT NOT NULL,
    title_en TEXT NOT NULL,
    title_ur TEXT NOT NULL,
    summary_en TEXT,
    summary_ur TEXT,
    order_index INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_academic_preferences (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    curriculum_id TEXT REFERENCES curricula(id) ON DELETE SET NULL,
    board_id TEXT REFERENCES boards(id) ON DELETE SET NULL,
    academic_level_id TEXT REFERENCES academic_levels(id) ON DELETE SET NULL,
    preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'ur')),
    onboarding_completed BOOLEAN DEFAULT FALSE,
    selected_subject_ids JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. LEARNING CONTENT & VERSIONING WORKFLOW
CREATE TABLE IF NOT EXISTS learning_resources (
    id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    resource_type TEXT DEFAULT 'lesson' CHECK (resource_type IN ('lesson', 'summary', 'formula_sheet')),
    title_en TEXT NOT NULL,
    title_ur TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resource_versions (
    id TEXT PRIMARY KEY,
    resource_id TEXT NOT NULL REFERENCES learning_resources(id) ON DELETE CASCADE,
    language TEXT NOT NULL CHECK (language IN ('en', 'ur')),
    version_number INT NOT NULL,
    title TEXT NOT NULL,
    content_markdown TEXT NOT NULL,
    key_takeaways JSONB DEFAULT '[]'::jsonb,
    formulas JSONB DEFAULT '[]'::jsonb,
    source_citation TEXT,
    author_type TEXT DEFAULT 'human' CHECK (author_type IN ('human', 'ai_assisted')),
    author_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    review_status TEXT DEFAULT 'draft' CHECK (review_status IN ('draft', 'in_review', 'approved', 'rejected', 'archived')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_resource_lang_version UNIQUE(resource_id, language, version_number)
);

CREATE TABLE IF NOT EXISTS resource_reviews (
    id TEXT PRIMARY KEY,
    resource_version_id TEXT NOT NULL REFERENCES resource_versions(id) ON DELETE CASCADE,
    reviewer_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status TEXT NOT NULL CHECK (status IN ('approved', 'rejected', 'needs_revision')),
    feedback_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resource_publications (
    id TEXT PRIMARY KEY,
    resource_id TEXT NOT NULL REFERENCES learning_resources(id) ON DELETE CASCADE,
    language TEXT NOT NULL CHECK (language IN ('en', 'ur')),
    published_version_id TEXT NOT NULL REFERENCES resource_versions(id) ON DELETE RESTRICT,
    published_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    is_active BOOLEAN DEFAULT TRUE,
    published_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    unpublished_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS content_reports (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_id TEXT NOT NULL REFERENCES learning_resources(id) ON DELETE CASCADE,
    issue_type TEXT NOT NULL CHECK (issue_type IN ('factual_error', 'typo', 'translation_issue', 'broken_formula', 'other')),
    description TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
    resolved_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. QUIZ SYSTEM
CREATE TABLE IF NOT EXISTS quizzes (
    id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    title_en TEXT NOT NULL,
    title_ur TEXT NOT NULL,
    description_en TEXT,
    description_ur TEXT,
    time_limit_seconds INT DEFAULT 600,
    passing_percentage INT DEFAULT 60,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quiz_questions (
    id TEXT PRIMARY KEY,
    quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_number INT NOT NULL,
    question_text_en TEXT NOT NULL,
    question_text_ur TEXT NOT NULL,
    explanation_en TEXT NOT NULL,
    explanation_ur TEXT NOT NULL,
    points INT DEFAULT 1,
    difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS question_options (
    id TEXT PRIMARY KEY,
    question_id TEXT NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    option_key TEXT NOT NULL CHECK (option_key IN ('A', 'B', 'C', 'D')),
    option_text_en TEXT NOT NULL,
    option_text_ur TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
    id TEXT PRIMARY KEY,
    quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_questions INT NOT NULL,
    correct_count INT NOT NULL,
    score_percentage NUMERIC(5,2) NOT NULL,
    passed BOOLEAN NOT NULL,
    time_spent_seconds INT NOT NULL,
    snapshot_quiz_title TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS quiz_responses (
    id TEXT PRIMARY KEY,
    attempt_id TEXT NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    question_text TEXT NOT NULL,
    selected_option_id TEXT,
    selected_option_key TEXT,
    is_correct BOOLEAN NOT NULL,
    correct_option_key TEXT NOT NULL,
    explanation TEXT NOT NULL
);

-- 5. STUDENT ACTIVITY & PROGRESS
CREATE TABLE IF NOT EXISTS bookmarks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_topic_bookmark UNIQUE (user_id, topic_id)
);

CREATE TABLE IF NOT EXISTS topic_progress (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    view_count INT DEFAULT 1,
    CONSTRAINT unique_user_topic_progress UNIQUE (user_id, topic_id)
);

CREATE TABLE IF NOT EXISTS study_tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. AI TUTOR & PLANS
CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    daily_ai_limit INT NOT NULL DEFAULT 20,
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_plan_assignments (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS ai_conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    context_subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
    context_topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    sender_role TEXT NOT NULL CHECK (sender_role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    token_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_usage_events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    conversation_id TEXT REFERENCES ai_conversations(id) ON DELETE SET NULL,
    query_tokens INT DEFAULT 0,
    response_tokens INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. AUDIT TRAIL
CREATE TABLE IF NOT EXISTS admin_audit_events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_offerings_lookup ON subject_offerings(curriculum_id, board_id, academic_level_id);
CREATE INDEX IF NOT EXISTS idx_chapters_offering ON chapters(subject_offering_id);
CREATE INDEX IF NOT EXISTS idx_topics_chapter ON topics(chapter_id);
CREATE INDEX IF NOT EXISTS idx_resource_topic ON learning_resources(topic_id);
CREATE INDEX IF NOT EXISTS idx_resource_versions_lookup ON resource_versions(resource_id, language, review_status);
CREATE INDEX IF NOT EXISTS idx_publications_lookup ON resource_publications(resource_id, language, is_active);
CREATE INDEX IF NOT EXISTS idx_quiz_topic ON quizzes(topic_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_topic_progress_user ON topic_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON study_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_day ON ai_usage_events(user_id, created_at);
