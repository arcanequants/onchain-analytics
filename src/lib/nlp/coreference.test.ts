/**
 * Coreference Resolution Tests
 *
 * Tests for pronoun detection and coreference resolution
 * Phase 3, Week 10
 */

import { describe, it, expect } from 'vitest';
import {
  isPronoun,
  getPronounType,
  getPronounMetadata,
  detectPronouns,
  detectEntities,
  detectGenderFromName,
  detectEntityType,
  areCompatible,
  calculateConfidence,
  findAntecedent,
  resolveCoreferences,
  expandPronouns,
  getMentionsForEntity,
  countEntityReferences,
  getCoreferenceStats,
  PERSONAL_PRONOUNS,
  POSSESSIVE_PRONOUNS,
  REFLEXIVE_PRONOUNS,
  DEMONSTRATIVE_PRONOUNS,
  RELATIVE_PRONOUNS,
} from './coreference';

describe('Coreference Resolution', () => {
  describe('isPronoun', () => {
    it('should identify personal pronouns', () => {
      expect(isPronoun('he')).toBe(true);
      expect(isPronoun('she')).toBe(true);
      expect(isPronoun('it')).toBe(true);
      expect(isPronoun('they')).toBe(true);
      expect(isPronoun('him')).toBe(true);
      expect(isPronoun('her')).toBe(true);
    });

    it('should identify possessive pronouns', () => {
      expect(isPronoun('his')).toBe(true);
      expect(isPronoun('hers')).toBe(true);
      expect(isPronoun('its')).toBe(true);
      expect(isPronoun('their')).toBe(true);
    });

    it('should identify reflexive pronouns', () => {
      expect(isPronoun('himself')).toBe(true);
      expect(isPronoun('herself')).toBe(true);
      expect(isPronoun('itself')).toBe(true);
      expect(isPronoun('themselves')).toBe(true);
    });

    it('should identify demonstrative pronouns', () => {
      expect(isPronoun('this')).toBe(true);
      expect(isPronoun('that')).toBe(true);
      expect(isPronoun('these')).toBe(true);
      expect(isPronoun('those')).toBe(true);
    });

    it('should identify relative pronouns', () => {
      expect(isPronoun('who')).toBe(true);
      expect(isPronoun('whom')).toBe(true);
      expect(isPronoun('which')).toBe(true);
    });

    it('should not identify non-pronouns', () => {
      expect(isPronoun('dog')).toBe(false);
      expect(isPronoun('company')).toBe(false);
      expect(isPronoun('the')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isPronoun('He')).toBe(true);
      expect(isPronoun('SHE')).toBe(true);
      expect(isPronoun('They')).toBe(true);
    });
  });

  describe('getPronounType', () => {
    it('should return correct type for personal pronouns', () => {
      expect(getPronounType('he')).toBe('personal');
      expect(getPronounType('she')).toBe('personal');
      expect(getPronounType('they')).toBe('personal');
    });

    it('should return correct type for possessive pronouns', () => {
      expect(getPronounType('his')).toBe('possessive');
      expect(getPronounType('their')).toBe('possessive');
    });

    it('should return correct type for reflexive pronouns', () => {
      expect(getPronounType('himself')).toBe('reflexive');
      expect(getPronounType('themselves')).toBe('reflexive');
    });

    it('should return correct type for demonstrative pronouns', () => {
      expect(getPronounType('this')).toBe('demonstrative');
      expect(getPronounType('those')).toBe('demonstrative');
    });

    it('should return correct type for relative pronouns', () => {
      expect(getPronounType('who')).toBe('relative');
      expect(getPronounType('which')).toBe('relative');
    });

    it('should return null for non-pronouns', () => {
      expect(getPronounType('dog')).toBeNull();
      expect(getPronounType('company')).toBeNull();
    });
  });

  describe('getPronounMetadata', () => {
    it('should return correct metadata for masculine pronouns', () => {
      const metadata = getPronounMetadata('he');
      expect(metadata?.gender).toBe('masculine');
      expect(metadata?.person).toBe('third');
    });

    it('should return correct metadata for feminine pronouns', () => {
      const metadata = getPronounMetadata('she');
      expect(metadata?.gender).toBe('feminine');
      expect(metadata?.person).toBe('third');
    });

    it('should return correct metadata for neutral pronouns', () => {
      const metadata = getPronounMetadata('it');
      expect(metadata?.gender).toBe('neutral');
      expect(metadata?.person).toBe('third');
    });

    it('should return correct metadata for plural pronouns', () => {
      const metadata = getPronounMetadata('they');
      expect(metadata?.gender).toBe('plural');
      expect(metadata?.person).toBe('third');
    });

    it('should return correct metadata for first person pronouns', () => {
      const metadata = getPronounMetadata('i');
      expect(metadata?.person).toBe('first');
    });

    it('should return correct metadata for second person pronouns', () => {
      const metadata = getPronounMetadata('you');
      expect(metadata?.person).toBe('second');
    });
  });

  describe('detectPronouns', () => {
    it('should detect pronouns in simple text', () => {
      const text = 'He went to the store. She was there too.';
      const pronouns = detectPronouns(text);
      expect(pronouns.length).toBe(2);
      expect(pronouns[0].pronoun).toBe('he');
      expect(pronouns[1].pronoun).toBe('she');
    });

    it('should detect multiple pronoun types', () => {
      const text = 'He took his book and read it himself.';
      const pronouns = detectPronouns(text);
      expect(pronouns.length).toBeGreaterThanOrEqual(4);
    });

    it('should track sentence index', () => {
      const text = 'John is here. He is happy.';
      const pronouns = detectPronouns(text);
      const hePronoun = pronouns.find((p) => p.pronoun === 'he');
      expect(hePronoun?.sentenceIndex).toBe(1);
    });

    it('should detect possessive pronouns', () => {
      const text = 'John found his keys.';
      const pronouns = detectPronouns(text);
      const hisPronoun = pronouns.find((p) => p.pronoun === 'his');
      expect(hisPronoun).toBeDefined();
      expect(hisPronoun?.type).toBe('possessive');
    });
  });

  describe('detectGenderFromName', () => {
    it('should detect male names', () => {
      expect(detectGenderFromName('John')).toBe('masculine');
      expect(detectGenderFromName('Michael')).toBe('masculine');
      expect(detectGenderFromName('James Smith')).toBe('masculine');
    });

    it('should detect female names', () => {
      expect(detectGenderFromName('Mary')).toBe('feminine');
      expect(detectGenderFromName('Jennifer')).toBe('feminine');
      expect(detectGenderFromName('Sarah Johnson')).toBe('feminine');
    });

    it('should detect gender from titles', () => {
      expect(detectGenderFromName('Mr. Smith')).toBe('masculine');
      expect(detectGenderFromName('Mrs. Johnson')).toBe('feminine');
      expect(detectGenderFromName('Ms. Williams')).toBe('feminine');
    });

    it('should return neutral for unknown names', () => {
      expect(detectGenderFromName('Acme Corporation')).toBe('neutral');
      expect(detectGenderFromName('XYZ Company')).toBe('neutral');
    });
  });

  describe('detectEntityType', () => {
    it('should detect organizations', () => {
      expect(detectEntityType('Acme Inc')).toBe('organization');
      expect(detectEntityType('ABC Corp')).toBe('organization');
      expect(detectEntityType('XYZ LLC')).toBe('organization');
    });

    it('should detect person from role context', () => {
      expect(detectEntityType('CEO John')).toBe('person');
      expect(detectEntityType('Founder Mary')).toBe('person');
    });

    it('should detect person from proper name', () => {
      expect(detectEntityType('John Smith')).toBe('person');
      expect(detectEntityType('Mary Johnson')).toBe('person');
    });
  });

  describe('detectEntities', () => {
    it('should detect named entities', () => {
      const text = 'John Smith works at Acme Corporation.';
      const entities = detectEntities(text);
      expect(entities.length).toBeGreaterThanOrEqual(2);
    });

    it('should detect multi-word entities', () => {
      const text = 'New York City is beautiful.';
      const entities = detectEntities(text);
      const nyc = entities.find((e) => e.text === 'New York City');
      expect(nyc).toBeDefined();
    });

    it('should track sentence index for entities', () => {
      const text = 'John is here. Mary arrived later.';
      const entities = detectEntities(text);
      const mary = entities.find((e) => e.text === 'Mary');
      expect(mary?.sentenceIndex).toBe(1);
    });
  });

  describe('areCompatible', () => {
    it('should match masculine pronouns with masculine entities', () => {
      const pronoun = {
        pronoun: 'he',
        type: 'personal' as const,
        gender: 'masculine' as const,
        person: 'third' as const,
        position: 20,
        sentenceIndex: 1,
      };
      const entity = {
        text: 'John',
        type: 'person' as const,
        position: 0,
        sentenceIndex: 0,
        gender: 'masculine' as const,
      };
      expect(areCompatible(pronoun, entity)).toBe(true);
    });

    it('should not match masculine pronoun with feminine entity', () => {
      const pronoun = {
        pronoun: 'he',
        type: 'personal' as const,
        gender: 'masculine' as const,
        person: 'third' as const,
        position: 20,
        sentenceIndex: 1,
      };
      const entity = {
        text: 'Mary',
        type: 'person' as const,
        position: 0,
        sentenceIndex: 0,
        gender: 'feminine' as const,
      };
      expect(areCompatible(pronoun, entity)).toBe(false);
    });

    it('should not match "it" with person entity', () => {
      const pronoun = {
        pronoun: 'it',
        type: 'personal' as const,
        gender: 'neutral' as const,
        person: 'third' as const,
        position: 20,
        sentenceIndex: 1,
      };
      const entity = {
        text: 'John',
        type: 'person' as const,
        position: 0,
        sentenceIndex: 0,
        gender: 'masculine' as const,
      };
      expect(areCompatible(pronoun, entity)).toBe(false);
    });

    it('should match plural pronoun with organization', () => {
      const pronoun = {
        pronoun: 'they',
        type: 'personal' as const,
        gender: 'plural' as const,
        person: 'third' as const,
        position: 30,
        sentenceIndex: 1,
      };
      const entity = {
        text: 'Acme Inc',
        type: 'organization' as const,
        position: 0,
        sentenceIndex: 0,
        gender: 'neutral' as const,
      };
      expect(areCompatible(pronoun, entity)).toBe(true);
    });
  });

  describe('calculateConfidence', () => {
    it('should return high confidence for close matches', () => {
      const pronoun = {
        pronoun: 'he',
        type: 'personal' as const,
        gender: 'masculine' as const,
        person: 'third' as const,
        position: 20,
        sentenceIndex: 1,
      };
      const entity = {
        text: 'John',
        type: 'person' as const,
        position: 0,
        sentenceIndex: 0,
        gender: 'masculine' as const,
      };
      const confidence = calculateConfidence(pronoun, entity, 1);
      expect(confidence).toBeGreaterThan(0.8);
    });

    it('should penalize distance', () => {
      const pronoun = {
        pronoun: 'he',
        type: 'personal' as const,
        gender: 'masculine' as const,
        person: 'third' as const,
        position: 200,
        sentenceIndex: 5,
      };
      const entity = {
        text: 'John',
        type: 'person' as const,
        position: 0,
        sentenceIndex: 0,
        gender: 'masculine' as const,
      };
      const nearConfidence = calculateConfidence(pronoun, entity, 1);
      const farConfidence = calculateConfidence(pronoun, entity, 4);
      expect(nearConfidence).toBeGreaterThan(farConfidence);
    });
  });

  describe('resolveCoreferences', () => {
    it('should resolve simple coreference', () => {
      const text = 'John went to the store. He bought some milk.';
      const result = resolveCoreferences(text);
      expect(result.links.length).toBeGreaterThanOrEqual(1);
      const heLink = result.links.find((l) => l.pronoun.pronoun === 'he');
      expect(heLink?.antecedent.text).toBe('John');
    });

    it('should resolve multiple coreferences', () => {
      const text = 'Mary is a doctor. She works at the hospital. John is her patient. He visits every week.';
      const result = resolveCoreferences(text);
      expect(result.links.length).toBeGreaterThanOrEqual(2);
    });

    it('should create coreference chains', () => {
      const text = 'John is a developer. He loves coding. He works on open source.';
      const result = resolveCoreferences(text);
      expect(result.chains.length).toBeGreaterThanOrEqual(1);
      const johnChain = result.chains.find((c) => c.headEntity.text === 'John');
      expect(johnChain?.mentions.length).toBeGreaterThanOrEqual(2);
    });

    it('should track unresolved pronouns', () => {
      const text = 'He was confused.'; // No antecedent available
      const result = resolveCoreferences(text);
      expect(result.unresolvedPronouns.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('expandPronouns', () => {
    it('should expand pronouns to antecedents', () => {
      const text = 'John is here. He is happy.';
      const expanded = expandPronouns(text);
      expect(expanded).toContain('John');
      expect(expanded.match(/John/g)?.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle possessive pronouns', () => {
      const text = 'John has a car. His car is blue.';
      const expanded = expandPronouns(text);
      // Should contain John's
      expect(expanded).toContain("John's");
    });
  });

  describe('getMentionsForEntity', () => {
    it('should return all mentions of an entity', () => {
      const text = 'John is a developer. He loves coding.';
      const result = resolveCoreferences(text);
      const mentions = getMentionsForEntity('John', result);
      expect(mentions.length).toBeGreaterThanOrEqual(2);
    });

    it('should return empty array for unknown entity', () => {
      const text = 'John is here.';
      const result = resolveCoreferences(text);
      const mentions = getMentionsForEntity('Unknown', result);
      expect(mentions).toEqual([]);
    });
  });

  describe('countEntityReferences', () => {
    it('should count all references including pronouns', () => {
      const text = 'John is here. He is happy. He left.';
      const result = resolveCoreferences(text);
      const count = countEntityReferences('John', result);
      expect(count).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getCoreferenceStats', () => {
    it('should return correct statistics', () => {
      const text = 'John is a developer. He loves coding. Mary is an engineer. She builds things.';
      const result = resolveCoreferences(text);
      const stats = getCoreferenceStats(result);

      expect(stats.totalPronouns).toBeGreaterThanOrEqual(2);
      expect(stats.totalEntities).toBeGreaterThanOrEqual(2);
      expect(stats.resolutionRate).toBeGreaterThan(0);
    });

    it('should handle empty text', () => {
      const result = resolveCoreferences('');
      const stats = getCoreferenceStats(result);
      expect(stats.totalPronouns).toBe(0);
      expect(stats.resolutionRate).toBe(0);
    });
  });

  describe('Pronoun Constants', () => {
    it('should have all personal pronouns', () => {
      expect(Object.keys(PERSONAL_PRONOUNS)).toContain('he');
      expect(Object.keys(PERSONAL_PRONOUNS)).toContain('she');
      expect(Object.keys(PERSONAL_PRONOUNS)).toContain('they');
      expect(Object.keys(PERSONAL_PRONOUNS)).toContain('it');
    });

    it('should have all possessive pronouns', () => {
      expect(Object.keys(POSSESSIVE_PRONOUNS)).toContain('his');
      expect(Object.keys(POSSESSIVE_PRONOUNS)).toContain('her');
      expect(Object.keys(POSSESSIVE_PRONOUNS)).toContain('their');
    });

    it('should have all reflexive pronouns', () => {
      expect(Object.keys(REFLEXIVE_PRONOUNS)).toContain('himself');
      expect(Object.keys(REFLEXIVE_PRONOUNS)).toContain('herself');
      expect(Object.keys(REFLEXIVE_PRONOUNS)).toContain('themselves');
    });

    it('should have all demonstrative pronouns', () => {
      expect(Object.keys(DEMONSTRATIVE_PRONOUNS)).toContain('this');
      expect(Object.keys(DEMONSTRATIVE_PRONOUNS)).toContain('that');
      expect(Object.keys(DEMONSTRATIVE_PRONOUNS)).toContain('these');
      expect(Object.keys(DEMONSTRATIVE_PRONOUNS)).toContain('those');
    });

    it('should have all relative pronouns', () => {
      expect(Object.keys(RELATIVE_PRONOUNS)).toContain('who');
      expect(Object.keys(RELATIVE_PRONOUNS)).toContain('which');
      expect(Object.keys(RELATIVE_PRONOUNS)).toContain('whom');
    });
  });
});
