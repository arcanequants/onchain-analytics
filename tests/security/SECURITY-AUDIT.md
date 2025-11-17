# Security Audit Guide

## Overview

This directory contains security testing tools and procedures for OnChain Analytics.

## Security Testing Tools

### 1. OWASP ZAP Scan
Automated security vulnerability scanner.

**Run:**
```bash
chmod +x tests/security/zap-scan.sh
./tests/security/zap-scan.sh https://vectorialdata.com
```

**What it tests:**
- SQL Injection
- XSS (Cross-Site Scripting)
- CSRF (Cross-Site Request Forgery)
- Insecure cookies
- Missing security headers
- Directory traversal
- Server misconfigurations

**Reports generated:**
- HTML: Visual report with findings
- JSON: Machine-readable results
- Markdown: Text-based summary

### 2. Security Headers Test
Tests for proper HTTP security headers.

**Run:**
```bash
chmod +x tests/security/security-headers-test.sh
./tests/security/security-headers-test.sh https://vectorialdata.com
```

**Headers tested:**
- Strict-Transport-Security (HSTS)
- X-Frame-Options
- X-Content-Type-Options
- Content-Security-Policy
- X-XSS-Protection
- Referrer-Policy
- Permissions-Policy

### 3. SSL/TLS Test
Tests SSL certificate and TLS configuration.

**Run:**
```bash
chmod +x tests/security/ssl-test.sh
./tests/security/ssl-test.sh vectorialdata.com
```

**What it tests:**
- Certificate validity
- Certificate expiration
- TLS version support
- Weak cipher suites

### 4. NPM Audit
Tests for vulnerable dependencies.

**Run:**
```bash
npm audit
npm audit --audit-level=high
```

**Fix vulnerabilities:**
```bash
npm audit fix
npm audit fix --force  # May introduce breaking changes
```

## Security Checklist

### Application Security
- [ ] All user inputs validated and sanitized
- [ ] SQL queries use parameterized statements
- [ ] No sensitive data in client-side code
- [ ] API endpoints have rate limiting
- [ ] Authentication tokens expire
- [ ] Passwords hashed with bcrypt/argon2
- [ ] HTTPS enforced everywhere
- [ ] CORS properly configured

### Infrastructure Security
- [ ] Firewall configured
- [ ] Database not publicly accessible
- [ ] Environment variables in secure storage
- [ ] Backups encrypted
- [ ] Access logs enabled
- [ ] Monitoring alerts configured

### Code Security
- [ ] No hardcoded credentials
- [ ] Dependencies up to date
- [ ] No known vulnerabilities (npm audit)
- [ ] Code review process in place
- [ ] Static code analysis run
- [ ] Secrets not in git history

### API Security
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] Authentication required for sensitive endpoints
- [ ] Authorization checks in place
- [ ] API versioning implemented
- [ ] Error messages don't leak sensitive info

### Database Security
- [ ] Row Level Security (RLS) enabled
- [ ] Principle of least privilege
- [ ] Connection pooling configured
- [ ] Backups automated and tested
- [ ] No direct database access from client
- [ ] Prepared statements used

## Common Vulnerabilities

### 1. SQL Injection
**Risk:** Attackers can execute arbitrary SQL commands

**Prevention:**
```typescript
// ❌ BAD - Vulnerable to SQL injection
const query = `SELECT * FROM users WHERE email = '${email}'`

// ✅ GOOD - Use parameterized queries
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('email', email)
```

### 2. XSS (Cross-Site Scripting)
**Risk:** Attackers can inject malicious scripts

**Prevention:**
```typescript
// ❌ BAD - Dangerous HTML rendering
<div dangerouslySetInnerHTML={{__html: userInput}} />

// ✅ GOOD - Sanitize or escape
import DOMPurify from 'dompurify'
<div dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(userInput)}} />
```

### 3. Insecure Direct Object References
**Risk:** Users can access unauthorized resources

**Prevention:**
```typescript
// ❌ BAD - No authorization check
const data = await getDocument(documentId)

// ✅ GOOD - Verify ownership
const data = await getDocument(documentId)
if (data.owner_id !== currentUserId) {
  throw new Error('Unauthorized')
}
```

### 4. Sensitive Data Exposure
**Risk:** Confidential information leaked

**Prevention:**
```typescript
// ❌ BAD - Exposing sensitive fields
return { user: { email, password, ssn } }

// ✅ GOOD - Only return necessary fields
return { user: { email, name } }
```

## Security Headers

### Strict-Transport-Security
Forces HTTPS connections.

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Content-Security-Policy
Prevents XSS attacks.

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'
```

### X-Frame-Options
Prevents clickjacking.

```
X-Frame-Options: DENY
```

### X-Content-Type-Options
Prevents MIME-type sniffing.

```
X-Content-Type-Options: nosniff
```

## Incident Response Plan

### If a vulnerability is found:

1. **Assess Severity**
   - Critical: Data breach, authentication bypass
   - High: XSS, SQL injection
   - Medium: Information disclosure
   - Low: Minor configuration issues

2. **Immediate Actions**
   - Document the vulnerability
   - Determine if it's being exploited
   - Notify team leads

3. **Remediation**
   - Develop fix
   - Test thoroughly
   - Deploy to production
   - Verify fix works

4. **Post-Incident**
   - Document lessons learned
   - Update security procedures
   - Run additional scans

## Regular Security Tasks

### Daily
- Review error logs for anomalies
- Check uptime monitoring

### Weekly
- npm audit
- Review access logs
- Check for dependency updates

### Monthly
- Full OWASP ZAP scan
- Security headers test
- SSL/TLS configuration review
- Review user permissions

### Quarterly
- Penetration testing
- Security training for team
- Review and update security policies
- Third-party security audit

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP ZAP](https://www.zaproxy.org/)
- [Security Headers](https://securityheaders.com/)
- [SSL Labs](https://www.ssllabs.com/ssltest/)
- [NPM Audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)

## Emergency Contacts

**Security Issues:**
- Report to: security@yourcompany.com
- Slack: #security-alerts
- On-call: [Phone number]

**Responsible Disclosure:**
If you find a security vulnerability, please report it responsibly:
1. Do not exploit the vulnerability
2. Email security@yourcompany.com with details
3. Allow time for fix before public disclosure
