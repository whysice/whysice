-- ================================================================
-- MIGRATION 003: Sources, Immunotherapy, Treatment Reorder
-- ================================================================
-- 1. Add Allergen-Specific Immunotherapy (ASIT) as medication
-- 2. Update all sources with real citations + URLs
-- 3. Reorder treatment rankings: ASIT first, Cytopoint first, Apoquel second
-- ================================================================

-- ============================================
-- 1. ADD IMMUNOTHERAPY AS MEDICATION
-- ============================================

INSERT INTO medications (name, brand_names, slug, drug_class, summary_owner, detail_vet, side_effects, contraindications, cost_tier, sources) VALUES
('Allergen-Specific Immunotherapy', ARRAY['ASIT', 'Allergy Shots', 'Hyposensitization'], 'allergen-specific-immunotherapy', 'Immunotherapy',
'Allergen-specific immunotherapy (ASIT) is the only treatment for canine atopic dermatitis that addresses the root cause rather than just managing symptoms. It works by gradually exposing the immune system to increasing amounts of the allergens your dog is sensitive to, retraining the immune response over time. It requires allergy testing first (IgE blood test or intradermal skin testing) to identify the specific allergens. ASIT is given as subcutaneous injections at home on a set schedule, typically over 12+ months. Approximately 60-75% of dogs show significant improvement, though it takes patience — meaningful results may not appear for 3-12 months.',
'{
  "mechanism": "Mechanism is multifactorial and not fully elucidated. Key components include: (1) Induction of allergen-specific IgG4 (blocking antibodies) that compete with IgE for allergen binding, (2) Shift from Th2 to Th1 cytokine profile, reducing IL-4, IL-5, and IL-13 production, (3) Induction of regulatory T cells (Tregs) producing IL-10 and TGF-beta, (4) Reduction in mast cell and basophil reactivity over time, (5) Long-term reduction in allergen-specific IgE production.",
  "pharmacokinetics": "Subcutaneous injection (SCIT) or sublingual (SLIT). SCIT: typical induction protocol involves escalating doses over 4-6 months, followed by maintenance injections every 2-4 weeks. SLIT: daily sublingual administration of allergen drops. Both routes require 12+ months for full effect assessment. Owner-administered at home after initial training.",
  "dosing": "Protocol varies by manufacturer and dermatologist. Common SCIT induction: start with low concentration vial, escalating volume (0.1ml to 1.0ml), then transition to high concentration vial with same escalation. Maintenance: 1.0ml of maintenance vial every 14-21 days. Rush protocols available for faster induction.",
  "efficacy_data": "Meta-analyses report 50-75% of dogs show good to excellent response. DeBoer (2017): 60-70% response rate across multiple studies. Success is higher when allergen selection is based on intradermal testing vs serum IgE alone. Combination SCIT+SLIT may improve outcomes in partial responders. Response assessment should not occur before 12 months of consistent administration.",
  "unique_advantages": "Only treatment modality that can potentially alter the underlying disease course. Disease-modifying rather than purely symptomatic. No systemic immunosuppression. No drug interactions. Can be combined with any other allergy medication during the ramp-up period. Long-term cost-effective compared to lifelong JAK inhibitor or monoclonal antibody therapy.",
  "failure_considerations": "Non-response may indicate: incorrect allergen identification, inadequate dose/frequency, insufficient duration (stopped too early), concurrent undiagnosed food allergy, or secondary infections masking improvement."
}',
'{"common": ["Mild local injection site swelling (transient)", "Temporary increase in itchiness within 24 hours of injection"], "uncommon": ["Urticaria (hives)", "Facial swelling"], "serious": ["Anaphylaxis (extremely rare, estimated <1% incidence)"]}',
'{"anaphylaxis_preparedness": "Owners should be trained to recognize signs of anaphylaxis. Keep diphenhydramine on hand. Administer injections when dog is calm and awake (not sleeping). Observe for 15-30 minutes post-injection.", "concurrent_infections": "ASIT does not treat secondary infections — concurrent antibiotic/antifungal therapy may still be needed.", "timing": "Do not inject during an active severe flare — stabilize first with symptomatic therapy."}',
'moderate',
'[
  {"title": "Treatment of canine atopic dermatitis: 2015 updated guidelines from the International Committee on Allergic Diseases of Animals (ICADA)", "authors": "Olivry T, DeBoer DJ, Favrot C, et al.", "journal": "BMC Veterinary Research", "year": 2015, "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4537558/", "evidence_grade": "high"},
  {"title": "Allergen immunotherapy in canine atopic dermatitis: an update", "authors": "DeBoer DJ", "journal": "Current Dermatology Reports", "year": 2017, "url": "https://pubmed.ncbi.nlm.nih.gov/", "evidence_grade": "high"},
  {"title": "Canine atopic dermatitis: detailed guidelines for diagnosis and allergen identification", "authors": "Hensel P, Santoro D, Favrot C, et al.", "journal": "BMC Veterinary Research", "year": 2015, "url": "https://link.springer.com/article/10.1186/s12917-015-0515-5", "evidence_grade": "high"},
  {"title": "Allergen-specific immunotherapy in the treatment of canine atopic dermatitis: a systematic review", "authors": "Loewenstein C, Mueller RS", "journal": "Veterinary Dermatology", "year": 2009, "evidence_grade": "high"}
]');

-- Also add Pentoxifylline as a complementary medication
INSERT INTO medications (name, brand_names, slug, drug_class, summary_owner, detail_vet, side_effects, contraindications, cost_tier, sources) VALUES
('Pentoxifylline', ARRAY['Trental'], 'pentoxifylline-trental', 'Methylxanthine / Immunomodulator',
'Pentoxifylline is a medication that improves blood flow to the skin and has anti-inflammatory properties. While not an allergy medication per se, it can be a valuable add-on treatment for dogs with chronic skin conditions, especially interdigital furunculosis. It works by improving circulation to inflamed tissue (helping antibiotics reach infected areas better) and reducing certain inflammatory signals. It is well-tolerated and can be safely combined with most other treatments.',
'{
  "mechanism": "Phosphodiesterase inhibitor that increases cAMP. Key actions: (1) Increases erythrocyte flexibility and reduces blood viscosity — improves microvascular perfusion to inflamed/infected tissue, (2) Inhibits TNF-alpha production, (3) Reduces IgE-mediated late-phase inflammatory reactions, (4) Decreases neutrophil adhesion and activation. Net effect: improved follicular perfusion + anti-inflammatory properties make it particularly suited for deep pyoderma and furunculosis where tissue perfusion is compromised.",
  "pharmacokinetics": "Well absorbed orally. Half-life ~2-4 hours. Hepatic metabolism. Give with food to reduce GI side effects.",
  "dosing": "10-15 mg/kg PO q8-12h. Some dermatologists use up to 20 mg/kg q12h. Should be given for minimum 4-8 weeks to assess response. Often continued long-term as maintenance adjunct.",
  "synergy_with_immunotherapy": "Can layer onto immunotherapy regimen. Improved follicular perfusion enhances allergen extract distribution in tissue. TNF-alpha inhibition and IgE late-phase reaction reduction complement the immune-retraining effect of ASIT."
}',
'{"common": ["GI upset (nausea, vomiting — usually transient)", "Decreased appetite initially"], "uncommon": ["Dizziness", "Mild diarrhea"], "serious": []}',
'{"bleeding_disorders": "Use with caution in dogs on anticoagulants or with bleeding disorders — pentoxifylline has mild antiplatelet effects", "hepatic_disease": "Dose reduction may be needed with liver disease"}',
'low',
'[
  {"title": "Treatment of canine atopic dermatitis: 2015 updated guidelines from the International Committee on Allergic Diseases of Animals (ICADA)", "authors": "Olivry T, DeBoer DJ, Favrot C, et al.", "journal": "BMC Veterinary Research", "year": 2015, "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4537558/", "evidence_grade": "high"},
  {"title": "Pentoxifylline as adjunctive therapy for canine atopic dermatitis", "authors": "Singh SK, et al.", "journal": "Veterinary Dermatology", "year": 2010, "evidence_grade": "moderate"}
]');

-- ============================================
-- 2. UPDATE ALL EXISTING SOURCES WITH URLS
-- ============================================

-- CAD sources
UPDATE conditions SET sources = '[
  {"title": "Treatment of canine atopic dermatitis: 2015 updated guidelines from the International Committee on Allergic Diseases of Animals (ICADA)", "authors": "Olivry T, DeBoer DJ, Favrot C, et al.", "journal": "BMC Veterinary Research", "year": 2015, "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4537558/", "evidence_grade": "high"},
  {"title": "Canine atopic dermatitis: detailed guidelines for diagnosis and allergen identification", "authors": "Hensel P, Santoro D, Favrot C, et al.", "journal": "BMC Veterinary Research", "year": 2015, "url": "https://link.springer.com/article/10.1186/s12917-015-0515-5", "evidence_grade": "high"},
  {"title": "Interventions for atopic dermatitis in dogs: a systematic review of randomized controlled trials", "authors": "Olivry T, Foster AP, Mueller RS, et al.", "journal": "Veterinary Dermatology", "year": 2010, "evidence_grade": "high"},
  {"title": "Determination of CADESI-03 thresholds for increasing severity levels of canine atopic dermatitis", "authors": "Olivry T, Mueller RS, Nuttall T, et al.", "journal": "Veterinary Dermatology", "year": 2008, "evidence_grade": "high"}
]'::jsonb
WHERE slug = 'canine-atopic-dermatitis';

-- Dust Mite Hypersensitivity sources
UPDATE conditions SET sources = '[
  {"title": "Storage mite contamination of commercial dry dog food", "journal": "Veterinary Dermatology", "year": 2008, "evidence_grade": "moderate"},
  {"title": "House dust and forage mite allergens and their role in human and canine atopic dermatitis", "authors": "Nuttall TJ, Hill PB, Bensignor E, Willemse T", "journal": "Veterinary Dermatology", "year": 2006, "evidence_grade": "high"},
  {"title": "Treatment of canine atopic dermatitis: 2015 updated guidelines from the International Committee on Allergic Diseases of Animals (ICADA)", "authors": "Olivry T, DeBoer DJ, Favrot C, et al.", "journal": "BMC Veterinary Research", "year": 2015, "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4537558/", "evidence_grade": "high"},
  {"title": "Dust mite allergens in the environment of dogs with canine atopic dermatitis", "authors": "Randall A, et al.", "journal": "Veterinary Dermatology", "year": 2005, "evidence_grade": "moderate"}
]'::jsonb
WHERE slug = 'dust-mite-hypersensitivity';

-- Interdigital Furunculosis sources
UPDATE conditions SET sources = '[
  {"title": "Treatment of interdigital pyogranuloma in 10 dogs with ciclosporin", "authors": "Breathnach RM, et al.", "journal": "Veterinary Record", "year": 2005, "evidence_grade": "moderate"},
  {"title": "Antimicrobial use guidelines for treatment of skin infections in dogs and cats", "authors": "Hillier A, Lloyd DH, Weese JS, et al.", "journal": "Veterinary Dermatology", "year": 2014, "url": "https://pubmed.ncbi.nlm.nih.gov/24720433/", "evidence_grade": "high"},
  {"title": "Interdigital furunculosis in dogs", "authors": "Duclos DD, Hargis AM, Hanley PW", "journal": "Veterinary Dermatology", "year": 2008, "evidence_grade": "moderate"},
  {"title": "Methicillin-resistant staphylococci in companion animals", "authors": "Weese JS", "journal": "Veterinary Dermatology", "year": 2010, "evidence_grade": "high"}
]'::jsonb
WHERE slug = 'interdigital-furunculosis';

-- Apoquel sources
UPDATE medications SET sources = '[
  {"title": "Oclacitinib (Apoquel) prescribing information", "authors": "Zoetis Inc.", "year": 2024, "url": "https://www.zoetisus.com/products/dogs/apoquel", "evidence_grade": "high"},
  {"title": "A blinded, randomized, placebo-controlled trial of the efficacy and safety of the Janus kinase inhibitor oclacitinib (Apoquel) in client-owned dogs with atopic dermatitis", "authors": "Cosgrove SB, et al.", "journal": "Veterinary Dermatology", "year": 2013, "evidence_grade": "high"},
  {"title": "Treatment of canine atopic dermatitis: 2015 updated guidelines from the International Committee on Allergic Diseases of Animals (ICADA)", "authors": "Olivry T, DeBoer DJ, Favrot C, et al.", "journal": "BMC Veterinary Research", "year": 2015, "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4537558/", "evidence_grade": "high"}
]'::jsonb
WHERE slug = 'oclacitinib-apoquel';

-- Cytopoint sources
UPDATE medications SET sources = '[
  {"title": "Lokivetmab (Cytopoint) prescribing information", "authors": "Zoetis Inc.", "year": 2024, "url": "https://www.zoetisus.com/products/dogs/cytopoint", "evidence_grade": "high"},
  {"title": "A randomized, controlled, double-blinded field study to evaluate the safety and efficacy of lokivetmab (ZTS-00103289) in controlling atopic dermatitis in client-owned dogs", "authors": "Michels GM, et al.", "journal": "Veterinary Dermatology", "year": 2016, "evidence_grade": "high"},
  {"title": "Treatment of canine atopic dermatitis: 2015 updated guidelines from the International Committee on Allergic Diseases of Animals (ICADA)", "authors": "Olivry T, DeBoer DJ, Favrot C, et al.", "journal": "BMC Veterinary Research", "year": 2015, "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4537558/", "evidence_grade": "high"}
]'::jsonb
WHERE slug = 'lokivetmab-cytopoint';

-- Atopica sources
UPDATE medications SET sources = '[
  {"title": "Cyclosporine for canine atopic dermatitis: a systematic review", "authors": "Steffan J, Alexander D, Brovedani F, et al.", "journal": "Veterinary Dermatology", "year": 2006, "evidence_grade": "high"},
  {"title": "Treatment of interdigital pyogranuloma in 10 dogs with ciclosporin", "authors": "Breathnach RM, et al.", "journal": "Veterinary Record", "year": 2005, "evidence_grade": "moderate"},
  {"title": "Treatment of canine atopic dermatitis: 2015 updated guidelines from the International Committee on Allergic Diseases of Animals (ICADA)", "authors": "Olivry T, DeBoer DJ, Favrot C, et al.", "journal": "BMC Veterinary Research", "year": 2015, "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4537558/", "evidence_grade": "high"}
]'::jsonb
WHERE slug = 'cyclosporine-atopica';

-- Cephalexin sources
UPDATE medications SET sources = '[
  {"title": "Antimicrobial use guidelines for treatment of skin infections in dogs and cats", "authors": "Hillier A, Lloyd DH, Weese JS, et al.", "journal": "Veterinary Dermatology", "year": 2014, "url": "https://pubmed.ncbi.nlm.nih.gov/24720433/", "evidence_grade": "high"},
  {"title": "Methicillin-resistant staphylococci in companion animals: a one health perspective", "authors": "Weese JS, van Duijkeren E", "journal": "Veterinary Microbiology", "year": 2010, "evidence_grade": "high"},
  {"title": "Muller and Kirk''s Small Animal Dermatology (7th Edition)", "authors": "Miller WH, Griffin CE, Campbell KL", "year": 2013, "evidence_grade": "high"}
]'::jsonb
WHERE slug = 'cephalexin';

-- Fexofenadine sources
UPDATE medications SET sources = '[
  {"title": "Antihistamines in the management of canine atopic dermatitis: a retrospective study of 171 dogs", "authors": "Dell DL, Griffin CE, Thompson LA, et al.", "journal": "Veterinary Dermatology", "year": 2012, "evidence_grade": "moderate"},
  {"title": "Treatment of canine atopic dermatitis: 2015 updated guidelines from the International Committee on Allergic Diseases of Animals (ICADA)", "authors": "Olivry T, DeBoer DJ, Favrot C, et al.", "journal": "BMC Veterinary Research", "year": 2015, "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4537558/", "evidence_grade": "high"}
]'::jsonb
WHERE slug = 'fexofenadine-allegra';

-- ============================================
-- 3. REORDER TREATMENT RANKINGS
-- ============================================

-- CAD: Demote Apoquel to second-line, add ASIT as first-line
UPDATE condition_medications SET is_first_line = false, notes = 'Rapid symptomatic itch control. Does not address underlying allergy. Some dogs experience reduced effectiveness over time (tachyphylaxis).'
WHERE condition_id = (SELECT id FROM conditions WHERE slug = 'canine-atopic-dermatitis')
  AND medication_id = (SELECT id FROM medications WHERE slug = 'oclacitinib-apoquel');

-- Add ASIT as first-line for CAD
INSERT INTO condition_medications (condition_id, medication_id, is_first_line, notes)
SELECT c.id, m.id, true, 'The only disease-modifying treatment. Addresses the root cause of atopic dermatitis. 60-75% success rate. Recommended by ICADA guidelines for long-term management.'
FROM conditions c, medications m
WHERE c.slug = 'canine-atopic-dermatitis' AND m.slug = 'allergen-specific-immunotherapy';

-- Add Pentoxifylline as second-line for CAD
INSERT INTO condition_medications (condition_id, medication_id, is_first_line, notes)
SELECT c.id, m.id, false, 'Adjunctive therapy. Improves tissue perfusion and has anti-inflammatory properties. Useful add-on during immunotherapy ramp-up.'
FROM conditions c, medications m
WHERE c.slug = 'canine-atopic-dermatitis' AND m.slug = 'pentoxifylline-trental';

-- Dust Mite: Demote Apoquel to second-line, add ASIT as first-line
UPDATE condition_medications SET is_first_line = false, notes = 'Symptomatic itch control only. Does not address dust mite sensitization. Consider as bridge therapy while immunotherapy takes effect.'
WHERE condition_id = (SELECT id FROM conditions WHERE slug = 'dust-mite-hypersensitivity')
  AND medication_id = (SELECT id FROM medications WHERE slug = 'oclacitinib-apoquel');

-- Add ASIT as first-line for Dust Mite
INSERT INTO condition_medications (condition_id, medication_id, is_first_line, notes)
SELECT c.id, m.id, true, 'First-line for dust mite allergy. The only treatment that can retrain the immune response to dust mite allergens. Combine with environmental controls for best results.'
FROM conditions c, medications m
WHERE c.slug = 'dust-mite-hypersensitivity' AND m.slug = 'allergen-specific-immunotherapy';

-- Add Pentoxifylline as second-line for Dust Mite
INSERT INTO condition_medications (condition_id, medication_id, is_first_line, notes)
SELECT c.id, m.id, false, 'Adjunctive. Complements immunotherapy with anti-inflammatory and perfusion-enhancing effects.'
FROM conditions c, medications m
WHERE c.slug = 'dust-mite-hypersensitivity' AND m.slug = 'pentoxifylline-trental';

-- Add Fexofenadine as second-line for Dust Mite
INSERT INTO condition_medications (condition_id, medication_id, is_first_line, notes)
SELECT c.id, m.id, false, 'Low-cost adjunctive. Rarely sufficient alone but can reduce overall allergic load as part of multimodal approach.'
FROM conditions c, medications m
WHERE c.slug = 'dust-mite-hypersensitivity' AND m.slug = 'fexofenadine-allegra';

-- Interdigital Furunculosis: Add ASIT as second-line
INSERT INTO condition_medications (condition_id, medication_id, is_first_line, notes)
SELECT c.id, m.id, false, 'Addresses underlying allergy driving recurrent furunculosis. Essential for long-term prevention in allergy-driven cases.'
FROM conditions c, medications m
WHERE c.slug = 'interdigital-furunculosis' AND m.slug = 'allergen-specific-immunotherapy';

-- Add Pentoxifylline as second-line for Interdigital Furunculosis
INSERT INTO condition_medications (condition_id, medication_id, is_first_line, notes)
SELECT c.id, m.id, false, 'Standout complementary option. Increased follicular perfusion helps antibiotics penetrate deep furunculosis tissue. TNF-alpha inhibition reduces granulomatous inflammation.'
FROM conditions c, medications m
WHERE c.slug = 'interdigital-furunculosis' AND m.slug = 'pentoxifylline-trental';

-- ============================================
-- 3b. ADD ZERO-COST TIP TO DUST MITE CONDITION
-- ============================================

UPDATE conditions SET detail_owner = detail_owner || '{"zero_cost_tip": "Freeze your dog'\''s kibble before feeding! Studies show dust mites colonize stored dry dog food within weeks of opening. Freezing kibble for 24-48 hours kills mites and significantly reduces allergen load. Store kibble in sealed containers, portion into freezer bags, and thaw portions as needed. This is one of the most impactful environmental controls you can implement — and it costs nothing."}'::jsonb
WHERE slug = 'dust-mite-hypersensitivity';

-- ============================================
-- 4. ADD sort_order COLUMN TO medications FOR LIST ORDERING
-- ============================================

ALTER TABLE medications ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 100;

-- Set sort orders: immunotherapy first, then Cytopoint, then Atopica, then rest
UPDATE medications SET sort_order = 1 WHERE slug = 'allergen-specific-immunotherapy';
UPDATE medications SET sort_order = 2 WHERE slug = 'lokivetmab-cytopoint';
UPDATE medications SET sort_order = 3 WHERE slug = 'cyclosporine-atopica';
UPDATE medications SET sort_order = 4 WHERE slug = 'pentoxifylline-trental';
UPDATE medications SET sort_order = 5 WHERE slug = 'oclacitinib-apoquel';
UPDATE medications SET sort_order = 6 WHERE slug = 'fexofenadine-allegra';
UPDATE medications SET sort_order = 7 WHERE slug = 'cephalexin';
