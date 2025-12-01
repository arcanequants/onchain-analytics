# Signed Commits Setup Guide

## Overview

Signed commits provide cryptographic verification that commits were made by the claimed author. This prevents commit spoofing and establishes a chain of trust in the codebase.

## Why Sign Commits?

1. **Authenticity**: Proves you are who you say you are
2. **Integrity**: Guarantees the commit hasn't been tampered with
3. **Non-repudiation**: Cannot deny making a signed commit
4. **Supply Chain Security**: Protects against malicious code injection

## Setup Options

### Option 1: GPG Signing (Traditional)

#### macOS Setup

```bash
# Install GPG
brew install gnupg

# Generate a new GPG key
gpg --full-generate-key
# Choose: RSA and RSA, 4096 bits, 2y expiration, your GitHub email

# List your keys
gpg --list-secret-keys --keyid-format=long

# Output will look like:
# sec   rsa4096/YOUR_KEY_ID 2024-01-01 [SC]
#       XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
# uid                 [ultimate] Your Name <your-email@example.com>

# Export your public key
gpg --armor --export YOUR_KEY_ID

# Copy the output (including BEGIN/END lines) to GitHub:
# Settings > SSH and GPG keys > New GPG key
```

#### Configure Git to Sign

```bash
# Set your signing key
git config --global user.signingkey YOUR_KEY_ID

# Enable commit signing by default
git config --global commit.gpgsign true

# Enable tag signing by default
git config --global tag.gpgSign true

# Tell Git where GPG is
git config --global gpg.program $(which gpg)

# For macOS, enable GPG agent
echo 'export GPG_TTY=$(tty)' >> ~/.zshrc
source ~/.zshrc
```

#### Verify Setup

```bash
# Make a test commit
git commit -S -m "test: verify GPG signing"

# View commit signature
git log --show-signature -1

# Should show: Good signature from "Your Name <email>"
```

### Option 2: SSH Signing (Recommended for simplicity)

SSH signing uses your existing SSH key - no additional key management needed.

#### Setup

```bash
# Tell Git to use SSH for signing
git config --global gpg.format ssh

# Specify your SSH signing key
git config --global user.signingkey ~/.ssh/id_ed25519.pub

# Enable signing by default
git config --global commit.gpgsign true

# Upload your SSH key to GitHub:
# Settings > SSH and GPG keys > New SSH key
# Key type: Signing key
```

#### Verify Setup

```bash
# Make a test commit
git commit -S -m "test: verify SSH signing"

# View commit signature
git log --show-signature -1
```

## GitHub Configuration

### Repository Settings

1. Go to **Settings > Branches > Branch protection rules**
2. Select or create rule for `main`
3. Enable **Require signed commits**
4. Save changes

### Organization Settings (if applicable)

1. Go to **Organization Settings > Repository roles**
2. Create/edit role with "Require signed commits" permission
3. Apply to relevant repositories

## CI Verification

Our CI pipeline verifies commit signatures on pull requests.

### Verification Workflow

The `.github/workflows/verify-signatures.yml` workflow:
- Runs on all pull requests
- Checks that all commits in the PR are signed
- Fails if any unsigned commits are found
- Reports the verification status

### Bypassing (Emergency Only)

In emergencies, admins can bypass with a comment:
```
/bypass-signature-check REASON: <explanation>
```

This is logged and audited.

## Troubleshooting

### GPG Issues

**"gpg: signing failed: No secret key"**
```bash
# Check your keys
gpg --list-secret-keys

# Ensure the signing key matches
git config --global user.signingkey
```

**"gpg: signing failed: Inappropriate ioctl for device"**
```bash
# Add to ~/.zshrc or ~/.bashrc
export GPG_TTY=$(tty)
source ~/.zshrc
```

**"error: gpg failed to sign the data"**
```bash
# Test GPG signing
echo "test" | gpg --clearsign

# If it fails, kill and restart agent
gpgconf --kill gpg-agent
gpg-agent --daemon
```

### SSH Issues

**"error: Load key ... invalid format"**
```bash
# Ensure you're pointing to the public key
git config --global user.signingkey ~/.ssh/id_ed25519.pub
```

**Commits show as "Unverified" on GitHub**
- Ensure the SSH key is added as a "Signing key" (not just "Authentication")
- Verify the email in your commits matches your GitHub account

## Best Practices

1. **Protect your private key**: Use a passphrase
2. **Key expiration**: Set expiration and rotate keys annually
3. **Backup your key**: Store encrypted backup securely
4. **Per-repo keys**: Consider separate keys for different projects
5. **Hardware keys**: Use YubiKey for highest security

## Quick Reference

```bash
# Check current signing configuration
git config --global --list | grep -E "(gpg|sign)"

# Sign a commit manually
git commit -S -m "message"

# Amend last commit with signature
git commit --amend -S --no-edit

# Rebase and sign all commits
git rebase --exec 'git commit --amend --no-edit -S' HEAD~N

# Verify a specific commit
git verify-commit COMMIT_SHA

# Verify all commits in range
git log --show-signature main..HEAD
```

## Revoking a Compromised Key

If your signing key is compromised:

1. **Revoke on GitHub**: Remove key from SSH/GPG keys
2. **Generate new key**: Follow setup again
3. **Update git config**: Point to new key
4. **Notify team**: Commits with old key should be scrutinized
5. **Audit**: Review recent commits for tampering

## Related Documentation

- [GitHub: Signing Commits](https://docs.github.com/en/authentication/managing-commit-signature-verification)
- [Git: Signing Your Work](https://git-scm.com/book/en/v2/Git-Tools-Signing-Your-Work)
- [GPG Manual](https://www.gnupg.org/gph/en/manual.html)
