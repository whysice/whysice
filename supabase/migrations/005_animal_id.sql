-- ================================================================
-- MIGRATION 005: Whysice ID fields + public share RPC
-- ================================================================
-- Extends `dogs` with the fields a portable ID card needs (microchip,
-- emergency contact, primary vet) plus a `share_token` the owner can
-- hand out to a boarder, new clinic, or ER.
--
-- A SECURITY DEFINER RPC `get_shared_dog(token)` returns a sanitized
-- snapshot of a dog + active treatments when the token is valid and
-- not expired. This lets unauthenticated callers resolve a share link
-- without granting broad SELECT rights on `dogs`.
-- ================================================================

-- ============================================
-- 1. DOG COLUMNS
-- ============================================

ALTER TABLE dogs
  ADD COLUMN IF NOT EXISTS microchip_id TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS primary_vet_name TEXT,
  ADD COLUMN IF NOT EXISTS primary_vet_phone TEXT,
  ADD COLUMN IF NOT EXISTS share_token UUID UNIQUE,
  ADD COLUMN IF NOT EXISTS share_expires_at TIMESTAMPTZ;

-- Fast lookup for the public RPC
CREATE INDEX IF NOT EXISTS idx_dogs_share_token ON dogs(share_token)
  WHERE share_token IS NOT NULL;

-- ============================================
-- 2. PUBLIC SHARE RPC
-- ============================================
-- Called by getSharedDog() in supabase.ts. Runs as the function owner
-- (SECURITY DEFINER) so it can read `dogs` without RLS blocking the
-- anonymous caller — but it only returns rows whose token matches and
-- hasn't expired, so exposure is scoped to what the owner explicitly
-- shared.

CREATE OR REPLACE FUNCTION get_shared_dog(share_token_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'name', d.name,
    'breed', d.breed,
    'dob', d.dob,
    'weight_lbs', d.weight_lbs,
    'known_allergies', d.known_allergies,
    'photo_url', d.photo_url,
    'microchip_id', d.microchip_id,
    'emergency_contact_name', d.emergency_contact_name,
    'emergency_contact_phone', d.emergency_contact_phone,
    'primary_vet_name', d.primary_vet_name,
    'primary_vet_phone', d.primary_vet_phone,
    'share_expires_at', d.share_expires_at,
    'active_treatments', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'treatment_name', t.treatment_name,
          'dosage', t.dosage,
          'frequency', t.frequency,
          'date_started', t.date_started,
          'medication_name', m.name,
          'medication_slug', m.slug
        )
        ORDER BY t.date_started DESC
      )
      FROM treatment_logs t
      LEFT JOIN medications m ON m.id = t.medication_id
      WHERE t.dog_id = d.id AND t.date_ended IS NULL
    ), '[]'::jsonb)
  )
  INTO result
  FROM dogs d
  WHERE d.share_token = share_token_param
    AND (d.share_expires_at IS NULL OR d.share_expires_at > now());

  RETURN result; -- NULL when token is invalid, expired, or revoked
END;
$$;

-- Allow anonymous and authenticated callers to execute the RPC
REVOKE ALL ON FUNCTION get_shared_dog(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_shared_dog(UUID) TO anon, authenticated;

-- ============================================
-- 3. NOTES ON SHARE TOKEN LIFECYCLE
-- ============================================
-- Creation and revocation happen through standard UPDATEs on `dogs`;
-- the existing "Users manage own dogs" RLS policy already gates those
-- writes to the owner, so no new policy is needed.
--
-- Rotate:  UPDATE dogs SET share_token = gen_random_uuid() WHERE id = :id
-- Revoke:  UPDATE dogs SET share_token = NULL, share_expires_at = NULL WHERE id = :id
