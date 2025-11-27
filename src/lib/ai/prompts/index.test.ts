/**
 * AI Prompt Templates Tests
 * Phase 1, Week 1, Day 1
 */

import { describe, it, expect } from 'vitest';
import {
  PROMPT_PARAMETERS,
  PROVIDER_TEMPERATURE_ADJUSTMENTS,
  COT_PROMPTS,
  FEW_SHOT_EXAMPLES,
  BASE_PROMPTS,
  PROMPT_TEMPLATES,
  interpolatePrompt,
  buildPrompt,
  getProviderParameters,
  getSystemPrompt,
  type PromptType,
  type AIProvider,
} from './index';

describe('PROMPT_PARAMETERS', () => {
  const promptTypes: PromptType[] = [
    'industry_detection',
    'perception_query',
    'response_extraction',
    'recommendation_gen',
    'sentiment_analysis',
    'hallucination_check',
  ];

  it('should have parameters for all prompt types', () => {
    promptTypes.forEach((type) => {
      expect(PROMPT_PARAMETERS[type]).toBeDefined();
    });
  });

  it('should have valid temperature values (0-1)', () => {
    promptTypes.forEach((type) => {
      const { temperature } = PROMPT_PARAMETERS[type];
      expect(temperature).toBeGreaterThanOrEqual(0);
      expect(temperature).toBeLessThanOrEqual(1);
    });
  });

  it('should have valid maxTokens values', () => {
    promptTypes.forEach((type) => {
      const { maxTokens } = PROMPT_PARAMETERS[type];
      expect(maxTokens).toBeGreaterThan(0);
      expect(maxTokens).toBeLessThanOrEqual(4000);
    });
  });

  it('should have extraction tasks with low temperature', () => {
    expect(PROMPT_PARAMETERS.response_extraction.temperature).toBe(0.0);
    expect(PROMPT_PARAMETERS.hallucination_check.temperature).toBe(0.0);
  });

  it('should have creative tasks with higher temperature', () => {
    expect(PROMPT_PARAMETERS.recommendation_gen.temperature).toBeGreaterThan(0.3);
    expect(PROMPT_PARAMETERS.perception_query.temperature).toBeGreaterThan(0.3);
  });
});

describe('PROVIDER_TEMPERATURE_ADJUSTMENTS', () => {
  const providers: AIProvider[] = ['openai', 'anthropic', 'google', 'perplexity'];

  it('should have adjustments for all providers', () => {
    providers.forEach((provider) => {
      expect(PROVIDER_TEMPERATURE_ADJUSTMENTS[provider]).toBeDefined();
    });
  });

  it('should have openai as the baseline (0 adjustment)', () => {
    expect(PROVIDER_TEMPERATURE_ADJUSTMENTS.openai).toBe(0);
  });

  it('should have google with lower temperature', () => {
    expect(PROVIDER_TEMPERATURE_ADJUSTMENTS.google).toBeLessThan(0);
  });
});

describe('COT_PROMPTS', () => {
  const promptTypes: PromptType[] = [
    'industry_detection',
    'perception_query',
    'response_extraction',
    'recommendation_gen',
    'sentiment_analysis',
    'hallucination_check',
  ];

  it('should have CoT prompts for all types', () => {
    promptTypes.forEach((type) => {
      expect(COT_PROMPTS[type]).toBeDefined();
      expect(COT_PROMPTS[type].length).toBeGreaterThan(50);
    });
  });

  it('should contain step-by-step language', () => {
    promptTypes.forEach((type) => {
      const prompt = COT_PROMPTS[type].toLowerCase();
      expect(
        prompt.includes('step') ||
          prompt.includes('1.') ||
          prompt.includes('first') ||
          prompt.includes('let me')
      ).toBe(true);
    });
  });

  it('should contain numbered steps', () => {
    promptTypes.forEach((type) => {
      const prompt = COT_PROMPTS[type];
      expect(prompt).toMatch(/[1-5]\./);
    });
  });
});

describe('FEW_SHOT_EXAMPLES', () => {
  const promptTypes: PromptType[] = [
    'industry_detection',
    'perception_query',
    'response_extraction',
    'recommendation_gen',
    'sentiment_analysis',
    'hallucination_check',
  ];

  it('should have examples for all prompt types', () => {
    promptTypes.forEach((type) => {
      expect(FEW_SHOT_EXAMPLES[type]).toBeDefined();
      expect(FEW_SHOT_EXAMPLES[type].length).toBeGreaterThan(0);
    });
  });

  it('should have valid example structure', () => {
    promptTypes.forEach((type) => {
      FEW_SHOT_EXAMPLES[type].forEach((example) => {
        expect(example.query).toBeDefined();
        expect(example.query.length).toBeGreaterThan(10);
        expect(example.response).toBeDefined();
        expect(example.response.length).toBeGreaterThan(20);
      });
    });
  });

  it('should have JSON responses for extraction tasks', () => {
    ['industry_detection', 'response_extraction', 'sentiment_analysis'].forEach((type) => {
      FEW_SHOT_EXAMPLES[type as PromptType].forEach((example) => {
        expect(example.response.includes('{')).toBe(true);
        expect(example.response.includes('}')).toBe(true);
      });
    });
  });
});

describe('BASE_PROMPTS', () => {
  const promptTypes: PromptType[] = [
    'industry_detection',
    'perception_query',
    'response_extraction',
    'recommendation_gen',
    'sentiment_analysis',
    'hallucination_check',
  ];

  it('should have base prompts for all types', () => {
    promptTypes.forEach((type) => {
      expect(BASE_PROMPTS[type]).toBeDefined();
      expect(BASE_PROMPTS[type].length).toBeGreaterThan(50);
    });
  });

  it('should include role definition', () => {
    promptTypes.forEach((type) => {
      const prompt = BASE_PROMPTS[type].toLowerCase();
      expect(
        prompt.includes('you are') || prompt.includes('expert') || prompt.includes('system')
      ).toBe(true);
    });
  });
});

describe('interpolatePrompt', () => {
  it('should replace single variable', () => {
    const template = 'Hello {name}!';
    const result = interpolatePrompt(template, { name: 'World' });
    expect(result).toBe('Hello World!');
  });

  it('should replace multiple variables', () => {
    const template = 'Analyze {brand} in {industry}';
    const result = interpolatePrompt(template, { brand: 'Stripe', industry: 'fintech' });
    expect(result).toBe('Analyze Stripe in fintech');
  });

  it('should replace repeated variables', () => {
    const template = '{brand} is great. I love {brand}.';
    const result = interpolatePrompt(template, { brand: 'Notion' });
    expect(result).toBe('Notion is great. I love Notion.');
  });

  it('should ignore undefined variables', () => {
    const template = 'Hello {name} in {country}';
    const result = interpolatePrompt(template, { name: 'Test' });
    expect(result).toBe('Hello Test in {country}');
  });
});

describe('buildPrompt', () => {
  it('should include base prompt', () => {
    const result = buildPrompt('industry_detection', { url: 'https://example.com' });
    expect(result).toContain(BASE_PROMPTS.industry_detection);
  });

  it('should include CoT by default', () => {
    const result = buildPrompt('perception_query', { brand: 'Stripe' });
    expect(result).toContain('step by step');
  });

  it('should include few-shot examples by default', () => {
    const result = buildPrompt('industry_detection', { url: 'https://example.com' });
    expect(result).toContain('Example 1');
  });

  it('should exclude CoT when disabled', () => {
    const result = buildPrompt(
      'industry_detection',
      { url: 'https://example.com' },
      { includeCoT: false }
    );
    expect(result).not.toContain('step by step');
  });

  it('should exclude few-shot when disabled', () => {
    const result = buildPrompt(
      'industry_detection',
      { url: 'https://example.com' },
      { includeFewShot: false }
    );
    expect(result).not.toContain('Example 1');
  });

  it('should include provided variables', () => {
    const result = buildPrompt('perception_query', {
      brand: 'Stripe',
      industry: 'fintech',
      country: 'US',
    });
    expect(result).toContain('Brand: Stripe');
    expect(result).toContain('Industry: fintech');
    expect(result).toContain('Country: US');
  });

  it('should limit few-shot examples when specified', () => {
    const result = buildPrompt(
      'perception_query',
      { brand: 'Test' },
      { fewShotCount: 1 }
    );
    expect(result).toContain('Example 1');
    expect(result).not.toContain('Example 2');
  });
});

describe('getProviderParameters', () => {
  it('should return base parameters for openai', () => {
    const params = getProviderParameters('perception_query', 'openai');
    expect(params.temperature).toBe(PROMPT_PARAMETERS.perception_query.temperature);
  });

  it('should adjust temperature for anthropic', () => {
    const params = getProviderParameters('perception_query', 'anthropic');
    const expected =
      PROMPT_PARAMETERS.perception_query.temperature +
      PROVIDER_TEMPERATURE_ADJUSTMENTS.anthropic;
    expect(params.temperature).toBe(expected);
  });

  it('should adjust temperature for google', () => {
    const params = getProviderParameters('perception_query', 'google');
    const expected =
      PROMPT_PARAMETERS.perception_query.temperature +
      PROVIDER_TEMPERATURE_ADJUSTMENTS.google;
    expect(params.temperature).toBe(expected);
  });

  it('should clamp temperature to valid range', () => {
    const params = getProviderParameters('hallucination_check', 'google');
    expect(params.temperature).toBeGreaterThanOrEqual(0);
    expect(params.temperature).toBeLessThanOrEqual(1);
  });

  it('should preserve other parameters', () => {
    const params = getProviderParameters('perception_query', 'anthropic');
    expect(params.maxTokens).toBe(PROMPT_PARAMETERS.perception_query.maxTokens);
    expect(params.topP).toBe(PROMPT_PARAMETERS.perception_query.topP);
  });
});

describe('getSystemPrompt', () => {
  it('should return base prompt for all providers', () => {
    const providers: AIProvider[] = ['openai', 'anthropic', 'google', 'perplexity'];
    providers.forEach((provider) => {
      const result = getSystemPrompt('perception_query', provider);
      expect(result).toContain(BASE_PROMPTS.perception_query);
    });
  });

  it('should add JSON instruction for openai', () => {
    const result = getSystemPrompt('industry_detection', 'openai');
    expect(result.toLowerCase()).toContain('json');
  });

  it('should add XML tags instruction for anthropic', () => {
    const result = getSystemPrompt('industry_detection', 'anthropic');
    expect(result).toContain('<output>');
  });

  it('should add JSON instruction for google', () => {
    const result = getSystemPrompt('industry_detection', 'google');
    expect(result.toLowerCase()).toContain('json');
  });
});

describe('PROMPT_TEMPLATES', () => {
  const promptTypes: PromptType[] = [
    'industry_detection',
    'perception_query',
    'response_extraction',
    'recommendation_gen',
    'sentiment_analysis',
    'hallucination_check',
  ];

  it('should have templates for all prompt types', () => {
    promptTypes.forEach((type) => {
      expect(PROMPT_TEMPLATES[type]).toBeDefined();
    });
  });

  it('should have complete template structure', () => {
    promptTypes.forEach((type) => {
      const template = PROMPT_TEMPLATES[type];
      expect(template.type).toBe(type);
      expect(template.basePrompt).toBeDefined();
      expect(template.cotPrompt).toBeDefined();
      expect(template.fewShotExamples).toBeDefined();
      expect(template.parameters).toBeDefined();
    });
  });

  it('should have consistent references', () => {
    promptTypes.forEach((type) => {
      const template = PROMPT_TEMPLATES[type];
      expect(template.basePrompt).toBe(BASE_PROMPTS[type]);
      expect(template.cotPrompt).toBe(COT_PROMPTS[type]);
      expect(template.fewShotExamples).toBe(FEW_SHOT_EXAMPLES[type]);
      expect(template.parameters).toBe(PROMPT_PARAMETERS[type]);
    });
  });
});
