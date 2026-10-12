-- ============================================================================
-- CodeGuardian AI — PostgreSQL Database Schema & Migration Script
-- Production-Ready Migration for PostgreSQL & Supabase
-- ============================================================================

-- Enable pgcrypto / uuid-ossp extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- Table 1: profiles / users
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'developer',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================================
-- Table 2: analysis_history / analyses
-- ============================================================================
CREATE TABLE IF NOT EXISTS analyses (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) DEFAULT 'Untitled Analysis',
    language VARCHAR(50) NOT NULL,
    code TEXT NOT NULL,
    code_hash TEXT,
    quality_score DOUBLE PRECISION DEFAULT 100.0,
    risk_score DOUBLE PRECISION DEFAULT 0.0,
    findings_count INTEGER DEFAULT 0,
    critical_count INTEGER DEFAULT 0,
    high_count INTEGER DEFAULT 0,
    medium_count INTEGER DEFAULT 0,
    low_count INTEGER DEFAULT 0,
    duration_ms INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_language ON analyses(language);

-- ============================================================================
-- Table 3: analysis_findings / findings
-- ============================================================================
CREATE TABLE IF NOT EXISTS findings (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    analysis_id VARCHAR(36) REFERENCES analyses(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    severity VARCHAR(50) NOT NULL,  -- Critical, High, Medium, Low, Informational
    category VARCHAR(50) NOT NULL,  -- Security, Bug, Code Smell, Maintainability
    line_start INTEGER DEFAULT 1,
    line_end INTEGER DEFAULT 1,
    col_start INTEGER DEFAULT 1,
    col_end INTEGER DEFAULT 1,
    snippet TEXT,
    explanation TEXT NOT NULL,
    impact TEXT,
    recommended_fix TEXT,
    confidence VARCHAR(50) DEFAULT 'High',
    detection_method VARCHAR(100) DEFAULT 'Static Analysis',
    suggested_patch TEXT,
    rule_id VARCHAR(100),
    duplicate_group_id VARCHAR(36),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_findings_analysis_id ON findings(analysis_id);
CREATE INDEX IF NOT EXISTS idx_findings_severity ON findings(severity);
CREATE INDEX IF NOT EXISTS idx_findings_category ON findings(category);

-- ============================================================================
-- Table 4: duplicate_groups
-- ============================================================================
CREATE TABLE IF NOT EXISTS duplicate_groups (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    analysis_id VARCHAR(36) REFERENCES analyses(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    count INTEGER DEFAULT 1,
    similarity_score DOUBLE PRECISION DEFAULT 1.0
);

CREATE INDEX IF NOT EXISTS idx_duplicate_groups_analysis_id ON duplicate_groups(analysis_id);

-- ============================================================================
-- Table 5: user_settings
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_settings (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(36) UNIQUE REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    theme VARCHAR(20) DEFAULT 'light',
    default_language VARCHAR(50) DEFAULT 'python',
    realtime_analysis BOOLEAN DEFAULT TRUE,
    debounce_delay_ms INTEGER DEFAULT 800,
    ai_provider VARCHAR(50) DEFAULT 'gemini',
    ai_model_name VARCHAR(100) DEFAULT 'gemini-1.5-pro',
    data_retention_days INTEGER DEFAULT 30,
    save_source_code BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- ============================================================================
-- Row Level Security (RLS) - Recommended for Supabase
-- ============================================================================
-- Uncomment if using Supabase client directly:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE findings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
