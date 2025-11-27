-- Industry Taxonomy Seed Data
-- Phase 1, Week 1, Day 2
-- Based on EXECUTIVE-ROADMAP-BCG.md Section 2.4.5
-- Seeds the industries table with 20 core industry categories

-- ================================================================
-- CLEAR EXISTING DATA (for idempotency)
-- ================================================================
DELETE FROM industries WHERE true;

-- ================================================================
-- INSERT INDUSTRY TAXONOMY
-- ================================================================

INSERT INTO industries (slug, name, description, keywords, regulatory_context, is_active, display_order) VALUES

-- Technology
('saas', 'SaaS & Cloud Software', 'Software as a Service and cloud-based applications',
  ARRAY['software', 'cloud', 'saas', 'platform', 'api', 'subscription', 'b2b', 'enterprise software'],
  ARRAY['GDPR', 'SOC 2', 'CCPA', 'data protection'],
  true, 1),

('fintech', 'Fintech & Financial Services', 'Financial technology and digital banking',
  ARRAY['finance', 'banking', 'payments', 'fintech', 'crypto', 'blockchain', 'trading', 'investment'],
  ARRAY['PCI-DSS', 'SOX', 'AML', 'KYC', 'FINRA', 'SEC'],
  true, 2),

('healthtech', 'Healthcare & Healthtech', 'Healthcare technology and medical services',
  ARRAY['health', 'medical', 'healthcare', 'telemedicine', 'pharma', 'wellness', 'fitness', 'mental health'],
  ARRAY['HIPAA', 'FDA', 'PHI', 'HITECH'],
  true, 3),

('ecommerce', 'E-commerce & Retail', 'Online retail and e-commerce platforms',
  ARRAY['ecommerce', 'retail', 'shopping', 'store', 'marketplace', 'commerce', 'shop', 'buy'],
  ARRAY['PCI-DSS', 'consumer protection', 'CCPA'],
  true, 4),

('edtech', 'Education & Edtech', 'Educational technology and learning platforms',
  ARRAY['education', 'learning', 'courses', 'training', 'edtech', 'school', 'university', 'e-learning'],
  ARRAY['FERPA', 'COPPA', 'accessibility'],
  true, 5),

('media', 'Media & Entertainment', 'Media, entertainment, and content creation',
  ARRAY['media', 'entertainment', 'content', 'streaming', 'news', 'publishing', 'video', 'podcast'],
  ARRAY['copyright', 'DMCA', 'content moderation'],
  true, 6),

('marketing', 'Marketing & Advertising', 'Marketing technology and advertising services',
  ARRAY['marketing', 'advertising', 'agency', 'seo', 'social media', 'branding', 'pr', 'content marketing'],
  ARRAY['FTC', 'CAN-SPAM', 'GDPR', 'CCPA'],
  true, 7),

('professional-services', 'Professional Services', 'Consulting, legal, and professional services',
  ARRAY['consulting', 'legal', 'accounting', 'advisory', 'professional', 'law firm', 'cpa'],
  ARRAY['professional licensing', 'bar association', 'accounting standards'],
  true, 8),

('real-estate', 'Real Estate & Property', 'Real estate and property technology',
  ARRAY['real estate', 'property', 'proptech', 'housing', 'mortgage', 'rental', 'commercial real estate'],
  ARRAY['fair housing', 'RESPA', 'real estate licensing'],
  true, 9),

('travel', 'Travel & Hospitality', 'Travel, hospitality, and tourism',
  ARRAY['travel', 'hotel', 'hospitality', 'tourism', 'booking', 'vacation', 'airline', 'restaurant'],
  ARRAY['DOT', 'food safety', 'accessibility'],
  true, 10),

-- Industrial & Traditional
('manufacturing', 'Manufacturing & Industrial', 'Manufacturing and industrial technology',
  ARRAY['manufacturing', 'industrial', 'supply chain', 'logistics', 'factory', 'b2b', 'industrial'],
  ARRAY['OSHA', 'EPA', 'ISO standards'],
  true, 11),

('automotive', 'Automotive & Mobility', 'Automotive and mobility technology',
  ARRAY['automotive', 'car', 'vehicle', 'ev', 'electric vehicle', 'mobility', 'transportation'],
  ARRAY['NHTSA', 'EPA emissions', 'autonomous vehicle regulations'],
  true, 12),

('energy', 'Energy & Cleantech', 'Energy, utilities, and clean technology',
  ARRAY['energy', 'solar', 'renewable', 'cleantech', 'sustainability', 'utilities', 'oil', 'gas'],
  ARRAY['EPA', 'FERC', 'DOE', 'emissions regulations'],
  true, 13),

('food-beverage', 'Food & Beverage', 'Food, beverage, and consumer packaged goods',
  ARRAY['food', 'beverage', 'restaurant', 'cpg', 'grocery', 'drink', 'snack', 'organic'],
  ARRAY['FDA', 'USDA', 'food safety', 'labeling requirements'],
  true, 14),

-- Nonprofit & Government
('nonprofit', 'Nonprofit & NGO', 'Nonprofit organizations and NGOs',
  ARRAY['nonprofit', 'charity', 'ngo', 'foundation', 'social impact', 'donate', 'volunteer'],
  ARRAY['501(c)(3)', 'donor privacy', 'charitable solicitation'],
  true, 15),

('government', 'Government & Public Sector', 'Government and public sector organizations',
  ARRAY['government', 'public', 'municipal', 'federal', 'state', 'civic', 'public sector'],
  ARRAY['FedRAMP', 'FISMA', 'accessibility requirements', 'procurement'],
  true, 16),

-- Communications & Infrastructure
('telecom', 'Telecommunications', 'Telecommunications and connectivity',
  ARRAY['telecom', 'telecommunications', '5g', 'mobile', 'wireless', 'internet', 'isp', 'carrier'],
  ARRAY['FCC', 'net neutrality', 'spectrum licensing'],
  true, 17),

('agriculture', 'Agriculture & AgTech', 'Agriculture and agricultural technology',
  ARRAY['agriculture', 'farming', 'agtech', 'crop', 'livestock', 'farm', 'agricultural'],
  ARRAY['USDA', 'EPA pesticides', 'organic certification'],
  true, 18),

-- Consumer
('beauty', 'Beauty & Personal Care', 'Beauty, cosmetics, and personal care',
  ARRAY['beauty', 'cosmetics', 'skincare', 'makeup', 'personal care', 'haircare', 'fragrance'],
  ARRAY['FDA cosmetics', 'EU cosmetics regulation', 'cruelty-free certification'],
  true, 19),

('sports', 'Sports & Fitness', 'Sports, fitness, and athletic brands',
  ARRAY['sports', 'fitness', 'athletic', 'gym', 'workout', 'training', 'equipment', 'apparel'],
  ARRAY['sports licensing', 'athletic endorsement', 'safety standards'],
  true, 20);

-- ================================================================
-- CREATE HIERARCHICAL RELATIONSHIPS (Sub-industries)
-- ================================================================

-- SaaS Sub-industries
INSERT INTO industries (slug, name, description, keywords, parent_id, is_active, display_order)
SELECT
  subindustry.slug,
  subindustry.name,
  subindustry.description,
  subindustry.keywords,
  (SELECT id FROM industries WHERE slug = 'saas'),
  true,
  subindustry.display_order
FROM (VALUES
  ('crm', 'CRM & Sales Tools', 'Customer relationship management and sales software', ARRAY['crm', 'sales', 'salesforce', 'hubspot', 'pipedrive'], 101),
  ('hr-tech', 'HR Technology', 'Human resources and people management software', ARRAY['hr', 'payroll', 'recruiting', 'hris', 'workforce'], 102),
  ('devtools', 'Developer Tools', 'Software development and DevOps tools', ARRAY['developer', 'devops', 'ide', 'cicd', 'testing'], 103),
  ('analytics', 'Analytics & BI', 'Business intelligence and analytics platforms', ARRAY['analytics', 'bi', 'data', 'dashboards', 'reporting'], 104),
  ('cybersecurity', 'Cybersecurity', 'Security software and services', ARRAY['security', 'cyber', 'infosec', 'antivirus', 'siem'], 105)
) AS subindustry(slug, name, description, keywords, display_order);

-- Fintech Sub-industries
INSERT INTO industries (slug, name, description, keywords, parent_id, is_active, display_order)
SELECT
  subindustry.slug,
  subindustry.name,
  subindustry.description,
  subindustry.keywords,
  (SELECT id FROM industries WHERE slug = 'fintech'),
  true,
  subindustry.display_order
FROM (VALUES
  ('payments', 'Payments & Processing', 'Payment processing and merchant services', ARRAY['payments', 'payment gateway', 'merchant', 'processing'], 201),
  ('neobank', 'Digital Banking', 'Digital-first banking and neobanks', ARRAY['neobank', 'digital bank', 'mobile banking', 'challenger bank'], 202),
  ('lending', 'Lending & Credit', 'Lending platforms and credit services', ARRAY['lending', 'loans', 'credit', 'mortgage', 'bnpl'], 203),
  ('insurtech', 'Insurance Technology', 'Insurance technology and digital insurance', ARRAY['insurance', 'insurtech', 'claims', 'underwriting'], 204),
  ('crypto-defi', 'Crypto & DeFi', 'Cryptocurrency and decentralized finance', ARRAY['crypto', 'defi', 'blockchain', 'web3', 'nft'], 205)
) AS subindustry(slug, name, description, keywords, display_order);

-- E-commerce Sub-industries
INSERT INTO industries (slug, name, description, keywords, parent_id, is_active, display_order)
SELECT
  subindustry.slug,
  subindustry.name,
  subindustry.description,
  subindustry.keywords,
  (SELECT id FROM industries WHERE slug = 'ecommerce'),
  true,
  subindustry.display_order
FROM (VALUES
  ('marketplace', 'Marketplaces', 'Multi-vendor marketplace platforms', ARRAY['marketplace', 'multi-vendor', 'sellers', 'platform'], 401),
  ('dtc', 'Direct-to-Consumer', 'D2C brands and retailers', ARRAY['dtc', 'd2c', 'direct to consumer', 'brand'], 402),
  ('b2b-commerce', 'B2B Commerce', 'Business-to-business e-commerce', ARRAY['b2b', 'wholesale', 'trade', 'business commerce'], 403)
) AS subindustry(slug, name, description, keywords, display_order);

-- ================================================================
-- VERIFY SEED
-- ================================================================
-- SELECT COUNT(*) as total_industries,
--        COUNT(CASE WHEN parent_id IS NULL THEN 1 END) as parent_industries,
--        COUNT(CASE WHEN parent_id IS NOT NULL THEN 1 END) as sub_industries
-- FROM industries;
