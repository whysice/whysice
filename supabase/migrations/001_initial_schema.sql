-- Whysice Canine Dermatology Wiki
-- Initial Schema Migration
-- Created: 2026-03-26

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- KNOWLEDGE BASE TABLES
-- ============================================

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_sort ON categories(sort_order);

-- Conditions
CREATE TABLE conditions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary_owner TEXT NOT NULL,
  detail_owner JSONB NOT NULL DEFAULT '{}',
  detail_vet JSONB,
  breeds_affected TEXT[],
  severity_range TEXT CHECK (severity_range IN ('mild', 'moderate', 'severe', 'variable')),
  is_contagious BOOLEAN NOT NULL DEFAULT false,
  search_vector TSVECTOR,
  tags TEXT[],
  sources JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_conditions_slug ON conditions(slug);
CREATE INDEX idx_conditions_category ON conditions(category_id);
CREATE INDEX idx_conditions_search ON conditions USING GIN(search_vector);
CREATE INDEX idx_conditions_tags ON conditions USING GIN(tags);
CREATE INDEX idx_conditions_breeds ON conditions USING GIN(breeds_affected);

-- Auto-generate search vector
CREATE OR REPLACE FUNCTION conditions_search_vector_update() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.summary_owner, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER conditions_search_update
  BEFORE INSERT OR UPDATE ON conditions
  FOR EACH ROW EXECUTE FUNCTION conditions_search_vector_update();

-- Medications
CREATE TABLE medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  brand_names TEXT[],
  slug TEXT NOT NULL UNIQUE,
  drug_class TEXT NOT NULL,
  summary_owner TEXT NOT NULL,
  detail_vet JSONB,
  side_effects JSONB NOT NULL DEFAULT '{"common":[],"uncommon":[],"serious":[]}',
  contraindications JSONB,
  cost_tier TEXT CHECK (cost_tier IN ('low', 'moderate', 'high', 'premium')),
  search_vector TSVECTOR,
  sources JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_medications_slug ON medications(slug);
CREATE INDEX idx_medications_search ON medications USING GIN(search_vector);
CREATE INDEX idx_medications_class ON medications(drug_class);

-- Auto-generate medication search vector
CREATE OR REPLACE FUNCTION medications_search_vector_update() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.brand_names, ' '), '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.summary_owner, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.drug_class, '')), 'C');
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER medications_search_update
  BEFORE INSERT OR UPDATE ON medications
  FOR EACH ROW EXECUTE FUNCTION medications_search_vector_update();

-- Condition <-> Medication junction
CREATE TABLE condition_medications (
  condition_id UUID NOT NULL REFERENCES conditions(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  is_first_line BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  PRIMARY KEY (condition_id, medication_id)
);

CREATE INDEX idx_cm_condition ON condition_medications(condition_id);
CREATE INDEX idx_cm_medication ON condition_medications(medication_id);

-- ============================================
-- PERSONAL TRACKING TABLES
-- ============================================

-- Dogs
CREATE TABLE dogs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  breed TEXT,
  dob DATE,
  weight_lbs NUMERIC,
  known_allergies TEXT[],
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dogs_user ON dogs(user_id);

-- Symptom Log
CREATE TABLE symptom_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dog_id UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  body_area TEXT NOT NULL,
  symptom_type TEXT NOT NULL,
  severity INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 5),
  photo_urls TEXT[],
  notes TEXT,
  environmental_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_symptom_logs_dog ON symptom_logs(dog_id);
CREATE INDEX idx_symptom_logs_date ON symptom_logs(dog_id, date DESC);

-- Treatment Log
CREATE TABLE treatment_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dog_id UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  medication_id UUID REFERENCES medications(id) ON DELETE SET NULL,
  treatment_name TEXT NOT NULL,
  date_started DATE NOT NULL,
  date_ended DATE,
  dosage TEXT,
  frequency TEXT,
  effectiveness INTEGER CHECK (effectiveness BETWEEN 1 AND 5),
  side_effects_observed TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_treatment_logs_dog ON treatment_logs(dog_id);
CREATE INDEX idx_treatment_logs_dates ON treatment_logs(dog_id, date_started DESC);
CREATE INDEX idx_treatment_logs_medication ON treatment_logs(medication_id);

-- Vet Visits
CREATE TABLE vet_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dog_id UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL,
  vet_name TEXT,
  reason TEXT NOT NULL,
  diagnosis TEXT,
  treatment_plan JSONB,
  follow_up_date DATE,
  documents TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vet_visits_dog ON vet_visits(dog_id);
CREATE INDEX idx_vet_visits_date ON vet_visits(dog_id, visit_date DESC);

-- ============================================
-- COMMUNITY CONTRIBUTION TABLE
-- ============================================

CREATE TABLE suggested_edits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('condition', 'medication', 'new_condition', 'new_medication')),
  target_id UUID,
  field_name TEXT,
  current_value TEXT,
  proposed_value TEXT NOT NULL,
  reason TEXT,
  sources JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revision_requested')),
  reviewer_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_suggested_edits_status ON suggested_edits(status);
CREATE INDEX idx_suggested_edits_user ON suggested_edits(user_id);
CREATE INDEX idx_suggested_edits_target ON suggested_edits(target_type, target_id);

-- ============================================
-- UNIFIED SEARCH FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION search_wiki(search_query TEXT, result_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  id UUID,
  type TEXT,
  name TEXT,
  slug TEXT,
  summary TEXT,
  category_name TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
    SELECT
      c.id,
      'condition'::TEXT AS type,
      c.name,
      c.slug,
      c.summary_owner AS summary,
      cat.name AS category_name,
      ts_rank(c.search_vector, websearch_to_tsquery('english', search_query)) AS rank
    FROM conditions c
    JOIN categories cat ON c.category_id = cat.id
    WHERE c.search_vector @@ websearch_to_tsquery('english', search_query)
       OR c.name ILIKE '%' || search_query || '%'

    UNION ALL

    SELECT
      m.id,
      'medication'::TEXT AS type,
      m.name,
      m.slug,
      m.summary_owner AS summary,
      m.drug_class AS category_name,
      ts_rank(m.search_vector, websearch_to_tsquery('english', search_query)) AS rank
    FROM medications m
    WHERE m.search_vector @@ websearch_to_tsquery('english', search_query)
       OR m.name ILIKE '%' || search_query || '%'
       OR EXISTS (
         SELECT 1 FROM unnest(m.brand_names) bn WHERE bn ILIKE '%' || search_query || '%'
       )

    ORDER BY rank DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Knowledge base: public read
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE condition_medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read conditions" ON conditions FOR SELECT USING (true);
CREATE POLICY "Public read medications" ON medications FOR SELECT USING (true);
CREATE POLICY "Public read condition_medications" ON condition_medications FOR SELECT USING (true);

-- Personal tracking: user owns their data
ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptom_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vet_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own dogs" ON dogs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own symptom logs" ON symptom_logs
  FOR ALL USING (dog_id IN (SELECT id FROM dogs WHERE user_id = auth.uid()));

CREATE POLICY "Users manage own treatment logs" ON treatment_logs
  FOR ALL USING (dog_id IN (SELECT id FROM dogs WHERE user_id = auth.uid()));

CREATE POLICY "Users manage own vet visits" ON vet_visits
  FOR ALL USING (dog_id IN (SELECT id FROM dogs WHERE user_id = auth.uid()));

-- Suggested edits: users can create their own, read all approved
ALTER TABLE suggested_edits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users create own suggestions" ON suggested_edits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own suggestions" ON suggested_edits
  FOR SELECT USING (auth.uid() = user_id OR status = 'approved');

CREATE POLICY "Users update own pending suggestions" ON suggested_edits
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');
