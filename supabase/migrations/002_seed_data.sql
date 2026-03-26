-- Whysice Seed Data
-- Phase 1 Categories + Initial Conditions + Medications

-- ============================================
-- CATEGORIES
-- ============================================

INSERT INTO categories (name, slug, description, icon, sort_order) VALUES
('Allergies & Atopy', 'allergies-atopy', 'Environmental and food allergies, atopic dermatitis, and hypersensitivity reactions in dogs.', 'shield-alert', 1),
('Interdigital Cysts & Furunculosis', 'interdigital-furunculosis', 'Paw infections, interdigital cysts, furunculosis, and pododermatitis.', 'footprints', 2),
('Bacterial & Fungal Infections', 'infections', 'Pyoderma, yeast dermatitis, ringworm, and secondary skin infections.', 'bug', 3),
('Breed-Specific Conditions', 'breed-specific', 'Dermatological conditions with strong breed predispositions.', 'dna', 4),
('Parasitic Skin Disease', 'parasitic', 'Mange, flea allergy dermatitis, and other ectoparasite-driven conditions.', 'search', 5);

-- ============================================
-- CONDITIONS
-- ============================================

-- Allergies & Atopy
INSERT INTO conditions (category_id, name, slug, summary_owner, detail_owner, detail_vet, breeds_affected, severity_range, is_contagious, tags, sources) VALUES

((SELECT id FROM categories WHERE slug = 'allergies-atopy'),
'Canine Atopic Dermatitis',
'canine-atopic-dermatitis',
'Canine atopic dermatitis (CAD) is a chronic, inherited allergic skin disease caused by an overreaction of the immune system to environmental allergens like dust mites, pollen, and mold. It is one of the most common skin conditions in dogs, typically appearing between 1-3 years of age. Dogs with CAD experience intense itching, recurrent skin and ear infections, and progressive worsening without treatment.',
'{
  "what_it_is": "A genetic predisposition to develop allergic reactions to normally harmless environmental substances. The skin barrier in atopic dogs is often defective, allowing allergens to penetrate more easily and trigger immune responses.",
  "common_symptoms": ["Persistent itching (face, paws, ears, belly, armpits)", "Red, inflamed skin", "Recurrent ear infections", "Paw licking and chewing", "Skin thickening and darkening over time", "Secondary bacterial or yeast infections", "Hair loss from scratching"],
  "triggers": ["Dust mites (most common year-round trigger)", "Tree, grass, and weed pollens (seasonal)", "Mold spores", "Dander from other animals"],
  "diagnosis": "Diagnosis is clinical - based on history, age of onset, symptom pattern, and ruling out other causes (food allergy, parasites, infections). Intradermal skin testing or serum IgE testing identifies specific allergens for immunotherapy.",
  "management": "There is no cure. Management combines allergen avoidance, medication to control itch and inflammation, treatment of secondary infections, skin barrier support, and allergen-specific immunotherapy (allergy shots) for long-term control.",
  "when_to_see_vet": "If your dog is scratching more than usual, has recurrent ear infections, or is constantly licking their paws. Early intervention prevents secondary complications."
}',
'{
  "pathophysiology": "Defective epidermal barrier (filaggrin-like deficiency) allows transcutaneous allergen penetration. Th2-skewed immune response produces allergen-specific IgE, which binds mast cells and basophils. Re-exposure triggers degranulation, releasing histamine, leukotrienes, and prostaglandins. Chronic inflammation leads to epidermal hyperplasia and lichenification.",
  "differential_diagnosis": ["Food allergy (requires elimination diet trial)", "Sarcoptic mange (skin scraping, trial treatment)", "Malassezia dermatitis (cytology)", "Contact dermatitis (distribution pattern)", "Bacterial pyoderma (may coexist)"],
  "diagnostic_criteria": "Favrot criteria (2010): sensitivity 85%, specificity 79% when 5/8 criteria met. Includes: onset before age 3, mostly indoor, corticosteroid-responsive pruritus, chronic/recurrent yeast infections, affected front feet, affected ear pinnae, non-affected ear margins, non-affected dorsolumbar area.",
  "treatment_algorithm": "Step 1: Treat secondary infections (cytology-guided). Step 2: Allergen avoidance where possible. Step 3: Symptomatic therapy (oclacitinib, lokivetmab, or cyclosporine). Step 4: Allergen-specific immunotherapy for long-term control. Step 5: Ongoing multimodal management.",
  "evidence_notes": "ICADA guidelines (2015) recommend multimodal approach. Immunotherapy success rate 60-75% with proper allergen selection. JAK inhibitors (oclacitinib) show rapid onset but require ongoing use."
}',
ARRAY['Boxer', 'Pit Bull', 'Bulldog', 'Golden Retriever', 'Labrador Retriever', 'German Shepherd', 'West Highland White Terrier', 'Shar-Pei', 'Dalmatian', 'Irish Setter'],
'variable',
false,
ARRAY['atopy', 'allergy', 'itch', 'pruritus', 'environmental allergy', 'dust mites', 'immunotherapy', 'chronic'],
'[{"title": "ICADA Guidelines for CAD", "authors": "Olivry et al.", "journal": "BMC Veterinary Research", "year": 2015, "evidence_grade": "high"}]'),

((SELECT id FROM categories WHERE slug = 'allergies-atopy'),
'Dust Mite Hypersensitivity',
'dust-mite-hypersensitivity',
'Dust mite allergy is the most common year-round environmental allergy in dogs. Unlike seasonal pollen allergies, dust mite-allergic dogs suffer symptoms year-round because dust mites live in bedding, carpeting, upholstered furniture, and stored dry dog food. Symptoms are identical to atopic dermatitis but driven specifically by Dermatophagoides farinae and D. pteronyssinus.',
'{
  "what_it_is": "An immune overreaction specifically to proteins found in dust mite bodies and feces. Dust mites are microscopic organisms that thrive in warm, humid environments and feed on shed skin cells.",
  "common_symptoms": ["Year-round itching (no seasonal variation)", "Paw licking and interdigital inflammation", "Ear infections", "Facial rubbing", "Belly redness"],
  "where_mites_live": ["Dog beds and blankets", "Carpeting and rugs", "Upholstered furniture", "Stored dry dog food (major overlooked source)", "Stuffed toys"],
  "environmental_control": ["Wash bedding weekly in hot water (130F+)", "Use dust mite-proof covers on dog beds", "Freeze kibble before feeding (kills mites in stored food)", "HEPA air purifiers in rooms where dog sleeps", "Remove carpeting where possible", "Reduce indoor humidity below 50%", "Regular vacuuming with HEPA filter vacuum"],
  "treatment": "Same as canine atopic dermatitis: allergy medications for itch control, treating secondary infections, environmental mite reduction, and allergen-specific immunotherapy (the only treatment that addresses the root cause).",
  "when_to_see_vet": "If your dog has year-round skin problems that never fully resolve, dust mites should be high on the suspect list. IgE testing can confirm."
}',
'{
  "pathophysiology": "D. farinae group 1 and group 2 allergens (Der f 1, Der f 2) are the primary sensitizing proteins. Der f 1 is a cysteine protease that disrupts tight junctions in the epidermis, facilitating allergen penetration. IgE-mediated type I hypersensitivity with late-phase Th2 inflammatory response.",
  "diagnostic_confirmation": "Serum allergen-specific IgE testing (IDEXX, Heska) or intradermal testing. Note: IgE testing identifies sensitization, which must correlate with clinical signs. Some dogs test positive without clinical relevance.",
  "dust_mite_immunotherapy": "Allergen-specific immunotherapy (ASIT) using D. farinae and/or D. pteronyssinus extracts. Subcutaneous injection protocol over 12+ months. Success rate approximately 60-75%. Can be combined with sublingual immunotherapy (SLIT) in refractory cases.",
  "kibble_contamination": "Studies demonstrate significant dust mite colonization of stored dry dog food within weeks of opening. Mite counts increase with storage duration and humidity. Freezing kibble for 24-48 hours before feeding kills mites and reduces allergen load - a zero-cost intervention.",
  "evidence_notes": "Dust mites are the most frequently identified allergen on canine IgE panels. Environmental control alone is insufficient but significantly reduces allergen burden when combined with pharmacotherapy and immunotherapy."
}',
ARRAY['Boxer', 'Pit Bull', 'Bulldog', 'West Highland White Terrier', 'Labrador Retriever'],
'variable',
false,
ARRAY['dust mites', 'year-round allergy', 'environmental allergy', 'immunotherapy', 'kibble freezing', 'dermatophagoides'],
'[{"title": "Storage mite contamination of commercial dry dog food", "journal": "Veterinary Dermatology", "year": 2008, "evidence_grade": "moderate"}]');

-- Interdigital Furunculosis
INSERT INTO conditions (category_id, name, slug, summary_owner, detail_owner, detail_vet, breeds_affected, severity_range, is_contagious, tags, sources) VALUES

((SELECT id FROM categories WHERE slug = 'interdigital-furunculosis'),
'Interdigital Furunculosis',
'interdigital-furunculosis',
'Interdigital furunculosis is a deep skin infection between the toes that causes painful, swollen, red nodules that may rupture and drain bloody or purulent fluid. It is not a primary disease but a reaction pattern - meaning something else is driving it. The most common underlying causes are allergies (especially atopic dermatitis), conformational issues in short-haired breeds, foreign bodies, and demodicosis.',
'{
  "what_it_is": "Deep bacterial infection of the hair follicles and surrounding tissue between the toes. The bumps (often called interdigital cysts) are actually ruptured, infected hair follicles - not true cysts. The embedded hair fragments act as foreign bodies, perpetuating the inflammatory cycle.",
  "common_symptoms": ["Painful, red, swollen bumps between toes", "Limping or reluctance to walk", "Licking and chewing at paws", "Draining blood or pus from lesions", "Recurrent episodes despite treatment", "Multiple paws affected (suggests systemic cause like allergies)"],
  "why_it_recurs": "If only the infection is treated without addressing the underlying cause (allergies, conformational issues, etc.), it will keep coming back. The short, coarse hairs of bully breeds are especially prone to breaking off and embedding in the skin, creating a foreign body reaction.",
  "treatment": "Treating the current infection (antibiotics guided by culture, topical therapy, paw soaks) AND identifying and managing the underlying cause. For allergy-driven cases, long-term allergy management is essential to prevent recurrence.",
  "home_care": ["Chlorhexidine paw soaks (2-4% solution, 10 min daily)", "Keep paws clean and dry", "Epsom salt soaks for active draining lesions", "Monitor for new lesions and track patterns"],
  "when_to_see_vet": "Any new bump between the toes, especially if painful or draining. Culture and sensitivity testing is important because resistant bacteria (including MRSA) are common in chronic cases."
}',
'{
  "pathophysiology": "Foreign body folliculitis and furunculosis. Short bristle hairs fracture at the skin surface and are driven into the dermis by mechanical pressure during ambulation. This triggers granulomatous inflammation. Secondary bacterial infection (commonly Staphylococcus pseudintermedius, occasionally MRSA or Streptococcus) establishes in the disrupted tissue. In allergic dogs, pruritus-driven licking macertes the skin and drives hair fragments deeper.",
  "differential_diagnosis": ["Demodicosis (skin scraping, trichogram)", "Dermatophytosis (fungal culture, Wood lamp)", "Foreign body (grass awn, foxtail)", "Neoplasia (histopathology for persistent single-paw lesions)", "Sterile pyogranuloma/granuloma syndrome", "Hookworm dermatitis (geographic risk)"],
  "diagnostic_workup": "Cytology of exudate (bacteria, demodex, acantholytic cells), bacterial culture and sensitivity (critical for chronic/recurrent cases), skin biopsy if refractory (rules out neoplasia, confirms foreign body granuloma), allergy workup if multiple paws affected.",
  "treatment_of_choice": "Cyclosporine (Atopica) is specifically cited in veterinary dermatology literature as the treatment of choice for interdigital furunculosis, especially in cases with an allergic or immune-mediated component. It addresses both the inflammatory and immunologic drivers.",
  "antibiotic_considerations": "Culture-guided antibiotic therapy for minimum 6-8 weeks (deep pyoderma protocol). Fluoroquinolones historically used but resistance increasing. Clindamycin penetrates well into abscessed tissue. Duration should extend 2 weeks beyond clinical resolution. Avoid empiric therapy in chronic cases - culture first.",
  "evidence_notes": "Mueller (2008) demonstrated cyclosporine efficacy for pedal furunculosis. MRSA prevalence in chronic interdigital lesions is significant and increasing."
}',
ARRAY['Boxer', 'Pit Bull', 'English Bulldog', 'French Bulldog', 'Bull Terrier', 'Great Dane', 'Labrador Retriever', 'German Shepherd'],
'severe',
false,
ARRAY['interdigital cysts', 'paw infection', 'furunculosis', 'deep pyoderma', 'MRSA', 'cyclosporine', 'pododermatitis'],
'[{"title": "Treatment of interdigital furunculosis with cyclosporine", "authors": "Mueller RS", "journal": "Veterinary Dermatology", "year": 2008, "evidence_grade": "moderate"}]');

-- ============================================
-- MEDICATIONS
-- ============================================

INSERT INTO medications (name, brand_names, slug, drug_class, summary_owner, detail_vet, side_effects, contraindications, cost_tier, sources) VALUES

('Oclacitinib', ARRAY['Apoquel'], 'oclacitinib-apoquel', 'JAK inhibitor',
'Apoquel is one of the most commonly prescribed allergy medications for dogs. It works by blocking specific enzymes (JAK1 and JAK3) involved in the itch and inflammation cycle. It provides fast relief - often within 4 hours - and is effective for both seasonal and year-round allergies. However, it does not treat the underlying allergy and must be given continuously to maintain effect. Some dogs experience reduced effectiveness over time.',
'{
  "mechanism": "Selective inhibitor of Janus kinase 1 (JAK1) and JAK3. JAK1 mediates IL-31 signaling (primary itch cytokine in dogs). JAK3 involved in lymphocyte development. Partial inhibition of JAK2 (erythropoiesis, platelet formation) at therapeutic doses.",
  "pharmacokinetics": "Rapid oral absorption. Tmax ~1 hour. Half-life ~4 hours. Requires twice-daily dosing for first 14 days, then once daily for maintenance. Food does not significantly affect absorption.",
  "dosing": "0.4-0.6 mg/kg PO q12h for 14 days, then 0.4-0.6 mg/kg PO q24h. Available in 3.6mg, 5.4mg, and 16mg tablets.",
  "monitoring": "CBC recommended at baseline, 30 days, then every 6-12 months. Watch for lymphopenia, anemia.",
  "efficacy_data": "COSCAD study: 67% reduction in pruritus at day 7. Response rate approximately 70-80% in clinical trials. Some dogs develop tachyphylaxis (reduced response over months to years).",
  "drug_interactions": "Avoid concurrent use with other immunosuppressants (cyclosporine, corticosteroids long-term). Caution with vaccines during initial loading period."
}',
'{"common": ["Vomiting", "Diarrhea", "Decreased appetite", "Lethargy"], "uncommon": ["Increased susceptibility to infections", "Papillomas (warts)", "Urinary tract infections"], "serious": ["Bone marrow suppression (rare)", "Lymphoma development (theoretical concern with JAK inhibition)", "Demodicosis flare"]}',
'{"concurrent_immunosuppressants": "Avoid combining with cyclosporine or long-term corticosteroids", "age_restriction": "Not for dogs under 12 months", "breeding": "Not recommended for breeding, pregnant, or lactating dogs", "infections": "Use with caution in dogs with active serious infections"}',
'high',
'[{"title": "Oclacitinib (Apoquel) prescribing information", "authors": "Zoetis", "year": 2024, "evidence_grade": "high"}]'),

('Cyclosporine', ARRAY['Atopica', 'Cyclavance'], 'cyclosporine-atopica', 'Calcineurin inhibitor',
'Atopica (cyclosporine) is an immunosuppressive medication that calms the overactive immune response in allergic dogs. It takes longer to work than Apoquel (2-4 weeks for full effect) but is specifically recommended by veterinary dermatologists as the treatment of choice for interdigital furunculosis (paw cysts). It works by blocking T-cell activation, reducing the immune cascade that drives chronic skin inflammation.',
'{
  "mechanism": "Binds cyclophilin, forming a complex that inhibits calcineurin phosphatase. This blocks NFAT-mediated transcription of IL-2 and other pro-inflammatory cytokines. Net effect: suppression of T-cell activation and proliferation, reduced Th2 cytokine production, decreased mast cell activation.",
  "pharmacokinetics": "Modified cyclosporine (microemulsion formulation) - improved bioavailability over standard formulation. Tmax 1-2 hours. Half-life ~9.5 hours. Metabolized by CYP3A4 (hepatic). Give on empty stomach (2 hours before or after food) for consistent absorption.",
  "dosing": "5 mg/kg PO q24h initially. After 4-8 weeks, may attempt dose reduction to every other day if clinical response maintained. Some dogs require continued daily dosing.",
  "monitoring": "Monitor for GI side effects initially. Consider hepatic function testing if long-term use. Monitor for gingival hyperplasia.",
  "interdigital_furunculosis": "Specifically cited in veterinary dermatology literature as treatment of choice for pedal furunculosis. Addresses both the immune-mediated inflammatory component and reduces the T-cell driven granulomatous response to embedded hair fragments.",
  "drug_interactions": "Ketoconazole increases cyclosporine levels (can be used intentionally to reduce dose/cost - ketoconazole 5-10mg/kg + cyclosporine 2.5mg/kg). Avoid concurrent nephrotoxic drugs."
}',
'{"common": ["Vomiting (most common, usually transient)", "Diarrhea", "Decreased appetite (first 1-2 weeks)"], "uncommon": ["Gingival hyperplasia", "Papillomatosis", "Hirsutism (excess hair growth)"], "serious": ["Immunosuppression-related infections (rare at standard doses)", "Hepatotoxicity (rare)"]}',
'{"renal_disease": "Use with caution in dogs with renal impairment", "concurrent_nephrotoxins": "Avoid combining with NSAIDs or aminoglycosides", "vaccines": "Modified live vaccines should not be given during treatment", "breeding": "Not recommended for breeding dogs"}',
'high',
'[{"title": "Cyclosporine for canine atopic dermatitis", "authors": "Steffan J et al.", "journal": "Veterinary Dermatology", "year": 2006, "evidence_grade": "high"}]'),

('Lokivetmab', ARRAY['Cytopoint'], 'lokivetmab-cytopoint', 'Monoclonal antibody',
'Cytopoint is an injectable medication (given by your vet) that targets and neutralizes IL-31, the specific protein that triggers itch in dogs. A single injection typically provides 4-8 weeks of itch relief. Because it is a targeted antibody and not a drug that affects the whole immune system, it has very few side effects and is safe to use with most other medications.',
'{
  "mechanism": "Caninized monoclonal antibody that specifically binds and neutralizes interleukin-31 (IL-31). IL-31 is the primary pruritogenic cytokine in canine atopic dermatitis - it activates itch neurons via the IL-31 receptor on sensory neurons. By neutralizing IL-31, lokivetmab breaks the itch cycle without broad immunosuppression.",
  "pharmacokinetics": "Subcutaneous injection. Onset within 1-3 days. Duration of action 4-8 weeks (average ~5 weeks). Eliminated via normal protein catabolism, not hepatic/renal metabolism.",
  "dosing": "1-2 mg/kg SC every 4-8 weeks. Administered by veterinarian. Minimum 1 mg/kg required for efficacy.",
  "efficacy_data": "Clinical trials show approximately 75% of dogs achieve meaningful itch reduction. Most effective for pruritus control; less effective for secondary infections and skin lesions which require separate treatment.",
  "limitations": "Only addresses itch (IL-31 pathway). Does not treat secondary infections, does not reduce skin inflammation through other pathways, and does not address the underlying allergy. Best used as part of multimodal therapy."
}',
'{"common": ["Injection site reactions (mild, transient)"], "uncommon": ["Vomiting within 24 hours of injection", "Lethargy for 1-2 days"], "serious": ["Anaphylaxis (extremely rare)"]}',
'{"antibody_interference": "May interfere with IL-31-dependent immune functions, though clinical significance appears minimal", "infection_control": "Does not replace antibiotics for secondary infections"}',
'premium',
'[{"title": "Lokivetmab (Cytopoint) prescribing information", "authors": "Zoetis", "year": 2024, "evidence_grade": "high"}]'),

('Cephalexin', ARRAY['Keflex', 'Rilexine'], 'cephalexin', 'First-generation cephalosporin',
'Cephalexin is a commonly prescribed antibiotic for skin infections in dogs. It belongs to the cephalosporin family and is effective against many of the bacteria that cause skin infections (pyoderma). It is generally well-tolerated and comes in capsule and tablet forms. However, some bacteria - particularly MRSA (methicillin-resistant Staphylococcus aureus) - are resistant to cephalexin.',
'{
  "mechanism": "Beta-lactam antibiotic. Inhibits bacterial cell wall synthesis by binding penicillin-binding proteins (PBPs). Bactericidal - kills bacteria rather than just stopping growth. Effective against gram-positive cocci including Staphylococcus pseudintermedius (the most common canine skin pathogen).",
  "pharmacokinetics": "Well absorbed orally. Tmax ~1 hour. Half-life ~2 hours (requires q8-12h dosing). Renal excretion. Good skin penetration for superficial pyoderma, limited for deep infections.",
  "dosing": "22-30 mg/kg PO q12h (standard) or 22 mg/kg PO q8h (deep infections). Duration: superficial pyoderma 3-4 weeks, deep pyoderma 6-8 weeks minimum. Continue 1-2 weeks past clinical resolution.",
  "culture_considerations": "First-choice empiric antibiotic for uncomplicated superficial pyoderma. For recurrent, chronic, or deep infections: ALWAYS culture and sensitivity test first. MRSA and MRSP (methicillin-resistant S. pseudintermedius) are resistant. May still cover beta-hemolytic streptococcus even when MRSA is present.",
  "deep_pyoderma_note": "Penetration into abscessed tissue and deep pyoderma is limited compared to clindamycin or fluoroquinolones. For interdigital furunculosis, culture-guided selection is essential."
}',
'{"common": ["Vomiting", "Diarrhea", "Decreased appetite"], "uncommon": ["Allergic reaction (skin rash)", "Panting"], "serious": ["Anaphylaxis (rare, beta-lactam allergy)"]}',
'{"beta_lactam_allergy": "Do not use in dogs with known penicillin or cephalosporin allergy", "MRSA": "Ineffective against methicillin-resistant staphylococci - culture and sensitivity required for chronic cases"}',
'low',
'[{"title": "Antimicrobial use guidelines for treatment of skin infections in dogs", "authors": "Hillier A et al.", "journal": "Veterinary Dermatology", "year": 2014, "evidence_grade": "high"}]'),

('Fexofenadine', ARRAY['Allegra'], 'fexofenadine-allegra', 'Second-generation antihistamine',
'Allegra (fexofenadine) is an over-the-counter antihistamine that can be used as an adjunctive (add-on) treatment for dogs with allergic skin disease. It is less sedating than first-generation antihistamines like diphenhydramine (Benadryl). While antihistamines alone are rarely sufficient to control canine atopic dermatitis, they can provide some additional benefit when combined with other treatments.',
'{
  "mechanism": "Selective H1 receptor antagonist. Blocks histamine from binding to H1 receptors on sensory neurons and smooth muscle. Second-generation - minimal blood-brain barrier penetration, so less sedation than diphenhydramine.",
  "pharmacokinetics": "Oral absorption. Onset 1-3 hours. Duration 12-24 hours. Minimal hepatic metabolism. Renal excretion.",
  "dosing": "Canine dose: 2-5 mg/kg PO q12-24h. Common practical dosing: 180mg tablet for dogs over 30 lbs. Start at lower end and titrate.",
  "efficacy_context": "Antihistamines as monotherapy reduce pruritus in only approximately 20-30% of atopic dogs. Most effective as adjunctive therapy combined with other anti-pruritic agents. May be more effective for early or mild cases. Pre-treatment before allergen exposure may improve efficacy.",
  "OTC_advantage": "Available without prescription. Low cost. Minimal side effects. Can be a useful bridge therapy or add-on while waiting for immunotherapy to take effect."
}',
'{"common": ["Mild sedation (less than first-gen antihistamines)"], "uncommon": ["GI upset", "Dry mouth"], "serious": []}',
'{"drug_interactions": "Avoid concurrent use with ketoconazole or erythromycin (may increase fexofenadine levels)", "renal": "Dose reduction may be needed in dogs with renal impairment"}',
'low',
'[{"title": "Antihistamines in canine atopic dermatitis", "authors": "DeBoer DJ, Griffin CE", "journal": "Compendium on Continuing Education", "year": 2001, "evidence_grade": "moderate"}]');

-- ============================================
-- CONDITION-MEDICATION LINKS
-- ============================================

-- CAD treatments
INSERT INTO condition_medications (condition_id, medication_id, is_first_line, notes)
SELECT c.id, m.id, true, 'Rapid itch control, first-line for most cases'
FROM conditions c, medications m
WHERE c.slug = 'canine-atopic-dermatitis' AND m.slug = 'oclacitinib-apoquel';

INSERT INTO condition_medications (condition_id, medication_id, is_first_line, notes)
SELECT c.id, m.id, true, 'Injection-based itch control, excellent safety profile'
FROM conditions c, medications m
WHERE c.slug = 'canine-atopic-dermatitis' AND m.slug = 'lokivetmab-cytopoint';

INSERT INTO condition_medications (condition_id, medication_id, is_first_line, notes)
SELECT c.id, m.id, false, 'Second-line for atopic dermatitis, first-line for interdigital furunculosis component'
FROM conditions c, medications m
WHERE c.slug = 'canine-atopic-dermatitis' AND m.slug = 'cyclosporine-atopica';

INSERT INTO condition_medications (condition_id, medication_id, is_first_line, notes)
SELECT c.id, m.id, false, 'Adjunctive only - insufficient as monotherapy for most CAD cases'
FROM conditions c, medications m
WHERE c.slug = 'canine-atopic-dermatitis' AND m.slug = 'fexofenadine-allegra';

-- Dust Mite Hypersensitivity treatments
INSERT INTO condition_medications (condition_id, medication_id, is_first_line, notes)
SELECT c.id, m.id, true, 'Rapid itch control while environmental measures and immunotherapy take effect'
FROM conditions c, medications m
WHERE c.slug = 'dust-mite-hypersensitivity' AND m.slug = 'oclacitinib-apoquel';

INSERT INTO condition_medications (condition_id, medication_id, is_first_line, notes)
SELECT c.id, m.id, true, 'Injection-based itch control'
FROM conditions c, medications m
WHERE c.slug = 'dust-mite-hypersensitivity' AND m.slug = 'lokivetmab-cytopoint';

-- Interdigital Furunculosis treatments
INSERT INTO condition_medications (condition_id, medication_id, is_first_line, notes)
SELECT c.id, m.id, true, 'Treatment of choice for interdigital furunculosis per veterinary dermatology literature'
FROM conditions c, medications m
WHERE c.slug = 'interdigital-furunculosis' AND m.slug = 'cyclosporine-atopica';

INSERT INTO condition_medications (condition_id, medication_id, is_first_line, notes)
SELECT c.id, m.id, true, 'First-line empiric antibiotic for secondary infection component. Culture and sensitivity required for chronic cases.'
FROM conditions c, medications m
WHERE c.slug = 'interdigital-furunculosis' AND m.slug = 'cephalexin';
