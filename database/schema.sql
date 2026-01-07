-- =====================================================
-- Local Listings Engine - PostgreSQL Schema
-- Multi-tenant SaaS for managing local directory listings
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For geo coordinates if needed

-- =====================================================
-- CORE TENANT TABLES
-- =====================================================

-- Agencies (top-level tenant)
CREATE TABLE agencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL, -- e.g., "acme-plumbing"
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    website VARCHAR(500),
    logo_url VARCHAR(1000),

    -- Subscription/billing
    stripe_customer_id VARCHAR(100) UNIQUE, -- Agency-level Stripe customer
    plan VARCHAR(50) DEFAULT 'starter', -- starter, professional, enterprise

    -- Settings
    settings JSONB DEFAULT '{}', -- Flexible settings storage

    -- Status
    status VARCHAR(50) DEFAULT 'active', -- active, suspended, canceled

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_agencies_slug ON agencies(slug);
CREATE INDEX idx_agencies_status ON agencies(status) WHERE deleted_at IS NULL;

-- Users (agency members)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- bcrypt hash

    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url VARCHAR(1000),
    phone VARCHAR(50),

    -- Auth
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,

    -- Status
    status VARCHAR(50) DEFAULT 'active', -- active, suspended, invited

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_status ON users(status);

-- Agency Memberships (many-to-many: users <-> agencies)
CREATE TABLE agency_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Role-based access control
    role VARCHAR(50) NOT NULL DEFAULT 'member', -- owner, admin, member, viewer

    -- Permissions (for granular control)
    permissions JSONB DEFAULT '[]', -- ['manage_businesses', 'view_billing', etc.]

    -- Status
    status VARCHAR(50) DEFAULT 'active', -- active, suspended, invited
    invited_by UUID REFERENCES users(id),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(agency_id, user_id)
);

CREATE INDEX idx_agency_memberships_agency ON agency_memberships(agency_id);
CREATE INDEX idx_agency_memberships_user ON agency_memberships(user_id);
CREATE INDEX idx_agency_memberships_role ON agency_memberships(role);

-- =====================================================
-- BUSINESS ENTITIES
-- =====================================================

-- Businesses (client locations - master profiles)
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,

    -- Basic Info
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    description TEXT,

    -- Contact
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(500),

    -- Address (structured)
    address_line_1 VARCHAR(255),
    address_line_2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(2) DEFAULT 'US',

    -- Geocoding
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    geo_point GEOGRAPHY(POINT, 4326), -- PostGIS point for spatial queries

    -- Business Details
    categories JSONB DEFAULT '[]', -- ["Plumbing", "HVAC", "Emergency Services"]
    industry VARCHAR(100), -- Primary category

    -- Hours of operation (structured by weekday)
    hours JSONB DEFAULT '{
        "monday": {"open": "09:00", "close": "17:00", "isClosed": false},
        "tuesday": {"open": "09:00", "close": "17:00", "isClosed": false},
        "wednesday": {"open": "09:00", "close": "17:00", "isClosed": false},
        "thursday": {"open": "09:00", "close": "17:00", "isClosed": false},
        "friday": {"open": "09:00", "close": "17:00", "isClosed": false},
        "saturday": {"open": "10:00", "close": "14:00", "isClosed": false},
        "sunday": {"open": null, "close": null, "isClosed": true}
    }',

    -- Media
    logo_url VARCHAR(1000),
    cover_photo_url VARCHAR(1000),
    photos JSONB DEFAULT '[]', -- [{"url": "...", "caption": "..."}]

    -- Social Media
    social_profiles JSONB DEFAULT '{}', -- {"facebook": "url", "instagram": "username"}

    -- Business Type
    business_type VARCHAR(50) DEFAULT 'SERVICE_AREA', -- SERVICE_AREA, STOREFRONT, HYBRID
    service_areas JSONB DEFAULT '[]', -- [{"city": "San Francisco", "radius": 25}]

    -- Listings Engine Integration
    yext_location_id VARCHAR(100) UNIQUE, -- External ID in Yext
    yext_last_synced_at TIMESTAMP WITH TIME ZONE,
    yext_sync_status VARCHAR(50) DEFAULT 'not_synced', -- not_synced, pending, synced, error
    yext_sync_error TEXT,

    -- Status
    status VARCHAR(50) DEFAULT 'draft', -- draft, active, suspended, closed
    onboarding_step VARCHAR(50) DEFAULT 'basic_info', -- basic_info, scan, review, activate

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_businesses_agency ON businesses(agency_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_businesses_status ON businesses(status);
CREATE INDEX idx_businesses_yext_location ON businesses(yext_location_id);
CREATE INDEX idx_businesses_geo ON businesses USING GIST(geo_point);

-- =====================================================
-- DIRECTORIES (Listing Platforms)
-- =====================================================

-- Directories (Google, Yelp, Bing, etc.)
CREATE TABLE directories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Identity
    name VARCHAR(100) NOT NULL UNIQUE, -- "Google Business Profile"
    slug VARCHAR(100) NOT NULL UNIQUE, -- "google_business"

    -- Metadata
    logo_url VARCHAR(1000),
    description TEXT,
    website VARCHAR(500),

    -- Integration Type
    type VARCHAR(50) NOT NULL, -- engine_managed, direct_api, manual_only
    -- engine_managed: Yext handles it
    -- direct_api: We integrate directly (future)
    -- manual_only: User manually claims (Facebook, Instagram)

    -- Publisher ID in Yext
    yext_publisher_id VARCHAR(100) UNIQUE, -- e.g., "GOOGLEMYBUSINESS"

    -- Priority for optimization scoring
    priority INTEGER DEFAULT 0, -- Higher = more important (Google=100, small dirs=1)

    -- Availability (which industries/countries supported)
    supported_countries JSONB DEFAULT '["US"]',
    supported_industries JSONB DEFAULT '[]', -- Empty = all industries

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_directories_slug ON directories(slug);
CREATE INDEX idx_directories_type ON directories(type);
CREATE INDEX idx_directories_priority ON directories(priority DESC);

-- =====================================================
-- BUSINESS-DIRECTORY RELATIONSHIP
-- =====================================================

-- Business Directory Status (tracks sync status per directory)
CREATE TABLE business_directory_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    directory_id UUID NOT NULL REFERENCES directories(id) ON DELETE CASCADE,

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'unavailable',
    -- unavailable: Not yet activated
    -- pending: Sync in progress
    -- live: Successfully published
    -- error: Failed to sync
    -- inactive: Subscription canceled or manually disabled
    -- under_review: Directory is reviewing the listing

    -- External IDs
    external_listing_id VARCHAR(255), -- ID in the directory platform
    external_url VARCHAR(1000), -- Live listing URL

    -- Sync tracking
    last_synced_at TIMESTAMP WITH TIME ZONE,
    last_error_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,

    -- Directory-specific data
    listing_data JSONB DEFAULT '{}', -- Store directory-specific fields

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(business_id, directory_id)
);

CREATE INDEX idx_business_directory_business ON business_directory_status(business_id);
CREATE INDEX idx_business_directory_directory ON business_directory_status(directory_id);
CREATE INDEX idx_business_directory_status ON business_directory_status(status);

-- =====================================================
-- BILLING & SUBSCRIPTIONS
-- =====================================================

-- Subscriptions (Listings plans per business)
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,

    -- Stripe
    stripe_customer_id VARCHAR(100) NOT NULL, -- Could be agency or business-specific
    stripe_subscription_id VARCHAR(100) UNIQUE NOT NULL,
    stripe_price_id VARCHAR(100) NOT NULL,

    -- Plan details
    plan_name VARCHAR(100) NOT NULL, -- "Listings Starter", "Listings Pro"
    plan_tier VARCHAR(50) DEFAULT 'starter', -- starter, pro, enterprise

    -- Pricing
    price_to_client DECIMAL(10, 2) NOT NULL, -- What we charge (e.g., $39.00)
    cost_to_us DECIMAL(10, 2), -- What Yext charges us (e.g., $15.00)
    currency VARCHAR(3) DEFAULT 'USD',
    billing_interval VARCHAR(20) DEFAULT 'month', -- month, year

    -- Status
    status VARCHAR(50) NOT NULL,
    -- trialing, active, past_due, canceled, unpaid

    -- Dates
    trial_end TIMESTAMP WITH TIME ZONE,
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    canceled_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_business ON subscriptions(business_id);
CREATE INDEX idx_subscriptions_agency ON subscriptions(agency_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- =====================================================
-- JOB QUEUE & BACKGROUND TASKS
-- =====================================================

-- Jobs (background task tracking)
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Job identification
    type VARCHAR(100) NOT NULL,
    -- sync_to_engine, refresh_status, webhook_processing, bulk_sync

    -- Related entities
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,

    -- Job state
    state VARCHAR(50) NOT NULL DEFAULT 'pending',
    -- pending, processing, completed, failed, retrying

    -- Payload
    payload JSONB DEFAULT '{}', -- Job-specific data
    result JSONB, -- Job output/result

    -- Error handling
    error_message TEXT,
    stack_trace TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,

    -- Timing
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,

    -- BullMQ integration
    bull_job_id VARCHAR(100), -- Reference to Redis job

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_jobs_type ON jobs(type);
CREATE INDEX idx_jobs_state ON jobs(state);
CREATE INDEX idx_jobs_business ON jobs(business_id);
CREATE INDEX idx_jobs_created ON jobs(created_at DESC);

-- =====================================================
-- WEBHOOKS & INTEGRATIONS
-- =====================================================

-- Webhook Events (incoming from Stripe, Yext, etc.)
CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Source
    source VARCHAR(50) NOT NULL, -- stripe, yext
    event_type VARCHAR(100) NOT NULL, -- customer.subscription.updated, location.published

    -- Idempotency
    external_event_id VARCHAR(255) UNIQUE NOT NULL, -- Stripe event ID or Yext webhook ID

    -- Payload
    payload JSONB NOT NULL,

    -- Processing
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_source ON webhook_events(source);
CREATE INDEX idx_webhook_events_external_id ON webhook_events(external_event_id);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed);

-- =====================================================
-- AUDIT LOG
-- =====================================================

-- Audit Log (track all changes for compliance)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Who
    user_id UUID REFERENCES users(id),
    agency_id UUID REFERENCES agencies(id),

    -- What
    entity_type VARCHAR(100) NOT NULL, -- Business, Subscription, etc.
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- created, updated, deleted

    -- Changes
    changes JSONB, -- {"field": {"old": "...", "new": "..."}}

    -- Context
    ip_address INET,
    user_agent TEXT,

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_agency ON audit_logs(agency_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- =====================================================
-- OPTIMIZATION SCORE CACHE
-- =====================================================

-- Optimization Scores (cached calculation results)
CREATE TABLE optimization_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID UNIQUE NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

    -- Score breakdown
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    base_score DECIMAL(5, 2),
    completeness_bonus DECIMAL(5, 2),
    priority_publisher_bonus DECIMAL(5, 2),
    penalties DECIMAL(5, 2),

    -- Metrics
    total_directories INTEGER DEFAULT 0,
    live_directories INTEGER DEFAULT 0,
    pending_directories INTEGER DEFAULT 0,
    error_directories INTEGER DEFAULT 0,

    -- Profile completeness flags
    has_hours BOOLEAN DEFAULT FALSE,
    has_category BOOLEAN DEFAULT FALSE,
    has_website BOOLEAN DEFAULT FALSE,
    has_description BOOLEAN DEFAULT FALSE,
    has_photos BOOLEAN DEFAULT FALSE,
    has_logo BOOLEAN DEFAULT FALSE,

    -- Priority publishers
    google_live BOOLEAN DEFAULT FALSE,
    yelp_live BOOLEAN DEFAULT FALSE,
    facebook_live BOOLEAN DEFAULT FALSE,

    -- Cache invalidation
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_optimization_scores_business ON optimization_scores(business_id);
CREATE INDEX idx_optimization_scores_score ON optimization_scores(score DESC);

-- =====================================================
-- SEED DATA: DIRECTORIES
-- =====================================================

-- Insert common directories (Yext publishers)
INSERT INTO directories (name, slug, type, yext_publisher_id, priority, logo_url) VALUES
('Google Business Profile', 'google_business', 'engine_managed', 'GOOGLEMYBUSINESS', 100, 'https://www.google.com/favicon.ico'),
('Yelp', 'yelp', 'engine_managed', 'YELP', 90, 'https://s3-media0.fl.yelpcdn.com/assets/srv0/yelp_favicon/5f5afc80e8e8/favicon.ico'),
('Facebook', 'facebook', 'engine_managed', 'FACEBOOKPAGES', 85, 'https://www.facebook.com/favicon.ico'),
('Bing Places', 'bing_places', 'engine_managed', 'BING', 75, 'https://www.bing.com/favicon.ico'),
('Apple Maps', 'apple_maps', 'engine_managed', 'APPLEMAPS', 80, 'https://www.apple.com/favicon.ico'),
('Yahoo', 'yahoo', 'engine_managed', 'YAHOO', 60, 'https://www.yahoo.com/favicon.ico'),
('YP.com', 'yp', 'engine_managed', 'YP', 50, 'https://www.yp.com/favicon.ico'),
('Foursquare', 'foursquare', 'engine_managed', 'FOURSQUARE', 55, 'https://foursquare.com/favicon.ico'),
('MapQuest', 'mapquest', 'engine_managed', 'MAPQUEST', 45, 'https://www.mapquest.com/favicon.ico'),
('Angi', 'angi', 'engine_managed', 'ANGIESLIST', 70, 'https://www.angi.com/favicon.ico'),
('HomeAdvisor', 'homeadvisor', 'engine_managed', 'HOMEADVISOR', 65, 'https://www.homeadvisor.com/favicon.ico'),
('Nextdoor', 'nextdoor', 'engine_managed', 'NEXTDOOR', 60, 'https://nextdoor.com/favicon.ico'),
('BBB', 'bbb', 'engine_managed', 'BBB', 55, 'https://www.bbb.org/favicon.ico'),
('Superpages', 'superpages', 'engine_managed', 'SUPERPAGES', 40, 'https://www.superpages.com/favicon.ico'),
('Citysearch', 'citysearch', 'engine_managed', 'CITYSEARCH', 35, 'https://www.citysearch.com/favicon.ico');

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_agencies_updated_at BEFORE UPDATE ON agencies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_business_directory_status_updated_at BEFORE UPDATE ON business_directory_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update geo_point from lat/long
CREATE OR REPLACE FUNCTION update_business_geo_point()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.geo_point = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_businesses_geo_point BEFORE INSERT OR UPDATE ON businesses
FOR EACH ROW EXECUTE FUNCTION update_business_geo_point();

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- Active businesses with subscription status
CREATE VIEW active_businesses_with_subscriptions AS
SELECT
    b.*,
    s.id AS subscription_id,
    s.status AS subscription_status,
    s.plan_name,
    s.price_to_client,
    s.current_period_end,
    a.name AS agency_name,
    a.slug AS agency_slug
FROM businesses b
LEFT JOIN subscriptions s ON b.id = s.business_id AND s.status IN ('active', 'trialing')
JOIN agencies a ON b.agency_id = a.id
WHERE b.deleted_at IS NULL AND b.status = 'active';

-- Business optimization summary
CREATE VIEW business_optimization_summary AS
SELECT
    b.id AS business_id,
    b.name AS business_name,
    b.agency_id,
    COALESCE(os.score, 0) AS optimization_score,
    COALESCE(os.live_directories, 0) AS live_directories,
    COALESCE(os.total_directories, 0) AS total_directories,
    CASE
        WHEN os.score >= 80 THEN 'Excellent'
        WHEN os.score >= 60 THEN 'Good'
        WHEN os.score >= 40 THEN 'Fair'
        ELSE 'Poor'
    END AS optimization_rating,
    b.yext_sync_status,
    s.status AS subscription_status
FROM businesses b
LEFT JOIN optimization_scores os ON b.id = os.business_id
LEFT JOIN subscriptions s ON b.id = s.business_id AND s.status IN ('active', 'trialing')
WHERE b.deleted_at IS NULL;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE agencies IS 'Top-level tenant organizations (marketing agencies)';
COMMENT ON TABLE users IS 'User accounts with authentication credentials';
COMMENT ON TABLE businesses IS 'Client business locations (master profiles for listings sync)';
COMMENT ON TABLE directories IS 'Listing platforms/publishers (Google, Yelp, etc.)';
COMMENT ON TABLE business_directory_status IS 'Tracks sync status between businesses and directories';
COMMENT ON TABLE subscriptions IS 'Stripe subscriptions for Listings feature per business';
COMMENT ON TABLE jobs IS 'Background job queue tracking for async operations';
COMMENT ON TABLE webhook_events IS 'Incoming webhook events from Stripe, Yext, etc.';
COMMENT ON TABLE audit_logs IS 'Audit trail for compliance and debugging';
COMMENT ON TABLE optimization_scores IS 'Cached optimization score calculations';
