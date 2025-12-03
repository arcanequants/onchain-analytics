/**
 * SBOM Generator (CycloneDX Format)
 *
 * Phase 4, Week 8 Extended - Adversarial AI Security Checklist
 *
 * Features:
 * - Software Bill of Materials generation
 * - CycloneDX 1.5 format compliance
 * - Dependency vulnerability tracking
 * - License compliance checking
 */

// ============================================================================
// TYPES (CycloneDX 1.5 Specification)
// ============================================================================

export type ComponentType =
  | 'application'
  | 'framework'
  | 'library'
  | 'container'
  | 'platform'
  | 'device-driver'
  | 'machine-learning-model'
  | 'data'
  | 'file';

export type ComponentScope = 'required' | 'optional' | 'excluded';

export interface ExternalReference {
  type: 'vcs' | 'website' | 'documentation' | 'license' | 'issue-tracker' | 'other';
  url: string;
  comment?: string;
}

export interface License {
  id?: string;  // SPDX license ID
  name?: string;
  url?: string;
}

export interface Hash {
  alg: 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';
  content: string;
}

export interface Component {
  type: ComponentType;
  name: string;
  version: string;
  group?: string;
  description?: string;
  scope?: ComponentScope;
  licenses?: License[];
  hashes?: Hash[];
  purl?: string;  // Package URL
  externalReferences?: ExternalReference[];
  author?: string;
  publisher?: string;
}

export interface Vulnerability {
  id: string;
  source: {
    name: string;
    url?: string;
  };
  ratings?: Array<{
    score?: number;
    severity?: 'critical' | 'high' | 'medium' | 'low' | 'info' | 'none' | 'unknown';
    method?: string;
    vector?: string;
  }>;
  cwes?: number[];
  description?: string;
  recommendation?: string;
  advisories?: string[];
  affects?: Array<{
    ref: string;
    versions?: string[];
  }>;
}

export interface Tool {
  vendor?: string;
  name: string;
  version?: string;
}

export interface SBOM {
  bomFormat: 'CycloneDX';
  specVersion: '1.5';
  serialNumber: string;
  version: number;
  metadata: {
    timestamp: string;
    tools?: Tool[];
    authors?: Array<{ name: string; email?: string }>;
    component?: Component;
    manufacture?: { name: string; url?: string };
    supplier?: { name: string; url?: string };
  };
  components: Component[];
  dependencies?: Array<{
    ref: string;
    dependsOn?: string[];
  }>;
  vulnerabilities?: Vulnerability[];
}

// ============================================================================
// PACKAGE.JSON PARSING
// ============================================================================

interface PackageJson {
  name: string;
  version: string;
  description?: string;
  author?: string | { name: string; email?: string };
  license?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  repository?: string | { url: string };
}

interface PackageLock {
  packages?: Record<string, {
    version: string;
    resolved?: string;
    integrity?: string;
    license?: string;
    dependencies?: Record<string, string>;
  }>;
}

/**
 * Parse package.json to extract components
 */
export function parsePackageJson(
  packageJson: PackageJson,
  packageLock?: PackageLock
): { main: Component; dependencies: Component[] } {
  const main: Component = {
    type: 'application',
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description,
    licenses: packageJson.license ? [{ id: packageJson.license }] : undefined,
    author: typeof packageJson.author === 'string'
      ? packageJson.author
      : packageJson.author?.name,
  };

  if (packageJson.repository) {
    main.externalReferences = [{
      type: 'vcs',
      url: typeof packageJson.repository === 'string'
        ? packageJson.repository
        : packageJson.repository.url,
    }];
  }

  const dependencies: Component[] = [];
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  for (const [name, versionRange] of Object.entries(allDeps)) {
    const lockInfo = packageLock?.packages?.[`node_modules/${name}`];
    const version = lockInfo?.version || versionRange.replace(/^[\^~]/, '');

    const component: Component = {
      type: 'library',
      name,
      version,
      scope: packageJson.devDependencies?.[name] ? 'optional' : 'required',
      purl: `pkg:npm/${name}@${version}`,
    };

    if (lockInfo?.license) {
      component.licenses = [{ id: lockInfo.license }];
    }

    if (lockInfo?.integrity) {
      const [alg, hash] = lockInfo.integrity.split('-');
      if (alg && hash) {
        component.hashes = [{
          alg: alg.toUpperCase() as Hash['alg'],
          content: hash,
        }];
      }
    }

    dependencies.push(component);
  }

  return { main, dependencies };
}

// ============================================================================
// SBOM GENERATION
// ============================================================================

/**
 * Generate unique serial number
 */
function generateSerialNumber(): string {
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
  return `urn:uuid:${uuid}`;
}

/**
 * Generate SBOM from package.json
 */
export function generateSBOM(
  packageJson: PackageJson,
  packageLock?: PackageLock,
  options?: {
    includeDevDependencies?: boolean;
    toolName?: string;
    toolVersion?: string;
    authors?: Array<{ name: string; email?: string }>;
  }
): SBOM {
  const { main, dependencies } = parsePackageJson(packageJson, packageLock);

  // Filter out dev dependencies if not wanted
  const filteredDeps = options?.includeDevDependencies !== false
    ? dependencies
    : dependencies.filter(d => d.scope !== 'optional');

  const sbom: SBOM = {
    bomFormat: 'CycloneDX',
    specVersion: '1.5',
    serialNumber: generateSerialNumber(),
    version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
      tools: [{
        vendor: 'AI Perception',
        name: options?.toolName || 'sbom-generator',
        version: options?.toolVersion || '1.0.0',
      }],
      authors: options?.authors || [{ name: 'AI Perception Team' }],
      component: main,
    },
    components: filteredDeps,
    dependencies: buildDependencyTree(main, filteredDeps, packageLock),
  };

  return sbom;
}

/**
 * Build dependency tree
 */
function buildDependencyTree(
  main: Component,
  components: Component[],
  packageLock?: PackageLock
): Array<{ ref: string; dependsOn?: string[] }> {
  const deps: Array<{ ref: string; dependsOn?: string[] }> = [];

  // Main component dependencies
  deps.push({
    ref: `${main.name}@${main.version}`,
    dependsOn: components.map(c => `${c.name}@${c.version}`),
  });

  // Individual component dependencies
  if (packageLock?.packages) {
    for (const component of components) {
      const lockInfo = packageLock.packages[`node_modules/${component.name}`];
      if (lockInfo?.dependencies) {
        deps.push({
          ref: `${component.name}@${component.version}`,
          dependsOn: Object.entries(lockInfo.dependencies).map(([name, ver]) => {
            const depLock = packageLock.packages?.[`node_modules/${name}`];
            return `${name}@${depLock?.version || ver}`;
          }),
        });
      }
    }
  }

  return deps;
}

// ============================================================================
// VULNERABILITY CHECKING
// ============================================================================

interface VulnerabilityDatabase {
  [packageName: string]: Array<{
    id: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    affectedVersions: string;
    fixedIn?: string;
    description: string;
  }>;
}

// Mock vulnerability database - in production, use npm audit, OSV, or similar
const MOCK_VULN_DB: VulnerabilityDatabase = {
  'lodash': [
    {
      id: 'CVE-2021-23337',
      severity: 'high',
      affectedVersions: '<4.17.21',
      fixedIn: '4.17.21',
      description: 'Command Injection vulnerability',
    },
  ],
  'axios': [
    {
      id: 'CVE-2023-45857',
      severity: 'medium',
      affectedVersions: '<1.6.0',
      fixedIn: '1.6.0',
      description: 'Cross-Site Request Forgery (CSRF)',
    },
  ],
};

/**
 * Check for known vulnerabilities
 */
export function checkVulnerabilities(sbom: SBOM): Vulnerability[] {
  const vulnerabilities: Vulnerability[] = [];

  for (const component of sbom.components) {
    const knownVulns = MOCK_VULN_DB[component.name];
    if (!knownVulns) continue;

    for (const vuln of knownVulns) {
      // Simple version check (in production, use semver)
      vulnerabilities.push({
        id: vuln.id,
        source: {
          name: 'NVD',
          url: `https://nvd.nist.gov/vuln/detail/${vuln.id}`,
        },
        ratings: [{
          severity: vuln.severity,
          method: 'CVSSv3',
        }],
        description: vuln.description,
        recommendation: vuln.fixedIn ? `Upgrade to ${vuln.fixedIn}` : 'No fix available',
        affects: [{
          ref: `${component.name}@${component.version}`,
          versions: [vuln.affectedVersions],
        }],
      });
    }
  }

  return vulnerabilities;
}

/**
 * Add vulnerabilities to SBOM
 */
export function enrichWithVulnerabilities(sbom: SBOM): SBOM {
  const vulnerabilities = checkVulnerabilities(sbom);
  return {
    ...sbom,
    vulnerabilities,
  };
}

// ============================================================================
// LICENSE CHECKING
// ============================================================================

const PERMISSIVE_LICENSES = new Set([
  'MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', 'Unlicense', '0BSD',
]);

const COPYLEFT_LICENSES = new Set([
  'GPL-2.0', 'GPL-3.0', 'LGPL-2.1', 'LGPL-3.0', 'AGPL-3.0', 'MPL-2.0',
]);

const PROBLEMATIC_LICENSES = new Set([
  'GPL-3.0', 'AGPL-3.0', 'SSPL-1.0',
]);

export interface LicenseReport {
  totalComponents: number;
  licensedComponents: number;
  unlicensedComponents: Component[];
  byLicense: Record<string, number>;
  permissive: number;
  copyleft: number;
  problematic: Component[];
  unknown: Component[];
}

/**
 * Analyze licenses in SBOM
 */
export function analyzeLicenses(sbom: SBOM): LicenseReport {
  const report: LicenseReport = {
    totalComponents: sbom.components.length,
    licensedComponents: 0,
    unlicensedComponents: [],
    byLicense: {},
    permissive: 0,
    copyleft: 0,
    problematic: [],
    unknown: [],
  };

  for (const component of sbom.components) {
    const license = component.licenses?.[0]?.id;

    if (!license) {
      report.unlicensedComponents.push(component);
      continue;
    }

    report.licensedComponents++;
    report.byLicense[license] = (report.byLicense[license] || 0) + 1;

    if (PERMISSIVE_LICENSES.has(license)) {
      report.permissive++;
    } else if (COPYLEFT_LICENSES.has(license)) {
      report.copyleft++;
    }

    if (PROBLEMATIC_LICENSES.has(license)) {
      report.problematic.push(component);
    }

    if (!PERMISSIVE_LICENSES.has(license) && !COPYLEFT_LICENSES.has(license)) {
      report.unknown.push(component);
    }
  }

  return report;
}

// ============================================================================
// OUTPUT FORMATS
// ============================================================================

/**
 * Export SBOM as JSON (CycloneDX format)
 */
export function exportAsJSON(sbom: SBOM): string {
  return JSON.stringify(sbom, null, 2);
}

/**
 * Export SBOM as XML (CycloneDX format)
 */
export function exportAsXML(sbom: SBOM): string {
  const escape = (str: string) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<bom xmlns="http://cyclonedx.org/schema/bom/1.5" ';
  xml += `serialNumber="${sbom.serialNumber}" version="${sbom.version}">\n`;

  // Metadata
  xml += '  <metadata>\n';
  xml += `    <timestamp>${sbom.metadata.timestamp}</timestamp>\n`;

  if (sbom.metadata.tools) {
    xml += '    <tools>\n';
    for (const tool of sbom.metadata.tools) {
      xml += '      <tool>\n';
      if (tool.vendor) xml += `        <vendor>${escape(tool.vendor)}</vendor>\n`;
      xml += `        <name>${escape(tool.name)}</name>\n`;
      if (tool.version) xml += `        <version>${tool.version}</version>\n`;
      xml += '      </tool>\n';
    }
    xml += '    </tools>\n';
  }

  if (sbom.metadata.component) {
    xml += componentToXML(sbom.metadata.component, '    ');
  }

  xml += '  </metadata>\n';

  // Components
  xml += '  <components>\n';
  for (const component of sbom.components) {
    xml += componentToXML(component, '    ');
  }
  xml += '  </components>\n';

  // Dependencies
  if (sbom.dependencies && sbom.dependencies.length > 0) {
    xml += '  <dependencies>\n';
    for (const dep of sbom.dependencies) {
      xml += `    <dependency ref="${escape(dep.ref)}">\n`;
      if (dep.dependsOn) {
        for (const d of dep.dependsOn) {
          xml += `      <dependency ref="${escape(d)}"/>\n`;
        }
      }
      xml += '    </dependency>\n';
    }
    xml += '  </dependencies>\n';
  }

  // Vulnerabilities
  if (sbom.vulnerabilities && sbom.vulnerabilities.length > 0) {
    xml += '  <vulnerabilities>\n';
    for (const vuln of sbom.vulnerabilities) {
      xml += `    <vulnerability ref="${escape(vuln.id)}">\n`;
      xml += `      <id>${escape(vuln.id)}</id>\n`;
      if (vuln.description) {
        xml += `      <description>${escape(vuln.description)}</description>\n`;
      }
      xml += '    </vulnerability>\n';
    }
    xml += '  </vulnerabilities>\n';
  }

  xml += '</bom>';

  return xml;
}

function componentToXML(component: Component, indent: string): string {
  const escape = (str: string) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  let xml = `${indent}<component type="${component.type}">\n`;
  xml += `${indent}  <name>${escape(component.name)}</name>\n`;
  xml += `${indent}  <version>${component.version}</version>\n`;

  if (component.description) {
    xml += `${indent}  <description>${escape(component.description)}</description>\n`;
  }

  if (component.purl) {
    xml += `${indent}  <purl>${escape(component.purl)}</purl>\n`;
  }

  if (component.licenses) {
    xml += `${indent}  <licenses>\n`;
    for (const license of component.licenses) {
      xml += `${indent}    <license>\n`;
      if (license.id) xml += `${indent}      <id>${license.id}</id>\n`;
      if (license.name) xml += `${indent}      <name>${escape(license.name)}</name>\n`;
      xml += `${indent}    </license>\n`;
    }
    xml += `${indent}  </licenses>\n`;
  }

  xml += `${indent}</component>\n`;
  return xml;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Generation
  generateSBOM,
  parsePackageJson,

  // Vulnerability checking
  checkVulnerabilities,
  enrichWithVulnerabilities,

  // License analysis
  analyzeLicenses,

  // Export
  exportAsJSON,
  exportAsXML,
};
