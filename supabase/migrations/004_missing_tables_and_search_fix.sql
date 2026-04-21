-- ================================================================
-- MIGRATION 004: Missing Tables + Search Fix
-- ================================================================
-- 1. Create treatment_medications junction table
-- 2. Create document_metadata table
-- 3. Create search_documents RPC function
-- 4. Fix search_wiki to include category_slug
-- 5. Add RLS policies for new tables
-- ================================================================

-- ============================================
-- 1. TREATMENT_MEDICATIONS JUNCTION TABLE
-- ============================================
-- Referenced by supabase.ts getTreatmentLogs() and setTreatmentMedications()
-- but never created in any prior migration.

CREATE TABLE IF NOT EXISTS treatment_medications (
  treatment_log_id UUID NOT NULL REFERENCES treatment_logs(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (treatment_log_id, medication_id)
);

CREATE INDEX idx_tm_treatment ON treatment_medications(treatment_log_id);
CREATE INDEX idx_tm_medication ON treatment_medications(medication_id);

-- ============================================
-- 2. DOCUMENT_METADATA TABLE
-- ============================================
-- Referenced by uploadDocument(), getDocuments(), updateDocumentMetadata(),
-- searchDocuments(), deleteDocument() in supabase.ts — but never created.

CREATE TABLE IF NOT EXISTS document_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dog_id UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  category TEXT NOT NULL DEFAULT 'general',
  display_name TEXT,
  description TEXT,
  doc_date DATE,
  vet_visit_id UUID REFERENCES vet_visits(id) ON DELETE SET NULL,
  treatment_log_id UUID REFERENCES treatment_logs(id) ON DELETE SET NULL,
  tags TEXT[],
  -- Fields for AI-processed document content
  extracted_text TEXT,
  parsed_data JSONB,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_docmeta_user ON document_metadata(user_id);
CREATE INDEX idx_docmeta_dog ON document_metadata(dog_id);
CREATE INDEX idx_docmeta_visit ON document_metadata(vet_visit_id);
CREATE INDEX idx_docmeta_treatment ON document_metadata(treatment_log_id);
CREATE INDEX idx_docmeta_category ON document_metadata(category);
CREATE INDEX idx_docmeta_search ON document_metadata USING GIN(search_vector);
CREATE INDEX idx_docmeta_tags ON document_metadata USING GIN(tags);

-- Auto-generate search vector for documents
CREATE OR REPLACE FUNCTION document_metadata_search_update() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.file_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.display_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.extracted_text, '')), 'C');
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER document_metadata_search_trigger
  BEFORE INSERT OR UPDATE ON document_metadata
  FOR EACH ROW EXECUTE FUNCTION document_metadata_search_update();

-- ============================================
-- 3. SEARCH_DOCUMENTS RPC FUNCTION
-- ============================================
-- Called by searchDocuments() in supabase.ts

CREATE OR REPLACE FUNCTION search_documents(
  search_query TEXT,
  dog_id_filter UUID DEFAULT NULL,
  result_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  file_name TEXT,
  display_name TEXT,
  description TEXT,
  category TEXT,
  doc_date DATE,
  storage_path TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
    SELECT
      dm.id,
      dm.file_name,
      dm.display_name,
      dm.description,
      dm.category,
      dm.doc_date,
      dm.storage_path,
      ts_rank(dm.search_vector, websearch_to_tsquery('english', search_query)) AS rank
    FROM document_metadata dm
    WHERE (dm.search_vector @@ websearch_to_tsquery('english', search_query)
           OR dm.file_name ILIKE '%' || search_query || '%'
           OR dm.display_name ILIKE '%' || search_query || '%')
      AND (dog_id_filter IS NULL OR dm.dog_id = dog_id_filter)
    ORDER BY rank DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. FIX search_wiki TO INCLUDE category_slug
-- ============================================
-- The current search_wiki returns category_name but not category_slug,
-- so the search page can't build correct links to condition pages.

CREATE OR REPLACE FUNCTION search_wiki(search_query TEXT, result_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  id UUID,
  type TEXT,
  name TEXT,
  slug TEXT,
  summary TEXT,
  category_name TEXT,
  category_slug TEXT,
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
      cat.slug AS category_slug,
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
      NULL::TEXT AS category_slug,
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
-- 5. RLS POLICIES
-- ============================================

-- treatment_medications: users can manage their own (via dog ownership chain)
ALTER TABLE treatment_medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own treatment medications" ON treatment_medications
  FOR ALL USING (
    treatment_log_id IN (
      SELECT tl.id FROM treatment_logs tl
      JOIN dogs d ON tl.dog_id = d.id
      WHERE d.user_id = auth.uid()
    )
  );

-- document_metadata: users can only access their own documents
ALTER TABLE document_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own documents" ON document_metadata
  FOR ALL USING (auth.uid() = user_id);
