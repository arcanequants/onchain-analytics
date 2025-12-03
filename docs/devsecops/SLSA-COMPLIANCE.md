# SLSA Compliance Documentation

## Document Information

| Field | Value |
|-------|-------|
| Version | 1.0 |
| Status | Active |
| Owner | DevSecOps |
| Created | December 2024 |
| Review | Quarterly |

---

## 1. Executive Summary

This document describes AI Perception's compliance with SLSA (Supply-chain Levels for Software Artifacts) Level 2. SLSA is a security framework that provides a common vocabulary for discussing supply chain integrity and a set of requirements for hardening build processes.

### Current Status: SLSA Level 2

| Requirement | Status |
|-------------|--------|
| Source - Version Controlled | PASS |
| Build - Build Service | PASS |
| Build - Scripted Build | PASS |
| Provenance - Available | PASS |
| Provenance - Authenticated | PASS |
| Provenance - Service Generated | PASS |

---

## 2. SLSA Level Requirements

### Level 1: Build Process Documentation

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| Scripted build | `pnpm build` in CI/CD | PASS |
| Build parameters recorded | GitHub Actions logs | PASS |

### Level 2: Hosted Build + Provenance

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| Hosted build platform | GitHub Actions | PASS |
| Provenance generation | SLSA Provenance workflow | PASS |
| Provenance authenticity | GitHub attestations | PASS |

### Level 3: Hardened Builds (Future)

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| Isolated build | Not yet implemented | PLANNED |
| Hermetic builds | Not yet implemented | PLANNED |
| Non-falsifiable provenance | Not yet implemented | PLANNED |

---

## 3. Build Process

### 3.1 Build Environment

```
Platform: GitHub Actions (ubuntu-latest)
Node.js: 20.x
Package Manager: pnpm 9.x
Build Tool: Next.js
```

### 3.2 Build Steps

```yaml
1. Checkout code with full history
2. Setup Node.js and pnpm
3. Install dependencies (frozen lockfile)
4. Build application
5. Generate artifact digest (SHA256)
6. Upload artifact
7. Generate SLSA provenance
8. Generate SBOM (CycloneDX)
```

### 3.3 Build Inputs

| Input | Source | Verification |
|-------|--------|--------------|
| Source code | GitHub repository | Git commit SHA |
| Dependencies | npm registry | pnpm-lock.yaml |
| Build scripts | package.json | Versioned in repo |
| Environment | GitHub Actions | ubuntu-latest |

---

## 4. Provenance Attestation

### 4.1 Provenance Format

We use the SLSA Provenance v1 format:

```json
{
  "_type": "https://in-toto.io/Statement/v1",
  "subject": [...],
  "predicateType": "https://slsa.dev/provenance/v1",
  "predicate": {
    "buildDefinition": {...},
    "runDetails": {...}
  }
}
```

### 4.2 Attestation Contents

| Field | Value |
|-------|-------|
| Build type | GitHub Actions |
| Repository | github.com/[org]/ai-perception |
| Commit | Full SHA-1 hash |
| Workflow | .github/workflows/slsa-provenance.yml |
| Builder ID | https://github.com/actions/runner |

### 4.3 Artifact Integrity

Each build produces:
- **Artifact**: Tarball of build output
- **Digest**: SHA256 hash of artifact
- **Provenance**: SLSA attestation JSON
- **SBOM**: CycloneDX bill of materials

---

## 5. Software Bill of Materials (SBOM)

### 5.1 Format

We generate SBOM in CycloneDX JSON format:

```json
{
  "bomFormat": "CycloneDX",
  "specVersion": "1.5",
  "components": [...]
}
```

### 5.2 Contents

The SBOM includes:
- Direct dependencies
- Transitive dependencies
- Version information
- Package URLs (purl)
- License information

### 5.3 Attestation

SBOMs are attested using GitHub's artifact attestation feature, providing:
- Cryptographic signature
- Verification of origin
- Tamper detection

---

## 6. Verification Process

### 6.1 Automated Verification

The CI/CD pipeline automatically verifies:

```bash
# Provenance structure
jq '.predicateType' provenance.json

# SBOM format
jq '.bomFormat' sbom.json

# Artifact digest
sha256sum artifact.tar.gz
```

### 6.2 Manual Verification

Consumers can verify artifacts:

```bash
# 1. Download artifact and provenance
gh run download <run-id> -n ai-perception-build-<sha>
gh run download <run-id> -n slsa-provenance-<sha>

# 2. Verify digest matches
DIGEST=$(sha256sum *.tar.gz | cut -d ' ' -f 1)
jq -r '.subject[0].digest.sha256' provenance.json

# 3. Compare
if [ "$DIGEST" = "$(jq -r '.subject[0].digest.sha256' provenance.json)" ]; then
  echo "Verification PASSED"
fi
```

---

## 7. Security Controls

### 7.1 Access Controls

| Control | Implementation |
|---------|----------------|
| Repository access | Limited to authorized developers |
| Workflow modifications | Requires PR review |
| Secrets access | GitHub Secrets, limited exposure |
| Artifact signing | GitHub attestations |

### 7.2 Workflow Security

| Control | Implementation |
|---------|----------------|
| Action pinning | Pinned by SHA |
| Minimum permissions | Explicit permission grants |
| Token scope | Minimum required scope |
| OIDC authentication | For cloud deployments |

### 7.3 Dependency Security

| Control | Implementation |
|---------|----------------|
| Lockfile | pnpm-lock.yaml frozen |
| Audit | npm audit in CI |
| SBOM generation | Every build |
| License compliance | Automated scan |

---

## 8. Incident Response

### 8.1 Compromise Detection

Signs of potential compromise:
- Unexpected provenance changes
- Missing attestations
- Digest mismatches
- Unknown dependencies in SBOM

### 8.2 Response Procedure

1. **Identify**: Verify the incident
2. **Contain**: Halt deployments
3. **Investigate**: Review build logs and provenance
4. **Remediate**: Rebuild from known-good state
5. **Recover**: Resume with enhanced monitoring
6. **Learn**: Update controls as needed

---

## 9. Roadmap to Level 3

### 9.1 Requirements

| Requirement | Plan |
|-------------|------|
| Isolated build environment | Ephemeral runners |
| Hermetic builds | Vendor all dependencies |
| Non-falsifiable provenance | SLSA generator action |

### 9.2 Timeline

| Milestone | Target Date |
|-----------|-------------|
| Ephemeral runners | Q1 2025 |
| Hermetic builds | Q2 2025 |
| SLSA Level 3 | Q2 2025 |

---

## 10. References

- [SLSA Specification](https://slsa.dev/spec/v1.0/)
- [SLSA Levels](https://slsa.dev/spec/v1.0/levels)
- [GitHub Attestations](https://docs.github.com/en/actions/security-guides/using-artifact-attestations-to-establish-provenance-for-builds)
- [CycloneDX](https://cyclonedx.org/)
- [in-toto](https://in-toto.io/)

---

## Appendix A: Workflow Files

| File | Purpose |
|------|---------|
| `.github/workflows/slsa-provenance.yml` | Main SLSA workflow |
| `.github/workflows/ci.yml` | CI pipeline |
| `.github/workflows/deploy.yml` | Deployment |

## Appendix B: Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-02 | DevSecOps | Initial version |
