/**
 * Ontology Versioning Tests
 * Phase 4, Week 8 - Principal Ontologist Checklist
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseVersion,
  formatVersion,
  compareVersions,
  isCompatible,
  incrementVersion,
  isDeprecated,
  isPastSunset,
  getDaysUntilSunset,
  createDeprecation,
  addChangelogEntry,
  getRecentChanges,
  getBreakingChanges,
  formatChangelog,
  SchemaMigrator,
  getDeprecationHeaders,
  VersionRegistry,
  type VersionedEntity,
  type SemanticVersion,
} from './versioning';

describe('Version Parsing', () => {
  describe('parseVersion', () => {
    it('should parse standard version', () => {
      const version = parseVersion('1.2.3');
      expect(version).toEqual({ major: 1, minor: 2, patch: 3 });
    });

    it('should parse version with prerelease', () => {
      const version = parseVersion('1.2.3-beta.1');
      expect(version).toEqual({ major: 1, minor: 2, patch: 3, prerelease: 'beta.1' });
    });

    it('should throw on invalid version', () => {
      expect(() => parseVersion('invalid')).toThrow();
      expect(() => parseVersion('1.2')).toThrow();
      expect(() => parseVersion('v1.2.3')).toThrow();
    });
  });

  describe('formatVersion', () => {
    it('should format standard version', () => {
      const version: SemanticVersion = { major: 1, minor: 2, patch: 3 };
      expect(formatVersion(version)).toBe('1.2.3');
    });

    it('should format version with prerelease', () => {
      const version: SemanticVersion = { major: 1, minor: 2, patch: 3, prerelease: 'alpha' };
      expect(formatVersion(version)).toBe('1.2.3-alpha');
    });
  });
});

describe('Version Comparison', () => {
  describe('compareVersions', () => {
    it('should compare major versions', () => {
      expect(compareVersions('2.0.0', '1.0.0')).toBeGreaterThan(0);
      expect(compareVersions('1.0.0', '2.0.0')).toBeLessThan(0);
    });

    it('should compare minor versions', () => {
      expect(compareVersions('1.2.0', '1.1.0')).toBeGreaterThan(0);
      expect(compareVersions('1.1.0', '1.2.0')).toBeLessThan(0);
    });

    it('should compare patch versions', () => {
      expect(compareVersions('1.0.2', '1.0.1')).toBeGreaterThan(0);
      expect(compareVersions('1.0.1', '1.0.2')).toBeLessThan(0);
    });

    it('should return 0 for equal versions', () => {
      expect(compareVersions('1.2.3', '1.2.3')).toBe(0);
    });

    it('should rank prerelease lower than release', () => {
      expect(compareVersions('1.0.0-beta', '1.0.0')).toBeLessThan(0);
      expect(compareVersions('1.0.0', '1.0.0-beta')).toBeGreaterThan(0);
    });
  });

  describe('isCompatible', () => {
    it('should return true for compatible versions', () => {
      expect(isCompatible('1.0.0', '1.2.3')).toBe(true);
      expect(isCompatible('1.2.0', '1.2.3')).toBe(true);
    });

    it('should return false for incompatible versions', () => {
      expect(isCompatible('1.0.0', '2.0.0')).toBe(false);
      expect(isCompatible('1.2.3', '1.2.2')).toBe(false);
    });
  });
});

describe('Version Incrementing', () => {
  it('should increment major version', () => {
    expect(incrementVersion('1.2.3', 'major')).toBe('2.0.0');
  });

  it('should increment minor version', () => {
    expect(incrementVersion('1.2.3', 'minor')).toBe('1.3.0');
  });

  it('should increment patch version', () => {
    expect(incrementVersion('1.2.3', 'patch')).toBe('1.2.4');
  });
});

describe('Deprecation', () => {
  const createTestEntity = (options: Partial<VersionedEntity> = {}): VersionedEntity => ({
    id: 'test-entity',
    version: '1.0.0',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    changelog: [],
    ...options,
  });

  describe('isDeprecated', () => {
    it('should return true for deprecated status', () => {
      const entity = createTestEntity({ status: 'deprecated' });
      expect(isDeprecated(entity)).toBe(true);
    });

    it('should return true when deprecation info exists', () => {
      const entity = createTestEntity({
        deprecation: createDeprecation('Test reason'),
      });
      expect(isDeprecated(entity)).toBe(true);
    });

    it('should return false for active entities', () => {
      const entity = createTestEntity();
      expect(isDeprecated(entity)).toBe(false);
    });
  });

  describe('isPastSunset', () => {
    it('should return true for past sunset date', () => {
      const pastDate = new Date();
      pastDate.setMonth(pastDate.getMonth() - 1);
      const entity = createTestEntity({
        deprecation: {
          deprecatedAt: new Date(),
          reason: 'Test',
          sunsetDate: pastDate,
        },
      });
      expect(isPastSunset(entity)).toBe(true);
    });

    it('should return false for future sunset date', () => {
      const entity = createTestEntity({
        deprecation: createDeprecation('Test'),
      });
      expect(isPastSunset(entity)).toBe(false);
    });
  });

  describe('getDaysUntilSunset', () => {
    it('should return positive days for future sunset', () => {
      const entity = createTestEntity({
        deprecation: createDeprecation('Test', { sunsetMonths: 1 }),
      });
      const days = getDaysUntilSunset(entity);
      expect(days).toBeGreaterThan(20);
    });

    it('should return negative days for past sunset', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      const entity = createTestEntity({
        deprecation: {
          deprecatedAt: new Date(),
          reason: 'Test',
          sunsetDate: pastDate,
        },
      });
      const days = getDaysUntilSunset(entity);
      expect(days).toBeLessThan(0);
    });

    it('should return null for non-deprecated entities', () => {
      const entity = createTestEntity();
      expect(getDaysUntilSunset(entity)).toBeNull();
    });
  });

  describe('createDeprecation', () => {
    it('should create deprecation with defaults', () => {
      const deprecation = createDeprecation('Test reason');
      expect(deprecation.reason).toBe('Test reason');
      expect(deprecation.deprecatedAt).toBeInstanceOf(Date);
      expect(deprecation.sunsetDate).toBeInstanceOf(Date);
    });

    it('should create deprecation with replacement', () => {
      const deprecation = createDeprecation('Test', { replacedBy: 'new-entity' });
      expect(deprecation.replacedBy).toBe('new-entity');
    });

    it('should respect custom sunset months', () => {
      const deprecation = createDeprecation('Test', { sunsetMonths: 6 });
      const monthsDiff =
        (deprecation.sunsetDate.getTime() - deprecation.deprecatedAt.getTime()) /
        (1000 * 60 * 60 * 24 * 30);
      expect(Math.round(monthsDiff)).toBeCloseTo(6, 0);
    });
  });
});

describe('Changelog', () => {
  const createTestEntity = (): VersionedEntity => ({
    id: 'test-entity',
    version: '1.0.0',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    changelog: [
      {
        version: '1.0.0',
        date: new Date('2024-01-01'),
        type: 'created',
        description: 'Initial version',
        author: 'test',
        breakingChange: false,
      },
      {
        version: '1.1.0',
        date: new Date('2024-02-01'),
        type: 'modified',
        description: 'Added feature',
        author: 'test',
        breakingChange: false,
      },
      {
        version: '2.0.0',
        date: new Date('2024-03-01'),
        type: 'modified',
        description: 'Breaking change',
        author: 'test',
        breakingChange: true,
      },
    ],
  });

  describe('addChangelogEntry', () => {
    it('should add entry to changelog', () => {
      const entity = createTestEntity();
      const updated = addChangelogEntry(entity, {
        version: '2.1.0',
        type: 'modified',
        description: 'New feature',
        author: 'test',
        breakingChange: false,
      });
      expect(updated.changelog.length).toBe(4);
    });
  });

  describe('getRecentChanges', () => {
    it('should return recent changes sorted by date', () => {
      const entity = createTestEntity();
      const recent = getRecentChanges(entity, 2);
      expect(recent.length).toBe(2);
      expect(recent[0].version).toBe('2.0.0');
    });
  });

  describe('getBreakingChanges', () => {
    it('should return only breaking changes', () => {
      const entity = createTestEntity();
      const breaking = getBreakingChanges(entity);
      expect(breaking.length).toBe(1);
      expect(breaking[0].version).toBe('2.0.0');
    });
  });

  describe('formatChangelog', () => {
    it('should format changelog as markdown', () => {
      const entity = createTestEntity();
      const formatted = formatChangelog(entity);
      expect(formatted).toContain('## [2.0.0]');
      expect(formatted).toContain('## [1.1.0]');
      expect(formatted).toContain('## [1.0.0]');
    });
  });
});

describe('SchemaMigrator', () => {
  let migrator: SchemaMigrator;

  beforeEach(() => {
    migrator = new SchemaMigrator();
    migrator.register({
      from: '1.0.0',
      to: '1.1.0',
      description: 'Add field',
      up: (data) => ({ ...data, newField: 'default' }),
      down: (data) => {
        const { newField, ...rest } = data;
        return rest;
      },
    });
    migrator.register({
      from: '1.1.0',
      to: '2.0.0',
      description: 'Rename field',
      up: (data) => ({ ...data, renamedField: data.oldField, oldField: undefined }),
      down: (data) => ({ ...data, oldField: data.renamedField, renamedField: undefined }),
    });
  });

  it('should migrate forward', () => {
    const data = { oldField: 'value' };
    const migrated = migrator.migrate(data, '1.0.0', '1.1.0');
    expect(migrated.newField).toBe('default');
  });

  it('should migrate multiple versions', () => {
    const data = { oldField: 'value' };
    const migrated = migrator.migrate(data, '1.0.0', '2.0.0');
    expect(migrated.newField).toBe('default');
    expect(migrated.renamedField).toBe('value');
  });

  it('should return same data for same version', () => {
    const data = { field: 'value' };
    const result = migrator.migrate(data, '1.0.0', '1.0.0');
    expect(result).toEqual(data);
  });
});

describe('Deprecation Headers', () => {
  const createTestEntity = (options: Partial<VersionedEntity> = {}): VersionedEntity => ({
    id: 'test',
    version: '1.0.0',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    changelog: [],
    ...options,
  });

  it('should return null for non-deprecated entity', () => {
    const entity = createTestEntity();
    expect(getDeprecationHeaders(entity)).toBeNull();
  });

  it('should return headers for deprecated entity', () => {
    const entity = createTestEntity({
      deprecation: createDeprecation('Test', {
        migrationGuide: '/docs/migration',
      }),
    });
    const headers = getDeprecationHeaders(entity);
    expect(headers).not.toBeNull();
    expect(headers!['Deprecation']).toBe('true');
    expect(headers!['Sunset']).toBeDefined();
    expect(headers!['Link']).toContain('/docs/migration');
  });
});

describe('VersionRegistry', () => {
  let registry: VersionRegistry<VersionedEntity>;

  const createEntity = (
    id: string,
    version: string,
    status: VersionedEntity['status'] = 'active'
  ): VersionedEntity => ({
    id,
    version,
    status,
    createdAt: new Date(),
    updatedAt: new Date(),
    changelog: [],
  });

  beforeEach(() => {
    registry = new VersionRegistry();
  });

  it('should register and retrieve entity', () => {
    const entity = createEntity('test', '1.0.0');
    registry.register(entity);
    expect(registry.get('test')).toEqual(entity);
  });

  it('should get specific version', () => {
    registry.register(createEntity('test', '1.0.0'));
    registry.register(createEntity('test', '1.1.0'));
    registry.register(createEntity('test', '2.0.0'));

    const v1 = registry.get('test', '1.0.0');
    expect(v1?.version).toBe('1.0.0');
  });

  it('should get latest active version', () => {
    registry.register(createEntity('test', '1.0.0'));
    registry.register(createEntity('test', '2.0.0', 'deprecated'));
    registry.register(createEntity('test', '1.5.0'));

    const latest = registry.getLatestActive('test');
    expect(latest?.version).toBe('1.5.0');
  });

  it('should get all versions sorted', () => {
    registry.register(createEntity('test', '1.0.0'));
    registry.register(createEntity('test', '2.0.0'));
    registry.register(createEntity('test', '1.5.0'));

    const versions = registry.getAllVersions('test');
    expect(versions.map((v) => v.version)).toEqual(['2.0.0', '1.5.0', '1.0.0']);
  });

  it('should get deprecated entities', () => {
    registry.register(createEntity('test1', '1.0.0'));
    registry.register(createEntity('test2', '1.0.0', 'deprecated'));
    registry.register(createEntity('test3', '1.0.0', 'deprecated'));

    const deprecated = registry.getDeprecated();
    expect(deprecated.length).toBe(2);
  });

  it('should get upcoming sunsets', () => {
    const entity = createEntity('test', '1.0.0', 'deprecated');
    entity.deprecation = createDeprecation('Test', { sunsetMonths: 1 });
    registry.register(entity);

    const upcoming = registry.getUpcomingSunsets(60);
    expect(upcoming.length).toBe(1);
  });
});
