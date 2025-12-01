# Ontology Versioning and Deprecation Policy

Phase 4, Week 8 - Principal Ontologist Checklist

## Overview

This document establishes the versioning strategy and deprecation policy for the AI Perception Engineering platform's domain ontology, including terms, relationships, scoring models, and API schemas.

## Semantic Versioning

We follow Semantic Versioning (SemVer) for ontology changes:

```
MAJOR.MINOR.PATCH
```

### Version Components

| Component | When to Increment | Example |
|-----------|------------------|---------|
| **MAJOR** | Breaking changes to core concepts | Renaming fundamental terms |
| **MINOR** | New features, backward-compatible | Adding new relationship types |
| **PATCH** | Bug fixes, clarifications | Fixing typos in descriptions |

### Current Version

```
Ontology Version: 1.0.0
Schema Version: 2024.11.1
API Version: v1
```

## Deprecation Policy

### Deprecation Timeline

| Phase | Duration | Actions |
|-------|----------|---------|
| **Announcement** | T+0 | Deprecation notice published |
| **Warning** | 3 months | API returns deprecation headers |
| **Migration** | 6 months | Both old and new supported |
| **Removal** | 12 months | Old version discontinued |

### Deprecation Notices

Deprecated elements will be marked with:

```typescript
/**
 * @deprecated since v1.2.0 - Use `brandScore` instead
 * @removal v2.0.0
 * @migration See /docs/migration/perception-to-brand-score.md
 */
interface PerceptionScore {
  // ...
}
```

### API Deprecation Headers

Deprecated endpoints return headers:

```http
Deprecation: true
Sunset: Sat, 01 Jun 2025 00:00:00 GMT
Link: </docs/migration/v2>; rel="successor-version"
```

## Term Lifecycle

### States

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌──────────┐    ┌──────────┐    ┌────────────┐    ┌──────┐│
│  │  Draft   │───>│  Active  │───>│ Deprecated │───>│Removed││
│  └──────────┘    └──────────┘    └────────────┘    └──────┘│
│       │               │                                     │
│       └───────────────┴──── Can revert to Draft ───────────│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### State Definitions

| State | Description | Visibility |
|-------|-------------|------------|
| **Draft** | Under development | Internal only |
| **Active** | Production use | Public |
| **Deprecated** | Scheduled for removal | Public with warning |
| **Removed** | No longer available | Hidden |

## Change Categories

### Breaking Changes (Major)

Require MAJOR version bump:

- Renaming core domain concepts
- Removing mandatory fields
- Changing field types incompatibly
- Removing API endpoints
- Changing scoring algorithms significantly

### Non-Breaking Changes (Minor)

Require MINOR version bump:

- Adding new optional fields
- Adding new relationships
- Adding new API endpoints
- Expanding enums
- Adding new scoring dimensions

### Patch Changes

Require PATCH version bump:

- Fixing descriptions/documentation
- Correcting typos
- Clarifying existing definitions
- Performance improvements
- Bug fixes

## Schema Evolution

### Adding Fields

```typescript
// v1.0.0
interface BrandAnalysis {
  brandName: string;
  score: number;
}

// v1.1.0 - Added optional field (non-breaking)
interface BrandAnalysis {
  brandName: string;
  score: number;
  confidence?: number; // NEW
}
```

### Renaming Fields (Breaking)

```typescript
// v1.x.x
interface BrandAnalysis {
  perceptionScore: number; // Deprecated
}

// v2.0.0
interface BrandAnalysis {
  brandScore: number; // Renamed
}

// Migration period: both supported
interface BrandAnalysis {
  brandScore: number;
  /** @deprecated Use brandScore */
  perceptionScore?: number; // Computed from brandScore
}
```

### Removing Fields

Fields are never removed without deprecation period:

1. Mark as deprecated (v1.2.0)
2. Return warning in API responses
3. Remove in next major version (v2.0.0)

## Glossary Term Versioning

### Term Record Structure

```typescript
interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  version: string;
  status: 'draft' | 'active' | 'deprecated' | 'removed';
  deprecatedAt?: Date;
  deprecationReason?: string;
  replacedBy?: string; // ID of replacement term
  changelog: ChangelogEntry[];
}

interface ChangelogEntry {
  version: string;
  date: Date;
  type: 'created' | 'modified' | 'deprecated' | 'removed';
  description: string;
  author: string;
}
```

### Example Term Evolution

```json
{
  "id": "term-perception-score",
  "term": "Perception Score",
  "definition": "A quantitative measure of brand perception in AI systems.",
  "version": "1.2.0",
  "status": "deprecated",
  "deprecatedAt": "2025-01-15T00:00:00Z",
  "deprecationReason": "Replaced by more accurate Brand Score metric",
  "replacedBy": "term-brand-score",
  "changelog": [
    {
      "version": "1.0.0",
      "date": "2024-06-01",
      "type": "created",
      "description": "Initial definition",
      "author": "ontology-team"
    },
    {
      "version": "1.1.0",
      "date": "2024-09-01",
      "type": "modified",
      "description": "Added confidence interval to definition",
      "author": "ontology-team"
    },
    {
      "version": "1.2.0",
      "date": "2025-01-15",
      "type": "deprecated",
      "description": "Deprecated in favor of Brand Score",
      "author": "ontology-team"
    }
  ]
}
```

## Industry Taxonomy Versioning

### Taxonomy Structure

```typescript
interface TaxonomyNode {
  id: string;
  code: string;
  name: string;
  parent?: string;
  version: string;
  status: 'active' | 'deprecated' | 'merged' | 'split';
  mergedInto?: string;
  splitInto?: string[];
  effectiveDate: Date;
}
```

### Taxonomy Changes

| Change Type | Handling |
|-------------|----------|
| **Add Category** | Assign new code, no breaking change |
| **Rename Category** | Update name, keep code stable |
| **Merge Categories** | Mark old as 'merged', point to new |
| **Split Category** | Mark old as 'split', list new IDs |
| **Remove Category** | Deprecation period, then remove |

## Scoring Model Versioning

### Model Metadata

```typescript
interface ScoringModel {
  id: string;
  name: string;
  version: string;
  status: 'experimental' | 'active' | 'deprecated';
  trainedAt: Date;
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
  };
  changelog: ModelChange[];
}
```

### Model Transition

When updating scoring models:

1. Train new model as experimental
2. A/B test against production
3. Gradual rollout (10% → 50% → 100%)
4. Deprecate old model after full rollout
5. Remove after deprecation period

## API Versioning

### URL Versioning

```
/api/v1/analyze
/api/v2/analyze
```

### Header Versioning

```http
Accept: application/vnd.aiperception.v1+json
```

### Version Negotiation

```typescript
// API automatically uses latest stable version
const result = await api.analyze({ brand: 'Example' });

// Pin to specific version
const result = await api.v1.analyze({ brand: 'Example' });
```

## Migration Guidelines

### For API Consumers

1. Subscribe to deprecation announcements
2. Monitor `Deprecation` headers
3. Test against new versions in staging
4. Update before sunset date
5. Report issues during migration period

### For Internal Teams

1. Document all changes in changelog
2. Provide migration guides
3. Support both versions during transition
4. Monitor adoption of new versions
5. Remove old versions only after sunset

## Changelog Format

```markdown
## [1.2.0] - 2025-01-15

### Added
- New `confidence` field in analysis response
- Support for multi-brand analysis

### Changed
- Improved score calculation algorithm (+5% accuracy)

### Deprecated
- `perceptionScore` - Use `brandScore` instead

### Removed
- Nothing removed in this version

### Security
- No security changes
```

## Notification Channels

Deprecation and version announcements through:

1. **Email** - Registered API users
2. **Changelog** - Public changelog page
3. **API Headers** - Runtime warnings
4. **Dashboard** - Admin notifications
5. **Documentation** - Inline deprecation notes

## Compliance

This policy aligns with:

- **JSON:API** specification for API evolution
- **OpenAPI** deprecation annotations
- **Schema.org** versioning practices
- **W3C** content negotiation standards

## Review Schedule

This policy is reviewed:

- **Quarterly** - Minor adjustments
- **Annually** - Full review
- **As needed** - Urgent changes

---

**Last Updated:** November 2024
**Policy Version:** 1.0.0
**Next Review:** February 2025
