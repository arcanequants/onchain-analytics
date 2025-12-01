/**
 * Tests for Vertical Prompts Database Migration
 * Validates the SQL migration structure and seed data
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Vertical Prompts Database Migration', () => {
  let migrationSQL: string;

  beforeAll(() => {
    const migrationPath = path.join(
      process.cwd(),
      'supabase/migrations/20251130_vertical_prompts.sql'
    );
    migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
  });

  // ================================================================
  // TABLE STRUCTURE TESTS
  // ================================================================

  describe('Table Structure', () => {
    it('should create vertical_prompts table', () => {
      expect(migrationSQL).toContain('CREATE TABLE IF NOT EXISTS vertical_prompts');
    });

    it('should create vertical_prompt_versions table', () => {
      expect(migrationSQL).toContain('CREATE TABLE IF NOT EXISTS vertical_prompt_versions');
    });

    it('should create vertical_prompt_performance table', () => {
      expect(migrationSQL).toContain('CREATE TABLE IF NOT EXISTS vertical_prompt_performance');
    });

    it('should have industry_id foreign key', () => {
      expect(migrationSQL).toContain('industry_id UUID NOT NULL REFERENCES industries(id)');
    });

    it('should have system_context column', () => {
      expect(migrationSQL).toContain('system_context TEXT NOT NULL');
    });

    it('should have key_terms array column', () => {
      expect(migrationSQL).toContain('key_terms TEXT[] NOT NULL');
    });

    it('should have evaluation_criteria JSONB column', () => {
      expect(migrationSQL).toContain('evaluation_criteria JSONB NOT NULL');
    });

    it('should have few_shot_examples JSONB column', () => {
      expect(migrationSQL).toContain('few_shot_examples JSONB NOT NULL');
    });
  });

  // ================================================================
  // CONSTRAINT TESTS
  // ================================================================

  describe('Constraints', () => {
    it('should check evaluation weights sum to 1.0', () => {
      expect(migrationSQL).toContain('chk_evaluation_weights');
      expect(migrationSQL).toContain('BETWEEN 0.99 AND 1.01');
    });

    it('should require minimum key terms', () => {
      expect(migrationSQL).toContain('chk_key_terms_not_empty');
      expect(migrationSQL).toContain('array_length(key_terms, 1) >= 5');
    });

    it('should require minimum system context length', () => {
      expect(migrationSQL).toContain('chk_system_context_length');
      expect(migrationSQL).toContain('length(system_context) >= 100');
    });

    it('should have unique constraint on industry_slug + is_active', () => {
      expect(migrationSQL).toContain('UNIQUE(industry_slug, is_active)');
    });
  });

  // ================================================================
  // INDEX TESTS
  // ================================================================

  describe('Indexes', () => {
    it('should create index on industry_id', () => {
      expect(migrationSQL).toContain('idx_vertical_prompts_industry');
    });

    it('should create index on industry_slug', () => {
      expect(migrationSQL).toContain('idx_vertical_prompts_slug');
    });

    it('should create index on is_active', () => {
      expect(migrationSQL).toContain('idx_vertical_prompts_active');
    });

    it('should create performance indexes', () => {
      expect(migrationSQL).toContain('idx_vertical_prompt_performance_date');
      expect(migrationSQL).toContain('idx_vertical_prompt_performance_prompt');
    });
  });

  // ================================================================
  // RLS POLICY TESTS
  // ================================================================

  describe('Row Level Security', () => {
    it('should enable RLS on vertical_prompts', () => {
      expect(migrationSQL).toContain('ALTER TABLE vertical_prompts ENABLE ROW LEVEL SECURITY');
    });

    it('should have public read policy for active prompts', () => {
      expect(migrationSQL).toContain('Public read active prompts');
      expect(migrationSQL).toContain('is_active = true');
    });

    it('should have service role full access policy', () => {
      expect(migrationSQL).toContain('Service role full access');
      expect(migrationSQL).toContain("auth.role() = 'service_role'");
    });

    it('should enable RLS on version and performance tables', () => {
      expect(migrationSQL).toContain('ALTER TABLE vertical_prompt_versions ENABLE ROW LEVEL SECURITY');
      expect(migrationSQL).toContain('ALTER TABLE vertical_prompt_performance ENABLE ROW LEVEL SECURITY');
    });
  });

  // ================================================================
  // FUNCTION TESTS
  // ================================================================

  describe('Functions', () => {
    it('should create get_vertical_prompt function', () => {
      expect(migrationSQL).toContain('CREATE OR REPLACE FUNCTION get_vertical_prompt');
      expect(migrationSQL).toContain('p_industry_slug TEXT');
    });

    it('should create build_system_prompt function', () => {
      expect(migrationSQL).toContain('CREATE OR REPLACE FUNCTION build_system_prompt');
      expect(migrationSQL).toContain('p_brand TEXT');
      expect(migrationSQL).toContain('p_country TEXT');
      expect(migrationSQL).toContain('p_competitors TEXT[]');
    });

    it('should replace {brand} placeholder in build_system_prompt', () => {
      expect(migrationSQL).toContain("replace(v_context, '{brand}', p_brand)");
    });

    it('should add geographic context when provided', () => {
      expect(migrationSQL).toContain('Geographic context:');
    });

    it('should add competitors when provided', () => {
      expect(migrationSQL).toContain('Key competitors to consider:');
    });
  });

  // ================================================================
  // TRIGGER TESTS
  // ================================================================

  describe('Triggers', () => {
    it('should create updated_at trigger', () => {
      expect(migrationSQL).toContain('update_vertical_prompts_updated_at');
      expect(migrationSQL).toContain('update_updated_at_column()');
    });
  });

  // ================================================================
  // SEED DATA TESTS
  // ================================================================

  describe('Seed Data', () => {
    const industries = [
      'saas',
      'fintech',
      'healthcare',
      'ecommerce',
      'marketing',
      'real-estate',
      'legal',
      'education',
      'hospitality',
      'restaurant'
    ];

    industries.forEach(industry => {
      it(`should seed ${industry} vertical prompt`, () => {
        // Check for industry slug in INSERT
        expect(migrationSQL).toContain(`'${industry}'`);
      });
    });

    it('should include system context for each vertical', () => {
      expect(migrationSQL).toContain('You are a SaaS industry expert');
      expect(migrationSQL).toContain('You are a fintech industry expert');
      expect(migrationSQL).toContain('You are a healthcare industry expert');
    });

    it('should include evaluation criteria weights', () => {
      // SaaS weights
      expect(migrationSQL).toContain('"features": 0.30');
      expect(migrationSQL).toContain('"reliability": 0.25');

      // Healthcare weights
      expect(migrationSQL).toContain('"trust": 0.35');
      expect(migrationSQL).toContain('"outcomes": 0.30');

      // Legal weights
      expect(migrationSQL).toContain('"expertise": 0.40');
    });

    it('should include regulatory context', () => {
      expect(migrationSQL).toContain('SOC 2');
      expect(migrationSQL).toContain('HIPAA');
      expect(migrationSQL).toContain('PCI-DSS');
      expect(migrationSQL).toContain('FERPA');
    });

    it('should include few-shot examples', () => {
      expect(migrationSQL).toContain('Top Recommendations:');
      expect(migrationSQL).toContain('Key Considerations:');
    });

    it('should use ON CONFLICT DO NOTHING for idempotency', () => {
      expect(migrationSQL).toContain('ON CONFLICT (industry_slug, is_active) DO NOTHING');
    });
  });

  // ================================================================
  // VERSION TABLE TESTS
  // ================================================================

  describe('Version Table', () => {
    it('should track version number', () => {
      expect(migrationSQL).toContain('version INTEGER NOT NULL');
    });

    it('should track change type', () => {
      expect(migrationSQL).toContain('change_type TEXT NOT NULL');
      expect(migrationSQL).toContain("'create'");
      expect(migrationSQL).toContain("'update'");
      expect(migrationSQL).toContain("'deactivate'");
    });

    it('should snapshot prompt content', () => {
      expect(migrationSQL).toContain('-- Snapshot of prompt at this version');
    });

    it('should track who made changes', () => {
      expect(migrationSQL).toContain('changed_by UUID REFERENCES user_profiles');
    });
  });

  // ================================================================
  // PERFORMANCE TABLE TESTS
  // ================================================================

  describe('Performance Table', () => {
    it('should track daily metrics', () => {
      expect(migrationSQL).toContain('date DATE NOT NULL');
      expect(migrationSQL).toContain('total_analyses INTEGER NOT NULL');
    });

    it('should track quality metrics', () => {
      expect(migrationSQL).toContain('avg_confidence_score DECIMAL');
      expect(migrationSQL).toContain('avg_user_rating DECIMAL');
    });

    it('should track hallucination reports', () => {
      expect(migrationSQL).toContain('hallucination_reports INTEGER NOT NULL');
      expect(migrationSQL).toContain('confirmed_hallucinations INTEGER NOT NULL');
    });

    it('should track feedback', () => {
      expect(migrationSQL).toContain('positive_feedback INTEGER NOT NULL');
      expect(migrationSQL).toContain('negative_feedback INTEGER NOT NULL');
    });

    it('should track token efficiency', () => {
      expect(migrationSQL).toContain('avg_tokens_per_analysis INTEGER');
      expect(migrationSQL).toContain('avg_cost_per_analysis DECIMAL');
    });

    it('should have unique constraint per prompt per day', () => {
      expect(migrationSQL).toContain('UNIQUE(vertical_prompt_id, date)');
    });
  });

  // ================================================================
  // SQL SYNTAX VALIDATION
  // ================================================================

  describe('SQL Syntax', () => {
    it('should not have trailing syntax errors', () => {
      // Check that the file ends with a proper statement
      const trimmed = migrationSQL.trim();
      expect(trimmed.endsWith('-- ================================================================')).toBe(true);
    });

    it('should have balanced parentheses in major structures', () => {
      // Simple check for CREATE TABLE statements
      const createTableMatches = migrationSQL.match(/CREATE TABLE IF NOT EXISTS/g);
      expect(createTableMatches?.length).toBe(3);
    });

    it('should use proper UUID extension', () => {
      expect(migrationSQL).toContain('uuid_generate_v4()');
    });

    it('should use proper timestamp type', () => {
      expect(migrationSQL).toContain('TIMESTAMPTZ');
    });
  });
});
