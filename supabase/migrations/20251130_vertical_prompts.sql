-- ================================================================
-- VERTICAL PROMPTS TABLE - Industry-Specific AI Prompts
-- Version: 1.0
-- Date: 2025-11-30
-- Phase 1, Week 1, Day 5
-- Based on EXECUTIVE-ROADMAP-BCG.md Domain Tasks
-- ================================================================

-- ================================================================
-- TABLE: vertical_prompts
-- Stores industry-specific prompt templates for AI perception analysis
-- ================================================================
CREATE TABLE IF NOT EXISTS vertical_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Industry reference
  industry_id UUID NOT NULL REFERENCES industries(id) ON DELETE CASCADE,
  industry_slug TEXT NOT NULL, -- Denormalized for quick lookups

  -- Prompt content
  system_context TEXT NOT NULL,
  key_terms TEXT[] NOT NULL DEFAULT '{}',

  -- Evaluation criteria (weights must sum to 1.0)
  evaluation_criteria JSONB NOT NULL DEFAULT '{}',
  -- Example: {"features": 0.30, "reliability": 0.25, "support": 0.20, "pricing": 0.15, "integration": 0.10}

  -- Regulatory context
  regulatory_context TEXT[] NOT NULL DEFAULT '{}',
  -- Example: ['HIPAA', 'FDA', 'PHI protection']

  -- Example queries for this vertical
  example_queries TEXT[] NOT NULL DEFAULT '{}',

  -- Few-shot examples for in-context learning
  few_shot_examples JSONB NOT NULL DEFAULT '[]',
  -- Example: [{"query": "...", "context": "...", "response": "..."}]

  -- Metadata
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chk_evaluation_weights CHECK (
    (SELECT COALESCE(SUM(value::numeric), 0)
     FROM jsonb_each_text(evaluation_criteria)) BETWEEN 0.99 AND 1.01
  ),
  CONSTRAINT chk_key_terms_not_empty CHECK (array_length(key_terms, 1) >= 5),
  CONSTRAINT chk_system_context_length CHECK (length(system_context) >= 100),

  -- Unique per industry (only one active prompt per industry)
  UNIQUE(industry_slug, is_active) -- Allows multiple inactive versions
);

-- ================================================================
-- INDEXES
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_vertical_prompts_industry ON vertical_prompts(industry_id);
CREATE INDEX IF NOT EXISTS idx_vertical_prompts_slug ON vertical_prompts(industry_slug);
CREATE INDEX IF NOT EXISTS idx_vertical_prompts_active ON vertical_prompts(is_active) WHERE is_active = true;

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================
ALTER TABLE vertical_prompts ENABLE ROW LEVEL SECURITY;

-- Public read access for active prompts
CREATE POLICY "Public read active prompts" ON vertical_prompts
  FOR SELECT USING (is_active = true);

-- Service role full access
CREATE POLICY "Service role full access" ON vertical_prompts
  FOR ALL USING (auth.role() = 'service_role');

-- ================================================================
-- TRIGGER: Auto-update updated_at
-- ================================================================
CREATE TRIGGER update_vertical_prompts_updated_at
  BEFORE UPDATE ON vertical_prompts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- TABLE: vertical_prompt_versions
-- Audit trail for prompt changes
-- ================================================================
CREATE TABLE IF NOT EXISTS vertical_prompt_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vertical_prompt_id UUID NOT NULL REFERENCES vertical_prompts(id) ON DELETE CASCADE,

  -- Version info
  version INTEGER NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('create', 'update', 'deactivate', 'reactivate')),
  change_reason TEXT,

  -- Snapshot of prompt at this version
  system_context TEXT NOT NULL,
  key_terms TEXT[] NOT NULL,
  evaluation_criteria JSONB NOT NULL,
  regulatory_context TEXT[] NOT NULL,
  few_shot_examples JSONB NOT NULL,

  -- Metadata
  changed_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for version lookups
CREATE INDEX IF NOT EXISTS idx_vertical_prompt_versions_prompt ON vertical_prompt_versions(vertical_prompt_id);
CREATE INDEX IF NOT EXISTS idx_vertical_prompt_versions_version ON vertical_prompt_versions(vertical_prompt_id, version DESC);

-- RLS for versions
ALTER TABLE vertical_prompt_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON vertical_prompt_versions
  FOR ALL USING (auth.role() = 'service_role');

-- ================================================================
-- TABLE: vertical_prompt_performance
-- Track prompt effectiveness per industry
-- ================================================================
CREATE TABLE IF NOT EXISTS vertical_prompt_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vertical_prompt_id UUID NOT NULL REFERENCES vertical_prompts(id) ON DELETE CASCADE,

  -- Time period
  date DATE NOT NULL,

  -- Usage metrics
  total_analyses INTEGER NOT NULL DEFAULT 0,
  total_ai_calls INTEGER NOT NULL DEFAULT 0,

  -- Quality metrics
  avg_confidence_score DECIMAL(4,3), -- 0.000 to 1.000
  avg_user_rating DECIMAL(3,2), -- 1.00 to 5.00

  -- Hallucination tracking
  hallucination_reports INTEGER NOT NULL DEFAULT 0,
  confirmed_hallucinations INTEGER NOT NULL DEFAULT 0,

  -- Feedback metrics
  positive_feedback INTEGER NOT NULL DEFAULT 0,
  negative_feedback INTEGER NOT NULL DEFAULT 0,

  -- Token efficiency
  avg_tokens_per_analysis INTEGER,
  avg_cost_per_analysis DECIMAL(10,6),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique per prompt per day
  UNIQUE(vertical_prompt_id, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vertical_prompt_performance_date ON vertical_prompt_performance(date DESC);
CREATE INDEX IF NOT EXISTS idx_vertical_prompt_performance_prompt ON vertical_prompt_performance(vertical_prompt_id, date DESC);

-- RLS for performance
ALTER TABLE vertical_prompt_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON vertical_prompt_performance
  FOR ALL USING (auth.role() = 'service_role');

-- ================================================================
-- FUNCTION: Get active prompt for industry
-- ================================================================
CREATE OR REPLACE FUNCTION get_vertical_prompt(p_industry_slug TEXT)
RETURNS TABLE(
  id UUID,
  industry_slug TEXT,
  system_context TEXT,
  key_terms TEXT[],
  evaluation_criteria JSONB,
  regulatory_context TEXT[],
  example_queries TEXT[],
  few_shot_examples JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    vp.id,
    vp.industry_slug,
    vp.system_context,
    vp.key_terms,
    vp.evaluation_criteria,
    vp.regulatory_context,
    vp.example_queries,
    vp.few_shot_examples
  FROM vertical_prompts vp
  WHERE vp.industry_slug = LOWER(p_industry_slug)
    AND vp.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- ================================================================
-- FUNCTION: Build complete system prompt with variables
-- ================================================================
CREATE OR REPLACE FUNCTION build_system_prompt(
  p_industry_slug TEXT,
  p_brand TEXT,
  p_country TEXT DEFAULT NULL,
  p_competitors TEXT[] DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  v_prompt TEXT;
  v_context TEXT;
BEGIN
  -- Get base prompt
  SELECT system_context INTO v_context
  FROM vertical_prompts
  WHERE industry_slug = LOWER(p_industry_slug)
    AND is_active = true
  LIMIT 1;

  -- If no industry-specific prompt, use generic
  IF v_context IS NULL THEN
    v_context := format(
      'You are a knowledgeable advisor in the %s industry, helping evaluate %s.',
      p_industry_slug,
      p_brand
    );
  ELSE
    -- Replace {brand} placeholder
    v_context := replace(v_context, '{brand}', p_brand);
  END IF;

  v_prompt := v_context;

  -- Add geographic context if provided
  IF p_country IS NOT NULL THEN
    v_prompt := v_prompt || E'\n\nGeographic context: ' || p_country;
  END IF;

  -- Add competitors if provided
  IF p_competitors IS NOT NULL AND array_length(p_competitors, 1) > 0 THEN
    v_prompt := v_prompt || E'\n\nKey competitors to consider: ' || array_to_string(p_competitors, ', ');
  END IF;

  RETURN v_prompt;
END;
$$ LANGUAGE plpgsql STABLE;

-- ================================================================
-- SEED DATA: 10 Priority Verticals
-- ================================================================

-- Get industry IDs and insert prompts
DO $$
DECLARE
  v_saas_id UUID;
  v_fintech_id UUID;
  v_healthcare_id UUID;
  v_ecommerce_id UUID;
  v_marketing_id UUID;
  v_real_estate_id UUID;
  v_legal_id UUID;
  v_education_id UUID;
  v_hospitality_id UUID;
  v_restaurant_id UUID;
BEGIN
  -- Get industry IDs
  SELECT id INTO v_saas_id FROM industries WHERE slug = 'saas' LIMIT 1;
  SELECT id INTO v_fintech_id FROM industries WHERE slug = 'fintech' LIMIT 1;
  SELECT id INTO v_healthcare_id FROM industries WHERE slug = 'healthcare' OR slug = 'healthtech' LIMIT 1;
  SELECT id INTO v_ecommerce_id FROM industries WHERE slug = 'ecommerce' LIMIT 1;
  SELECT id INTO v_marketing_id FROM industries WHERE slug = 'marketing' LIMIT 1;
  SELECT id INTO v_real_estate_id FROM industries WHERE slug = 'real-estate' LIMIT 1;
  SELECT id INTO v_legal_id FROM industries WHERE slug = 'legal' OR slug = 'professional-services' LIMIT 1;
  SELECT id INTO v_education_id FROM industries WHERE slug = 'education' OR slug = 'edtech' LIMIT 1;
  SELECT id INTO v_hospitality_id FROM industries WHERE slug = 'hospitality' OR slug = 'travel' LIMIT 1;
  SELECT id INTO v_restaurant_id FROM industries WHERE slug = 'restaurant' OR slug = 'food-beverage' LIMIT 1;

  -- SaaS Vertical Prompt
  IF v_saas_id IS NOT NULL THEN
    INSERT INTO vertical_prompts (
      industry_id, industry_slug, system_context, key_terms,
      evaluation_criteria, regulatory_context, example_queries, few_shot_examples
    ) VALUES (
      v_saas_id, 'saas',
      E'You are a SaaS industry expert with deep knowledge of:\n- B2B software evaluation and procurement\n- Cloud infrastructure and scalability\n- API ecosystems and integrations\n- Subscription pricing models (MRR/ARR)\n- Enterprise security requirements\n\nWhen evaluating {brand}, consider:\n1. Core functionality and feature completeness\n2. Integration capabilities with existing tech stack\n3. Scalability and reliability (uptime SLAs)\n4. Customer support quality and responsiveness\n5. Pricing transparency and value proposition\n6. Security certifications (SOC 2, ISO 27001)\n7. User onboarding and documentation quality\n8. Mobile and API access capabilities\n\nFocus on enterprise readiness, total cost of ownership, and long-term viability.',
      ARRAY['MRR', 'ARR', 'churn rate', 'CAC', 'LTV', 'API', 'SOC 2', 'uptime SLA', 'enterprise', 'integration', 'scalability', 'onboarding', 'pricing tier', 'freemium', 'self-service'],
      '{"features": 0.30, "reliability": 0.25, "support": 0.20, "pricing": 0.15, "integration": 0.10}'::jsonb,
      ARRAY['SOC 2', 'GDPR', 'CCPA', 'ISO 27001', 'HIPAA (for healthcare SaaS)'],
      ARRAY['Best CRM software for mid-size companies', 'Top project management tools with Jira integration', 'Most reliable cloud storage for enterprise', 'Affordable email marketing platforms for startups'],
      '[{"query": "What are the best project management tools for remote teams?", "context": "User is evaluating PM software for a 50-person distributed team", "response": "For remote teams of 50 people, I recommend considering these project management platforms based on collaboration features, integrations, and pricing:\n\n**Top Recommendations:**\n\n1. **Asana** - Excellent for workflow automation and timeline views. Strong integration ecosystem with 200+ apps. Pricing starts at $10.99/user/month for Premium.\n\n2. **Monday.com** - Visual project tracking with customizable workflows. Great for teams needing flexibility. Enterprise plan includes advanced permissions.\n\n3. **ClickUp** - Feature-rich with docs, whiteboards, and time tracking built-in. Competitive pricing at $7/user/month.\n\n**Key Considerations:**\n- All three offer SOC 2 compliance\n- Real-time collaboration features\n- Mobile apps for on-the-go access\n- API access for custom integrations\n\nFor a 50-person team, budget approximately $500-600/month for a mid-tier plan with the features you need."}]'::jsonb
    ) ON CONFLICT (industry_slug, is_active) DO NOTHING;
  END IF;

  -- Fintech Vertical Prompt
  IF v_fintech_id IS NOT NULL THEN
    INSERT INTO vertical_prompts (
      industry_id, industry_slug, system_context, key_terms,
      evaluation_criteria, regulatory_context, example_queries, few_shot_examples
    ) VALUES (
      v_fintech_id, 'fintech',
      E'You are a fintech industry expert with deep knowledge of:\n- Digital banking and payment systems\n- Regulatory compliance (PCI-DSS, SOX, AML)\n- Security best practices for financial data\n- Investment and trading platforms\n- Cryptocurrency and blockchain technology\n\nWhen evaluating {brand}, consider:\n1. Regulatory compliance and licensing\n2. Security measures and encryption standards\n3. Transaction fees and pricing transparency\n4. Customer fund protection (FDIC/SIPC)\n5. User experience and mobile capabilities\n6. Integration with existing financial systems\n7. Customer support for financial issues\n8. Track record and company stability\n\nSecurity and trust are paramount. Always verify regulatory status and insurance coverage.',
      ARRAY['PCI-DSS', 'KYC', 'AML', 'FDIC', 'SIPC', 'APY', 'ACH', 'wire transfer', 'cryptocurrency', 'blockchain', 'payment gateway', 'compliance', 'audit', 'encryption', 'two-factor authentication'],
      '{"trust": 0.35, "security": 0.25, "features": 0.20, "pricing": 0.12, "support": 0.08}'::jsonb,
      ARRAY['PCI-DSS', 'SOX', 'AML/KYC', 'FINRA', 'SEC', 'state money transmitter licenses'],
      ARRAY['Best payment processors for e-commerce', 'Most secure cryptocurrency exchanges', 'Top neobanks for small business', 'Affordable international money transfer services'],
      '[{"query": "What payment processor should I use for my online store?", "context": "E-commerce business processing $50K/month in transactions", "response": "For an e-commerce business processing $50K/month, here are my top payment processor recommendations based on fees, features, and reliability:\n\n**Top Recommendations:**\n\n1. **Stripe** - Industry standard for online payments. 2.9% + $0.30 per transaction. Excellent API, supports 135+ currencies. PCI-DSS Level 1 certified.\n\n2. **Square** - Great for omnichannel (online + in-person). 2.9% + $0.30 online. Free online store builder included.\n\n3. **PayPal Commerce** - Brand recognition increases conversion. 2.59% + $0.49 for standard checkout.\n\n**Cost Analysis at $50K/month:**\n- Stripe: ~$1,600/month in fees\n- Square: ~$1,600/month\n- PayPal: ~$1,540/month\n\n**Key Considerations:**\n- All are PCI-DSS compliant\n- Stripe offers the best developer tools\n- PayPal may boost conversion 10-15% due to trust\n- Consider negotiating rates at higher volumes\n\nFor $50K/month, I recommend starting with Stripe for its flexibility and developer experience."}]'::jsonb
    ) ON CONFLICT (industry_slug, is_active) DO NOTHING;
  END IF;

  -- Healthcare Vertical Prompt
  IF v_healthcare_id IS NOT NULL THEN
    INSERT INTO vertical_prompts (
      industry_id, industry_slug, system_context, key_terms,
      evaluation_criteria, regulatory_context, example_queries, few_shot_examples
    ) VALUES (
      v_healthcare_id, 'healthcare',
      E'You are a healthcare industry expert with deep knowledge of:\n- Healthcare provider evaluation and quality metrics\n- Medical compliance and regulatory requirements\n- Telehealth and digital health solutions\n- Healthcare IT and EMR/EHR systems\n- Patient experience and outcomes\n- Mental health and wellness services\n\nWhen evaluating {brand}, consider:\n1. HIPAA compliance and data security\n2. Clinical accreditations (JCI, AAAHC, NCQA)\n3. Board certifications and professional credentials\n4. Patient outcomes and quality metrics\n5. Insurance network participation\n6. Telehealth capabilities and accessibility\n7. Patient reviews and satisfaction scores\n8. Wait times and appointment availability\n\nPatient safety and clinical outcomes are paramount. Trust signals critical for healthcare decisions.',
      ARRAY['HIPAA', 'board certified', 'EMR', 'EHR', 'telehealth', 'patient portal', 'accreditation', 'clinical outcomes', 'insurance network', 'prior authorization', 'copay', 'deductible', 'in-network', 'out-of-network', 'specialist referral'],
      '{"trust": 0.35, "outcomes": 0.30, "compliance": 0.20, "accessibility": 0.15}'::jsonb,
      ARRAY['HIPAA', 'FDA', 'HITECH', 'state medical board licensing', 'DEA registration'],
      ARRAY['Best telehealth platforms for primary care', 'Top-rated orthopedic surgeons in [city]', 'Most reliable patient portal software', 'Affordable mental health apps with licensed therapists'],
      '[{"query": "What telehealth platforms are best for mental health?", "context": "Looking for therapy platform with licensed professionals", "response": "For mental health telehealth services with licensed professionals, here are my top recommendations based on quality of care, accessibility, and pricing:\n\n**Top Recommendations:**\n\n1. **Talkspace** - Largest network of licensed therapists. Offers text, video, and audio sessions. Insurance accepted. $69-109/week for messaging + live sessions.\n\n2. **BetterHelp** - Easy matching with therapists, flexible scheduling. $60-90/week. Not insurance-based but offers financial aid.\n\n3. **Cerebral** - Combines therapy with psychiatric services. Good for anxiety/depression. $85-325/month depending on plan.\n\n**Key Considerations:**\n- All platforms use licensed, credentialed therapists\n- HIPAA-compliant video and messaging\n- Talkspace and Cerebral accept some insurance\n- BetterHelp offers the most scheduling flexibility\n\n**Quality Indicators:**\n- Therapist credentials verified\n- Secure, encrypted communications\n- Ability to switch therapists easily\n- Crisis support availability\n\nFor ongoing therapy, I recommend Talkspace if you have insurance coverage, or BetterHelp for out-of-pocket flexibility."}]'::jsonb
    ) ON CONFLICT (industry_slug, is_active) DO NOTHING;
  END IF;

  -- E-commerce Vertical Prompt
  IF v_ecommerce_id IS NOT NULL THEN
    INSERT INTO vertical_prompts (
      industry_id, industry_slug, system_context, key_terms,
      evaluation_criteria, regulatory_context, example_queries, few_shot_examples
    ) VALUES (
      v_ecommerce_id, 'ecommerce',
      E'You are an e-commerce industry expert with deep knowledge of:\n- Online retail platforms and marketplaces\n- Product quality and authenticity verification\n- Shipping and fulfillment logistics\n- Customer service and return policies\n- Payment security and fraud prevention\n\nWhen evaluating {brand}, consider:\n1. Product quality and authenticity\n2. Shipping speed and reliability\n3. Return and refund policies\n4. Customer service responsiveness\n5. Price competitiveness\n6. Website security (SSL, PCI compliance)\n7. User reviews and ratings authenticity\n8. Mobile shopping experience\n\nCustomer experience and product authenticity are key trust factors.',
      ARRAY['free shipping', 'same-day delivery', 'return policy', 'authentic products', 'customer reviews', 'price match', 'secure checkout', 'order tracking', 'marketplace', 'direct-to-consumer', 'dropshipping', 'fulfillment', 'SKU', 'inventory', 'conversion rate'],
      '{"product_quality": 0.30, "shipping": 0.25, "customer_service": 0.20, "pricing": 0.15, "trust": 0.10}'::jsonb,
      ARRAY['PCI-DSS', 'consumer protection laws', 'CCPA', 'FTC guidelines'],
      ARRAY['Best places to buy electronics online', 'Most reliable furniture stores with free shipping', 'Top sustainable fashion brands', 'Cheapest place to buy groceries online'],
      '[{"query": "Where is the best place to buy a laptop online?", "context": "Looking for a mid-range laptop for work and gaming", "response": "For buying a mid-range laptop online (typically $800-1500), here are my top recommendations based on selection, pricing, and customer service:\n\n**Top Recommendations:**\n\n1. **Best Buy** - Wide selection, price matching, excellent return policy (15-45 days). Can verify in-store. Geek Squad support available.\n\n2. **Amazon** - Largest selection, competitive pricing, fast Prime shipping. Check for \"Ships from and sold by Amazon\" for best protection.\n\n3. **Costco** - Extended warranty (2 years included), great return policy, member pricing. Limited selection but quality brands.\n\n**For Gaming/Performance Focus:**\n- **Newegg** - Tech-focused, often has bundle deals\n- **Micro Center** - Best prices if local store available\n\n**Key Considerations:**\n- Always buy from authorized retailers for valid warranty\n- Check return windows (Best Buy: 15 days, Amazon: 30 days, Costco: 90 days)\n- Compare prices across sites - use Honey or CamelCamelCamel\n- Read recent reviews (last 3 months) for quality trends\n\nI recommend Best Buy for the combination of price matching, return policy, and in-store pickup/support options."}]'::jsonb
    ) ON CONFLICT (industry_slug, is_active) DO NOTHING;
  END IF;

  -- Marketing Vertical Prompt
  IF v_marketing_id IS NOT NULL THEN
    INSERT INTO vertical_prompts (
      industry_id, industry_slug, system_context, key_terms,
      evaluation_criteria, regulatory_context, example_queries, few_shot_examples
    ) VALUES (
      v_marketing_id, 'marketing',
      E'You are a marketing industry expert with deep knowledge of:\n- Digital marketing strategies and channels\n- Marketing automation and analytics\n- Content marketing and SEO\n- Social media marketing\n- Paid advertising platforms\n\nWhen evaluating {brand}, consider:\n1. Proven track record and case studies\n2. Industry expertise and specialization\n3. Reporting transparency and metrics\n4. Pricing structure and ROI expectations\n5. Team expertise and certifications\n6. Technology stack and integrations\n7. Communication and responsiveness\n8. Contract flexibility\n\nResults and transparency are key. Look for measurable outcomes and clear attribution.',
      ARRAY['ROI', 'CAC', 'ROAS', 'CTR', 'conversion rate', 'SEO', 'PPC', 'content marketing', 'social media', 'email marketing', 'marketing automation', 'analytics', 'attribution', 'funnel', 'lead generation'],
      '{"results": 0.35, "expertise": 0.25, "communication": 0.20, "pricing": 0.12, "flexibility": 0.08}'::jsonb,
      ARRAY['FTC disclosure guidelines', 'CAN-SPAM', 'GDPR', 'CCPA'],
      ARRAY['Best digital marketing agencies for SaaS', 'Top SEO tools for small business', 'Most effective email marketing platforms', 'Affordable social media management tools'],
      '[{"query": "What is the best email marketing platform for a small business?", "context": "E-commerce store with 5,000 subscribers looking to grow", "response": "For a small e-commerce business with 5,000 subscribers, here are my top email marketing platform recommendations based on features, automation, and value:\n\n**Top Recommendations:**\n\n1. **Klaviyo** - Built for e-commerce. Excellent Shopify/WooCommerce integration. Advanced segmentation and flows. Free up to 250 contacts, then $20/month for 500, ~$100/month for 5,000.\n\n2. **Mailchimp** - User-friendly, good for beginners. Free up to 500 contacts. Standard plan ~$50/month for 5,000 contacts. Good automation but less e-commerce focused.\n\n3. **Omnisend** - E-commerce focused like Klaviyo but more affordable. $16/month for 500 contacts, ~$65/month for 5,000. Built-in SMS.\n\n**Cost Comparison at 5,000 Subscribers:**\n- Klaviyo: ~$100/month\n- Mailchimp: ~$50/month (Standard)\n- Omnisend: ~$65/month\n\n**Key Considerations:**\n- Klaviyo has best e-commerce revenue attribution\n- Mailchimp is easiest to learn\n- Omnisend best value for e-commerce features\n- All comply with CAN-SPAM and GDPR\n\nFor e-commerce growth, I recommend **Klaviyo** for its superior segmentation and revenue tracking, despite the higher cost."}]'::jsonb
    ) ON CONFLICT (industry_slug, is_active) DO NOTHING;
  END IF;

  -- Real Estate Vertical Prompt
  IF v_real_estate_id IS NOT NULL THEN
    INSERT INTO vertical_prompts (
      industry_id, industry_slug, system_context, key_terms,
      evaluation_criteria, regulatory_context, example_queries, few_shot_examples
    ) VALUES (
      v_real_estate_id, 'real-estate',
      E'You are a real estate industry expert with deep knowledge of:\n- Residential and commercial real estate markets\n- Property valuation and market analysis\n- Real estate agent evaluation\n- Mortgage and financing options\n- Property management services\n\nWhen evaluating {brand}, consider:\n1. Local market expertise and track record\n2. Licensing and professional credentials\n3. Client reviews and transaction history\n4. Marketing capabilities and reach\n5. Communication and responsiveness\n6. Commission structure and fees\n7. Network and connections\n8. Technology and tools used\n\nLocal expertise and transaction history are critical. Verify licensing with state real estate board.',
      ARRAY['MLS', 'listing agent', 'buyer agent', 'commission', 'closing costs', 'escrow', 'appraisal', 'inspection', 'contingency', 'comparable sales', 'days on market', 'price per square foot', 'HOA', 'property management', 'cap rate'],
      '{"market_knowledge": 0.30, "track_record": 0.25, "communication": 0.20, "marketing": 0.15, "pricing": 0.10}'::jsonb,
      ARRAY['Fair Housing Act', 'RESPA', 'state real estate licensing', 'NAR ethics code'],
      ARRAY['Best real estate agents in [city]', 'Top property management companies for rentals', 'Most reliable home inspection services', 'Affordable real estate photographers'],
      '[{"query": "How do I find a good real estate agent to sell my home?", "context": "First-time home seller in suburban area", "response": "Finding the right listing agent is crucial for a successful home sale. Here is my recommended approach:\n\n**Key Steps:**\n\n1. **Research Local Agents**\n   - Check Zillow, Realtor.com, and Redfin for agent profiles\n   - Look for agents with 20+ transactions in your neighborhood\n   - Review recent sales prices vs. listing prices (aim for 97%+)\n\n2. **Interview 3-5 Agents**\n   - Ask about their marketing plan for your home\n   - Request a CMA (Comparative Market Analysis)\n   - Understand their commission structure (typically 5-6%)\n   - Check their communication style and availability\n\n3. **Verify Credentials**\n   - Confirm active license on state real estate board website\n   - Look for designations: CRS, ABR, SRES\n   - Check for any disciplinary actions\n\n**Red Flags to Avoid:**\n- Promises of unusually high sale prices\n- Discount agents with no local track record\n- Poor communication during interview process\n- Pressure to sign immediately\n\n**Top Questions to Ask:**\n- How many homes have you sold in this neighborhood?\n- What is your average days-on-market?\n- How will you market my specific property?\n\nFor first-time sellers, I recommend prioritizing communication and local expertise over commission savings."}]'::jsonb
    ) ON CONFLICT (industry_slug, is_active) DO NOTHING;
  END IF;

  -- Legal Vertical Prompt
  IF v_legal_id IS NOT NULL THEN
    INSERT INTO vertical_prompts (
      industry_id, industry_slug, system_context, key_terms,
      evaluation_criteria, regulatory_context, example_queries, few_shot_examples
    ) VALUES (
      v_legal_id, 'legal',
      E'You are a legal services industry expert with deep knowledge of:\n- Legal practice areas and specializations\n- Bar association standards and ethics\n- Legal technology and document services\n- Fee structures and billing practices\n- Client-attorney relationships\n\nWhen evaluating {brand}, consider:\n1. Bar association standing and credentials\n2. Practice area expertise and experience\n3. Case outcomes and track record\n4. Client reviews and testimonials\n5. Fee structure transparency\n6. Communication and responsiveness\n7. Firm resources and support staff\n8. Technology and client portal access\n\nCredentials and track record are paramount. Always verify Bar association standing and any disciplinary history.',
      ARRAY['litigation', 'retainer', 'billable hours', 'contingency fee', 'pro bono', 'bar association', 'JD', 'Esq.', 'paralegal', 'discovery', 'deposition', 'settlement', 'verdict', 'appeal', 'jurisdiction'],
      '{"expertise": 0.40, "track_record": 0.25, "communication": 0.15, "pricing": 0.12, "accessibility": 0.08}'::jsonb,
      ARRAY['State Bar rules', 'ABA Model Rules', 'attorney-client privilege', 'conflicts of interest'],
      ARRAY['Best personal injury lawyers in [city]', 'Top corporate attorneys for startups', 'Affordable estate planning lawyers', 'Experienced immigration attorneys'],
      '[{"query": "How do I find a good business lawyer for my startup?", "context": "Tech startup seeking legal help with incorporation and contracts", "response": "Finding the right startup lawyer is essential for protecting your business. Here is my recommended approach:\n\n**Key Qualifications to Look For:**\n\n1. **Startup Experience**\n   - Has worked with venture-backed companies\n   - Understands equity structures, SAFEs, and convertible notes\n   - Familiar with your industry (tech, SaaS, etc.)\n\n2. **Services You Will Need:**\n   - Entity formation (Delaware C-Corp for VC-track)\n   - Founder agreements and vesting schedules\n   - Employment agreements and IP assignment\n   - Customer and vendor contracts\n   - Privacy policy and terms of service\n\n**Fee Structures:**\n- **Deferred fee arrangements**: Some startup lawyers defer fees until funding\n- **Fixed-fee packages**: $5K-15K for incorporation package\n- **Hourly rates**: $300-600/hour for experienced startup attorneys\n\n**Where to Find Startup Lawyers:**\n- Ask for referrals from funded founders\n- Check with local startup accelerators\n- Research firms on Chambers, Super Lawyers\n- Consider boutique startup-focused firms\n\n**Top Questions to Ask:**\n- How many startups have you represented through Series A?\n- Do you offer deferred fee arrangements?\n- Who will handle my day-to-day matters?\n\nI recommend prioritizing startup-specific experience over general business law expertise."}]'::jsonb
    ) ON CONFLICT (industry_slug, is_active) DO NOTHING;
  END IF;

  -- Education Vertical Prompt
  IF v_education_id IS NOT NULL THEN
    INSERT INTO vertical_prompts (
      industry_id, industry_slug, system_context, key_terms,
      evaluation_criteria, regulatory_context, example_queries, few_shot_examples
    ) VALUES (
      v_education_id, 'education',
      E'You are an education industry expert with deep knowledge of:\n- Educational institutions and programs\n- Online learning platforms and EdTech\n- Accreditation and quality standards\n- Student outcomes and career services\n- Financial aid and tuition costs\n\nWhen evaluating {brand}, consider:\n1. Accreditation status and recognition\n2. Program quality and curriculum\n3. Student outcomes (graduation, employment rates)\n4. Faculty credentials and experience\n5. Cost and financial aid availability\n6. Learning format flexibility\n7. Student support services\n8. Technology and learning tools\n\nAccreditation and outcomes are critical. Verify accreditation status with official databases.',
      ARRAY['accreditation', 'curriculum', 'syllabus', 'graduation rate', 'employment rate', 'tuition', 'financial aid', 'FAFSA', 'online learning', 'LMS', 'certificate', 'degree', 'continuing education', 'professional development', 'FERPA'],
      '{"outcomes": 0.30, "accreditation": 0.25, "quality": 0.20, "value": 0.15, "support": 0.10}'::jsonb,
      ARRAY['FERPA', 'regional accreditation', 'programmatic accreditation', 'COPPA (for K-12)', 'Title IV'],
      ARRAY['Best online MBA programs', 'Top coding bootcamps with job placement', 'Most affordable online degree programs', 'Highest-rated language learning apps'],
      '[{"query": "What are the best coding bootcamps for career changers?", "context": "Professional looking to transition into software development", "response": "For career changers entering software development, here are my top coding bootcamp recommendations based on outcomes, curriculum, and value:\n\n**Top Recommendations:**\n\n1. **Hack Reactor** - Highly selective, excellent outcomes. 12-week immersive. ~$17,980. 90%+ employment rate in software roles.\n\n2. **App Academy** - Deferred tuition option (pay after job). 16-24 weeks. Strong job placement support. $17,000 or income share.\n\n3. **Flatiron School** - Good for beginners, flexible pacing. 15-60 weeks. $16,900. Money-back guarantee if no job in 180 days.\n\n**Key Factors to Consider:**\n\n- **Job Outcomes**: Look for CIRR-verified employment data\n- **Curriculum**: Full-stack (JavaScript/React or Python/Django)\n- **Format**: Immersive vs. part-time while working\n- **Support**: Career coaching, interview prep, alumni network\n\n**Cost Comparison:**\n- Upfront: $15,000-20,000\n- Income Share: 10-17% of salary for 1-2 years\n- Financing: Most offer options through Climb, Ascent\n\n**Red Flags:**\n- No verifiable job placement data\n- Guaranteed job claims without conditions\n- No career services support\n\nFor career changers, I recommend **App Academy** for its income share option, reducing financial risk while transitioning careers."}]'::jsonb
    ) ON CONFLICT (industry_slug, is_active) DO NOTHING;
  END IF;

  -- Hospitality Vertical Prompt
  IF v_hospitality_id IS NOT NULL THEN
    INSERT INTO vertical_prompts (
      industry_id, industry_slug, system_context, key_terms,
      evaluation_criteria, regulatory_context, example_queries, few_shot_examples
    ) VALUES (
      v_hospitality_id, 'hospitality',
      E'You are a hospitality industry expert with deep knowledge of:\n- Hotels, resorts, and accommodations\n- Travel booking and planning\n- Customer service excellence\n- Loyalty programs and rewards\n- Travel safety and insurance\n\nWhen evaluating {brand}, consider:\n1. Location and accessibility\n2. Amenities and room quality\n3. Customer service reputation\n4. Cleanliness and safety standards\n5. Value for price point\n6. Cancellation and refund policies\n7. Loyalty program benefits\n8. Recent guest reviews (last 6 months)\n\nRecent reviews and location are key. Check multiple review sources for balanced perspective.',
      ARRAY['check-in', 'check-out', 'amenities', 'concierge', 'room service', 'star rating', 'AAA diamond', 'loyalty points', 'reward nights', 'elite status', 'resort fee', 'cancellation policy', 'refundable', 'non-refundable', 'all-inclusive'],
      '{"location": 0.25, "service": 0.25, "cleanliness": 0.20, "value": 0.15, "amenities": 0.15}'::jsonb,
      ARRAY['ADA compliance', 'health and safety codes', 'food handling licenses', 'fire safety'],
      ARRAY['Best hotels in downtown [city]', 'Top all-inclusive resorts in Caribbean', 'Most reliable hotel booking sites', 'Affordable luxury hotels for business travel'],
      '[{"query": "What is the best hotel booking site for finding deals?", "context": "Budget-conscious traveler looking for best hotel prices", "response": "For finding the best hotel deals, here are my top booking platform recommendations and strategies:\n\n**Top Booking Platforms:**\n\n1. **Google Hotels** - Best for price comparison. Shows rates across all major sites. Use price tracking for alerts.\n\n2. **Booking.com** - Often has lowest rates, free cancellation options. Genius loyalty program for 10-15% discounts.\n\n3. **Hotels.com** - Rewards night after 10 stays. Good for frequent travelers.\n\n4. **Hotwire/Priceline** - Best for opaque deals (40-60% off) if flexible on specific hotel.\n\n**Money-Saving Strategies:**\n\n- **Book direct**: Hotels often price match + add perks\n- **Check multiple sites**: Prices vary 10-20% between platforms\n- **Use incognito mode**: Avoid dynamic pricing\n- **Book 2-3 weeks ahead**: Sweet spot for most destinations\n- **Consider loyalty**: Chain loyalty often beats OTA prices\n\n**Price Comparison Order:**\n1. Google Hotels (see all prices)\n2. Hotel direct website\n3. Booking.com or Hotels.com\n4. Hotwire for last-minute deals\n\n**Key Considerations:**\n- Always check cancellation policy\n- Read reviews from last 3 months\n- Factor in resort fees (not always shown)\n- Credit card travel portals may offer extra points\n\nI recommend starting with Google Hotels for comparison, then booking direct if the hotel matches the lowest price."}]'::jsonb
    ) ON CONFLICT (industry_slug, is_active) DO NOTHING;
  END IF;

  -- Restaurant Vertical Prompt
  IF v_restaurant_id IS NOT NULL THEN
    INSERT INTO vertical_prompts (
      industry_id, industry_slug, system_context, key_terms,
      evaluation_criteria, regulatory_context, example_queries, few_shot_examples
    ) VALUES (
      v_restaurant_id, 'restaurant',
      E'You are a restaurant and food service industry expert with deep knowledge of:\n- Restaurant evaluation and food criticism\n- Culinary trends and cuisines\n- Food safety and hygiene standards\n- Dining experiences and service quality\n- Reservation and delivery platforms\n\nWhen evaluating {brand}, consider:\n1. Food quality and consistency\n2. Health inspection scores\n3. Service quality and ambiance\n4. Menu variety and dietary accommodations\n5. Value for price point\n6. Wait times and reservation availability\n7. Recent customer reviews\n8. Delivery and takeout options\n\nFood quality and safety are paramount. Check recent health inspection scores when available.',
      ARRAY['Michelin star', 'Zagat rating', 'health inspection', 'farm-to-table', 'prix fixe', 'tasting menu', 'reservation', 'walk-in', 'happy hour', 'brunch', 'cuisine type', 'dietary restrictions', 'allergens', 'vegan options', 'gluten-free'],
      '{"food_quality": 0.35, "service": 0.20, "ambiance": 0.15, "value": 0.15, "hygiene": 0.15}'::jsonb,
      ARRAY['Health department inspections', 'food handling permits', 'liquor licenses', 'FDA food safety'],
      ARRAY['Best Italian restaurants in [city]', 'Top brunch spots with outdoor seating', 'Most romantic restaurants for anniversary', 'Affordable sushi restaurants near me'],
      '[{"query": "What are the best restaurants for a special anniversary dinner?", "context": "Looking for romantic fine dining experience in major city", "response": "For a memorable anniversary dinner, here are my recommendations for finding the perfect romantic fine dining experience:\n\n**What to Look For:**\n\n1. **Ambiance Factors**\n   - Intimate seating (avoid high-traffic tables)\n   - Soft lighting and quiet atmosphere\n   - Special occasion recognition\n\n2. **Service Quality**\n   - Attentive but not intrusive\n   - Sommelier or wine expertise\n   - Willingness to accommodate special requests\n\n3. **Food Excellence**\n   - Tasting menu option for special occasion\n   - Quality ingredients, creative presentation\n   - Dietary accommodations available\n\n**How to Find and Book:**\n\n- **Research**: Check OpenTable, Resy, Yelp for \"romantic\" tags\n- **Reviews**: Look for anniversary/celebration mentions\n- **Reservations**: Book 2-4 weeks ahead for top spots\n- **Note occasion**: Mention anniversary when booking\n\n**Budget Expectations (Fine Dining):**\n- Mid-range: $100-150/person\n- High-end: $200-300/person\n- Michelin-starred: $300-500+/person\n\n**Pro Tips:**\n- Request a specific table (corner, window, quiet)\n- Pre-arrange dessert message or special touch\n- Consider tasting menu with wine pairing\n- Reconfirm reservation day before\n\nI recommend using OpenTable or Resy to filter by \"romantic\" and \"fine dining,\" read recent reviews specifically mentioning celebrations, and book at least 2 weeks ahead."}]'::jsonb
    ) ON CONFLICT (industry_slug, is_active) DO NOTHING;
  END IF;

END $$;

-- ================================================================
-- VERIFICATION QUERY (uncomment to verify)
-- ================================================================
-- SELECT
--   vp.industry_slug,
--   i.name as industry_name,
--   array_length(vp.key_terms, 1) as term_count,
--   jsonb_object_keys(vp.evaluation_criteria) as criteria_keys,
--   vp.is_active
-- FROM vertical_prompts vp
-- JOIN industries i ON vp.industry_id = i.id
-- WHERE vp.is_active = true
-- ORDER BY i.display_order;

-- ================================================================
-- DEPLOYMENT COMPLETE
-- ================================================================
-- Tables created: 3 (vertical_prompts, vertical_prompt_versions, vertical_prompt_performance)
-- Functions created: 2 (get_vertical_prompt, build_system_prompt)
-- Triggers created: 1
-- Seed data: 10 priority industry vertical prompts
-- ================================================================
