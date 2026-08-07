-- ============================================================================
-- StyleMe AI: Database DDL Schema & Migrations
-- Target Database: PostgreSQL 15+ with PostGIS
-- ============================================================================

-- Enable PostGIS and UUID Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define Custom Enum Types (If applicable, or use CHECK constraints for portability)
-- We will use CHECK constraints in DDL definitions for max portability and flexibility.

-- ============================================================================
-- 1. AUTHENTICATION & ACCESS CONTROL
-- ============================================================================

CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INT REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- In production, uuid_generate_v7() would be used
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_email_or_phone CHECK (email IS NOT NULL OR phone_number IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- ============================================================================
-- 2. USER & BARBER PROFILES
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(512),
    gender VARCHAR(20),
    date_of_birth DATE,
    hair_profile JSONB, -- stores density, texture, etc.
    loyalty_points INT DEFAULT 0,
    device_tokens VARCHAR[] DEFAULT '{}'::VARCHAR[],
    preferred_language VARCHAR(10) DEFAULT 'uz' NOT NULL
);

CREATE TABLE IF NOT EXISTS barber_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(150) NOT NULL,
    bio TEXT,
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    geog GEOGRAPHY(Point, 4326),
    is_available BOOLEAN DEFAULT TRUE NOT NULL,
    work_hours JSONB NOT NULL DEFAULT '{}'::JSONB,
    skills VARCHAR[] DEFAULT '{}'::VARCHAR[],
    crm_settings JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE TABLE IF NOT EXISTS barber_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barber_id UUID REFERENCES barber_profiles(user_id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    document_url VARCHAR(512) NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING' NOT NULL,
    verified_by UUID REFERENCES users(id),
    rejection_reason TEXT,
    verified_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_verification_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

-- ============================================================================
-- 3. HAIRSTYLES & AI RESULTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS hairstyle_catalog (
    id SERIAL PRIMARY KEY,
    name_translations JSONB NOT NULL, -- {"en": "Buzz Cut", "uz": "Bazz Kat"}
    description_translations JSONB,
    reference_image_url VARCHAR(512) NOT NULL,
    face_shape_compatibility VARCHAR[] DEFAULT '{}'::VARCHAR[],
    lora_weight_path VARCHAR(512),
    difficulty_rating VARCHAR(30) DEFAULT 'MEDIUM' NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    CONSTRAINT chk_difficulty CHECK (difficulty_rating IN ('EASY', 'MEDIUM', 'HARD'))
);

CREATE TABLE IF NOT EXISTS ai_analysis_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    raw_image_url VARCHAR(512) NOT NULL,
    analysis_type VARCHAR(30) NOT NULL,
    face_shape VARCHAR(30) NOT NULL,
    landmarks_json_url VARCHAR(512) NOT NULL,
    biometric_metrics JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_analysis_type CHECK (analysis_type IN ('HAIR', 'BEARD', 'SKIN'))
);

CREATE TABLE IF NOT EXISTS ai_generated_hairstyles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID REFERENCES ai_analysis_results(id) ON DELETE CASCADE,
    hairstyle_id INT REFERENCES hairstyle_catalog(id) ON DELETE CASCADE,
    generated_image_url VARCHAR(512),
    status VARCHAR(30) DEFAULT 'QUEUED' NOT NULL,
    queue_duration_ms INT,
    inference_duration_ms INT,
    error_log TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_generation_status CHECK (status IN ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'))
);

-- ============================================================================
-- 4. BOOKINGS (Partitioned by range on scheduled_start)
-- ============================================================================

CREATE TABLE bookings (
    id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    barber_id UUID NOT NULL REFERENCES barber_profiles(user_id),
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
    current_status VARCHAR(30) DEFAULT 'PENDING' NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    is_paid BOOLEAN DEFAULT FALSE NOT NULL,
    service_notes TEXT,
    otp_code VARCHAR(6),
    otp_verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (id, scheduled_start),
    CONSTRAINT chk_booking_status CHECK (current_status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
    CONSTRAINT chk_payment_method CHECK (payment_method IN ('CASH', 'DIGITAL'))
) PARTITION BY RANGE (scheduled_start);

-- Create initial monthly partitions for 2026
CREATE TABLE bookings_y2026m06 PARTITION OF bookings FOR VALUES FROM ('2026-06-01 00:00:00+00') TO ('2026-07-01 00:00:00+00');
CREATE TABLE bookings_y2026m07 PARTITION OF bookings FOR VALUES FROM ('2026-07-01 00:00:00+00') TO ('2026-08-01 00:00:00+00');
CREATE TABLE bookings_y2026m08 PARTITION OF bookings FOR VALUES FROM ('2026-08-01 00:00:00+00') TO ('2026-09-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS booking_status_history (
    id BIGSERIAL PRIMARY KEY,
    booking_id UUID NOT NULL,
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    status_from VARCHAR(30),
    status_to VARCHAR(30) NOT NULL,
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================================================
-- 5. REVIEWS & REPUTATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    barber_id UUID REFERENCES barber_profiles(user_id) ON DELETE CASCADE,
    rating SMALLINT NOT NULL,
    comment TEXT,
    is_moderated BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_rating CHECK (rating BETWEEN 1 AND 5)
);

CREATE TABLE IF NOT EXISTS review_moderations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID UNIQUE REFERENCES reviews(id) ON DELETE CASCADE,
    moderated_by UUID REFERENCES users(id),
    decision VARCHAR(30) NOT NULL,
    notes TEXT,
    moderated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_moderation_decision CHECK (decision IN ('APPROVED', 'REJECTED_SPAM', 'REJECTED_OFFENSIVE'))
);

CREATE TABLE IF NOT EXISTS barber_rankings (
    barber_id UUID PRIMARY KEY REFERENCES barber_profiles(user_id) ON DELETE CASCADE,
    raw_score DECIMAL(5,2) DEFAULT 0.00 NOT NULL,
    rank_grade VARCHAR(2) DEFAULT 'C' NOT NULL,
    completed_bookings_count INT DEFAULT 0 NOT NULL,
    repeat_customer_rate DECIMAL(5,2) DEFAULT 0.00 NOT NULL,
    complaint_rate DECIMAL(5,2) DEFAULT 0.00 NOT NULL,
    activity_consistency_score DECIMAL(5,2) DEFAULT 0.00 NOT NULL,
    last_recalculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_rank_grade CHECK (rank_grade IN ('F','E','D','C','B','A','S'))
);

CREATE TABLE IF NOT EXISTS rank_history (
    id BIGSERIAL PRIMARY KEY,
    barber_id UUID REFERENCES barber_profiles(user_id) ON DELETE CASCADE,
    raw_score DECIMAL(5,2) NOT NULL,
    rank_grade VARCHAR(2) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    favoritable_type VARCHAR(50) NOT NULL,
    favoritable_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_favoritable_type CHECK (favoritable_type IN ('BARBER', 'HAIRSTYLE'))
);

-- ============================================================================
-- 6. PAYMENTS & LEDGER
-- ============================================================================

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'UZS' NOT NULL,
    payment_gateway VARCHAR(50) NOT NULL,
    gateway_transaction_id VARCHAR(100) UNIQUE,
    status VARCHAR(30) DEFAULT 'PENDING' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_payment_amount CHECK (amount > 0),
    CONSTRAINT chk_payment_gateway CHECK (payment_gateway IN ('PAYME', 'CLICK', 'CASH')),
    CONSTRAINT chk_payment_status CHECK (status IN ('PENDING', 'SUCCEEDED', 'REFUNDED', 'FAILED'))
);

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    sender_user_id UUID REFERENCES users(id),
    receiver_user_id UUID REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    type VARCHAR(30) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_transaction_type CHECK (type IN ('COMMISSION_DEBIT', 'BARBER_PAYOUT', 'USER_PAYMENT', 'REFUND'))
);

CREATE TABLE IF NOT EXISTS revenue_tracking (
    id BIGSERIAL PRIMARY KEY,
    recorded_date DATE UNIQUE NOT NULL,
    gross_digital_revenue DECIMAL(12,2) DEFAULT 0.00 NOT NULL,
    gross_cash_revenue DECIMAL(12,2) DEFAULT 0.00 NOT NULL,
    platform_commission_revenue DECIMAL(12,2) DEFAULT 0.00 NOT NULL,
    total_payouts DECIMAL(12,2) DEFAULT 0.00 NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS financial_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_type VARCHAR(30) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    totals JSONB NOT NULL DEFAULT '{}'::JSONB,
    s3_document_url VARCHAR(512) NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_report_type CHECK (report_type IN ('MONTHLY', 'QUARTERLY', 'YEARLY'))
);

-- ============================================================================
-- 7. AUDITS, NOTIFICATIONS & COMPLAINTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_actions (
    id BIGSERIAL PRIMARY KEY,
    admin_id UUID REFERENCES users(id),
    action_type VARCHAR(100) NOT NULL,
    target_id UUID NOT NULL,
    reason TEXT NOT NULL,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS reports_complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reported_barber_id UUID REFERENCES barber_profiles(user_id) ON DELETE CASCADE,
    reported_review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    issue_type VARCHAR(50) NOT NULL,
    details TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'OPEN' NOT NULL,
    resolved_by UUID REFERENCES users(id),
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_report_status CHECK (status IN ('OPEN', 'UNDER_INVESTIGATION', 'RESOLVED')),
    CONSTRAINT chk_issue_type CHECK (issue_type IN ('NO_SHOW', 'ABUSE', 'POOR_HYGIENE', 'UNSANITARY'))
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID NOT NULL,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    body TEXT NOT NULL,
    type VARCHAR(30) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (id, created_at),
    CONSTRAINT chk_notification_type CHECK (type IN ('BOOKING_ALERT', 'PROMOTION', 'SYSTEM'))
) PARTITION BY RANGE (created_at);

-- Create initial monthly partitions for notifications
CREATE TABLE notifications_y2026m06 PARTITION OF notifications FOR VALUES FROM ('2026-06-01 00:00:00+00') TO ('2026-07-01 00:00:00+00');
CREATE TABLE notifications_y2026m07 PARTITION OF notifications FOR VALUES FROM ('2026-07-01 00:00:00+00') TO ('2026-08-01 00:00:00+00');

-- ============================================================================
-- 8. INDEXES CONFIGURATION
-- ============================================================================

-- Spatial Indexing (Uzbekistan search coordinates projection)
CREATE INDEX IF NOT EXISTS barber_geo_idx ON barber_profiles USING GIST (geog);

-- Compound Indexes
CREATE INDEX IF NOT EXISTS bookings_search_idx ON bookings (barber_id, scheduled_start);
CREATE INDEX IF NOT EXISTS reviews_barber_idx ON reviews (barber_id, rating);
CREATE UNIQUE INDEX IF NOT EXISTS favorites_polymorphic_idx ON favorites (user_id, favoritable_type, favoritable_id);

-- Partial Indexes
CREATE INDEX IF NOT EXISTS active_barber_idx ON barber_profiles (user_id) WHERE is_available = TRUE;

-- ============================================================================
-- 9. DATABASE SEED DATA
-- ============================================================================

-- Seed Roles
INSERT INTO roles (name, description) VALUES
('OWNER', 'Full platform control and financial oversight'),
('ADMIN', 'Profile verifications, user moderation, report review'),
('BARBER', 'Commercial barber profiles, schedule and booking management'),
('USER', 'Consumer client account')
ON CONFLICT (name) DO NOTHING;

-- Seed Basic Permissions
INSERT INTO permissions (slug, description) VALUES
('admins.manage', 'Ability to create and delete administrator accounts'),
('commissions.adjust', 'Ability to modify platform commission rates'),
('barbers.verify', 'Verify and approve barber business profiles'),
('reviews.moderate', 'Moderate flagged reviews'),
('payments.withdraw', 'Settle payouts to barber bank cards')
ON CONFLICT (slug) DO NOTHING;

-- Seed Role Permissions (Owner get all)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'OWNER'
ON CONFLICT DO NOTHING;

-- Seed Admin Permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'ADMIN' AND p.slug IN ('barbers.verify', 'reviews.moderate')
ON CONFLICT DO NOTHING;

-- Seed Hairstyle Catalog
INSERT INTO hairstyle_catalog (name_translations, description_translations, reference_image_url, face_shape_compatibility, difficulty_rating) VALUES
(
  '{"en": "Textured Crop Fade", "uz": "Teksturali Krop Feyd"}',
  '{"en": "A modern cropped look combined with a high skin fade.", "uz": "Yuqori feyd bilan birlashtirilgan zamonaviy qisqa soch turmagi."}',
  'https://storage.uzcloud.uz/hairstyle-assets/crop_fade.jpg',
  ARRAY['OVAL', 'ROUND', 'DIAMOND'],
  'MEDIUM'
),
(
  '{"en": "Classic Side Part", "uz": "Klassik Yon Turmak"}',
  '{"en": "A timeless side part ideal for office and formal wear.", "uz": "Ofis va rasmiy kiyimlar uchun mos bo''lgan klassik yon turmak."}',
  'https://storage.uzcloud.uz/hairstyle-assets/side_part.jpg',
  ARRAY['OVAL', 'SQUARE', 'OBLONG'],
  'EASY'
),
(
  '{"en": "Modern Pompadour", "uz": "Zamonaviy Pompadur"}',
  '{"en": "Voluminous hair swept upwards and back with tapered sides.", "uz": "Yon qismlari tekislangan, yuqoriga va orqaga taralgan hajmli soch."}',
  'https://storage.uzcloud.uz/hairstyle-assets/pompadour.jpg',
  ARRAY['ROUND', 'OVAL', 'HEART'],
  'HARD'
),
(
  '{"en": "Buzz Cut", "uz": "Bazz Kat (Qisqa)"}',
  '{"en": "A simple, ultra-short haircut all around the head.", "uz": "Bosh bo''ylab bir tekisda kesilgan o''ta qisqa soch turmagi."}',
  'https://storage.uzcloud.uz/hairstyle-assets/buzz_cut.jpg',
  ARRAY['OVAL', 'SQUARE', 'DIAMOND'],
  'EASY'
)
ON CONFLICT DO NOTHING;
