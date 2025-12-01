/**
 * Ontology Versioning System
 * Phase 4, Week 8 - Principal Ontologist Checklist
 *
 * Implements versioning, deprecation tracking, and migration support
 * for ontology terms, schemas, and APIs.
 */

// ================================================================
// Types
// ================================================================

export type VersionStatus = 'draft' | 'active' | 'deprecated' | 'removed';

export interface SemanticVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
}

export interface ChangelogEntry {
  version: string;
  date: Date;
  type: 'created' | 'modified' | 'deprecated' | 'removed' | 'security';
  description: string;
  author: string;
  breakingChange: boolean;
}

export interface DeprecationInfo {
  deprecatedAt: Date;
  reason: string;
  replacedBy?: string;
  sunsetDate: Date;
  migrationGuide?: string;
}

export interface VersionedEntity {
  id: string;
  version: string;
  status: VersionStatus;
  createdAt: Date;
  updatedAt: Date;
  deprecation?: DeprecationInfo;
  changelog: ChangelogEntry[];
}

export interface GlossaryTerm extends VersionedEntity {
  term: string;
  definition: string;
  category: string;
  synonyms: string[];
  relatedTerms: string[];
  examples: string[];
}

export interface TaxonomyNode extends VersionedEntity {
  code: string;
  name: string;
  description: string;
  parent?: string;
  children: string[];
  mergedInto?: string;
  splitInto?: string[];
}

export interface SchemaField {
  name: string;
  type: string;
  required: boolean;
  deprecated?: boolean;
  deprecationMessage?: string;
  addedInVersion: string;
  removedInVersion?: string;
}

export interface VersionedSchema extends VersionedEntity {
  name: string;
  description: string;
  fields: SchemaField[];
}

// ================================================================
// Version Parsing and Comparison
// ================================================================

export function parseVersion(version: string): SemanticVersion {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
  if (!match) {
    throw new Error(`Invalid version format: ${version}`);
  }

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4],
  };
}

export function formatVersion(version: SemanticVersion): string {
  const base = `${version.major}.${version.minor}.${version.patch}`;
  return version.prerelease ? `${base}-${version.prerelease}` : base;
}

export function compareVersions(a: string, b: string): number {
  const vA = parseVersion(a);
  const vB = parseVersion(b);

  if (vA.major !== vB.major) return vA.major - vB.major;
  if (vA.minor !== vB.minor) return vA.minor - vB.minor;
  if (vA.patch !== vB.patch) return vA.patch - vB.patch;

  // Prerelease versions are lower than release versions
  if (vA.prerelease && !vB.prerelease) return -1;
  if (!vA.prerelease && vB.prerelease) return 1;
  if (vA.prerelease && vB.prerelease) {
    return vA.prerelease.localeCompare(vB.prerelease);
  }

  return 0;
}

export function isCompatible(required: string, actual: string): boolean {
  const vRequired = parseVersion(required);
  const vActual = parseVersion(actual);

  // Same major version, actual >= required
  return vActual.major === vRequired.major && compareVersions(actual, required) >= 0;
}

export function incrementVersion(
  current: string,
  type: 'major' | 'minor' | 'patch'
): string {
  const version = parseVersion(current);

  switch (type) {
    case 'major':
      return formatVersion({ ...version, major: version.major + 1, minor: 0, patch: 0 });
    case 'minor':
      return formatVersion({ ...version, minor: version.minor + 1, patch: 0 });
    case 'patch':
      return formatVersion({ ...version, patch: version.patch + 1 });
  }
}

// ================================================================
// Deprecation Management
// ================================================================

export function isDeprecated(entity: VersionedEntity): boolean {
  return entity.status === 'deprecated' || entity.deprecation !== undefined;
}

export function isPastSunset(entity: VersionedEntity): boolean {
  if (!entity.deprecation) return false;
  return new Date() > entity.deprecation.sunsetDate;
}

export function getDaysUntilSunset(entity: VersionedEntity): number | null {
  if (!entity.deprecation) return null;
  const now = new Date();
  const sunset = entity.deprecation.sunsetDate;
  const diffMs = sunset.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function createDeprecation(
  reason: string,
  options: {
    replacedBy?: string;
    sunsetMonths?: number;
    migrationGuide?: string;
  } = {}
): DeprecationInfo {
  const sunsetDate = new Date();
  sunsetDate.setMonth(sunsetDate.getMonth() + (options.sunsetMonths || 12));

  return {
    deprecatedAt: new Date(),
    reason,
    replacedBy: options.replacedBy,
    sunsetDate,
    migrationGuide: options.migrationGuide,
  };
}

// ================================================================
// Changelog Management
// ================================================================

export function addChangelogEntry(
  entity: VersionedEntity,
  entry: Omit<ChangelogEntry, 'date'>
): VersionedEntity {
  return {
    ...entity,
    changelog: [
      ...entity.changelog,
      { ...entry, date: new Date() },
    ],
  };
}

export function getRecentChanges(
  entity: VersionedEntity,
  count: number = 5
): ChangelogEntry[] {
  return entity.changelog
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, count);
}

export function getBreakingChanges(entity: VersionedEntity): ChangelogEntry[] {
  return entity.changelog.filter((entry) => entry.breakingChange);
}

export function formatChangelog(entity: VersionedEntity): string {
  const grouped = entity.changelog.reduce(
    (acc, entry) => {
      if (!acc[entry.version]) {
        acc[entry.version] = [];
      }
      acc[entry.version].push(entry);
      return acc;
    },
    {} as Record<string, ChangelogEntry[]>
  );

  const versions = Object.keys(grouped).sort((a, b) => compareVersions(b, a));

  return versions
    .map((version) => {
      const entries = grouped[version];
      const date = entries[0]?.date.toISOString().split('T')[0];
      const changes = entries
        .map((e) => `- ${e.type.toUpperCase()}: ${e.description}`)
        .join('\n');

      return `## [${version}] - ${date}\n\n${changes}`;
    })
    .join('\n\n');
}

// ================================================================
// Schema Migration
// ================================================================

export interface MigrationStep {
  from: string;
  to: string;
  up: (data: any) => any;
  down: (data: any) => any;
  description: string;
}

export class SchemaMigrator {
  private migrations: Map<string, MigrationStep> = new Map();

  register(step: MigrationStep): void {
    const key = `${step.from}->${step.to}`;
    this.migrations.set(key, step);
  }

  migrate(data: any, fromVersion: string, toVersion: string): any {
    if (compareVersions(fromVersion, toVersion) === 0) {
      return data;
    }

    const isUpgrade = compareVersions(fromVersion, toVersion) < 0;
    const path = this.findMigrationPath(fromVersion, toVersion, isUpgrade);

    if (!path) {
      throw new Error(`No migration path from ${fromVersion} to ${toVersion}`);
    }

    let result = data;
    for (const step of path) {
      result = isUpgrade ? step.up(result) : step.down(result);
    }

    return result;
  }

  private findMigrationPath(
    from: string,
    to: string,
    isUpgrade: boolean
  ): MigrationStep[] | null {
    const path: MigrationStep[] = [];
    let current = from;

    // Simple linear path finding (could be improved with graph algorithms)
    while (compareVersions(current, to) !== 0) {
      const nextStep = Array.from(this.migrations.values()).find((step) => {
        if (isUpgrade) {
          return step.from === current && compareVersions(step.to, to) <= 0;
        } else {
          return step.to === current && compareVersions(step.from, to) >= 0;
        }
      });

      if (!nextStep) break;

      path.push(nextStep);
      current = isUpgrade ? nextStep.to : nextStep.from;
    }

    return compareVersions(current, to) === 0 ? path : null;
  }
}

// ================================================================
// Deprecation Headers
// ================================================================

export interface DeprecationHeaders {
  'Deprecation': string;
  'Sunset'?: string;
  'Link'?: string;
}

export function getDeprecationHeaders(
  entity: VersionedEntity
): DeprecationHeaders | null {
  if (!entity.deprecation) return null;

  const headers: DeprecationHeaders = {
    'Deprecation': 'true',
  };

  if (entity.deprecation.sunsetDate) {
    headers['Sunset'] = entity.deprecation.sunsetDate.toUTCString();
  }

  if (entity.deprecation.migrationGuide) {
    headers['Link'] = `<${entity.deprecation.migrationGuide}>; rel="successor-version"`;
  }

  return headers;
}

// ================================================================
// Version Registry
// ================================================================

export class VersionRegistry<T extends VersionedEntity> {
  private entities: Map<string, Map<string, T>> = new Map();

  register(entity: T): void {
    const versions = this.entities.get(entity.id) || new Map();
    versions.set(entity.version, entity);
    this.entities.set(entity.id, versions);
  }

  get(id: string, version?: string): T | undefined {
    const versions = this.entities.get(id);
    if (!versions) return undefined;

    if (version) {
      return versions.get(version);
    }

    // Return latest active version
    return this.getLatestActive(id);
  }

  getLatestActive(id: string): T | undefined {
    const versions = this.entities.get(id);
    if (!versions) return undefined;

    const active = Array.from(versions.values())
      .filter((e) => e.status === 'active')
      .sort((a, b) => compareVersions(b.version, a.version));

    return active[0];
  }

  getAllVersions(id: string): T[] {
    const versions = this.entities.get(id);
    if (!versions) return [];

    return Array.from(versions.values()).sort((a, b) =>
      compareVersions(b.version, a.version)
    );
  }

  getDeprecated(): T[] {
    const deprecated: T[] = [];
    this.entities.forEach((versions) => {
      versions.forEach((entity) => {
        if (isDeprecated(entity)) {
          deprecated.push(entity);
        }
      });
    });
    return deprecated;
  }

  getUpcomingSunsets(days: number = 30): T[] {
    return this.getDeprecated().filter((entity) => {
      const daysUntil = getDaysUntilSunset(entity);
      return daysUntil !== null && daysUntil > 0 && daysUntil <= days;
    });
  }
}

// ================================================================
// Export Utilities
// ================================================================

export const ontologyVersion = '1.0.0';
export const schemaVersion = '2024.11.1';
export const apiVersion = 'v1';

export function getVersionInfo() {
  return {
    ontology: ontologyVersion,
    schema: schemaVersion,
    api: apiVersion,
    buildDate: new Date().toISOString(),
  };
}
