-- =====================================================
-- MASTER ACCOUNT SEED SCRIPT
-- Creates a master admin account for testing
-- =====================================================

-- Insert Master Agency
INSERT INTO agencies (id, name, slug, email, phone, plan, status, stripe_customer_id, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001', -- Fixed UUID for master agency
    'ChaosListings Master',
    'chaoslistings-master',
    'admin@chaoslistings.com',
    NULL,
    'enterprise',
    'active',
    NULL, -- Stripe customer will be created on first subscription
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert Master User
-- Password: MasterPass123! (hashed with bcrypt, cost 10)
INSERT INTO users (id, email, password_hash, first_name, last_name, status, email_verified, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000002', -- Fixed UUID for master user
    'admin@chaoslistings.com',
    '$2b$10$X8qJ9Z5Y3mH9V6K4N2L8eOYx5K7Q9R3W1E6T8U4P0M2S5V7X9Z1A3', -- MasterPass123!
    'Master',
    'Admin',
    'active',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Insert Agency Membership (Owner role)
INSERT INTO agency_memberships (id, agency_id, user_id, role, permissions, status, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001', -- Master agency
    '00000000-0000-0000-0000-000000000002', -- Master user
    'owner',
    '["*"]', -- All permissions
    'active',
    NOW(),
    NOW()
) ON CONFLICT (agency_id, user_id) DO NOTHING;

-- Display credentials
SELECT
    '✅ MASTER ACCOUNT CREATED' as status,
    'admin@chaoslistings.com' as email,
    'MasterPass123!' as password,
    'Use these credentials to login' as note;

COMMIT;
