# Security Policy

## Supported Versions

| Version | Supported |
| ------- | ------------------ |
| 3.x.x   | Active support |
| < 3.0   | Not supported |

## Reporting a Vulnerability

**Please do NOT open a public GitHub Issue for security vulnerabilities.**

Opening a public issue exposes the vulnerability to all users -- including malicious actors -- before a patch is available.

### Private Disclosure Process

1. **Email the maintainer directly at:** `contact@riteshrana.engineer`
2. Use the subject line: `[SECURITY] Flerapii - <brief description>`
3. Include the following in your report:
   - A description of the vulnerability and its potential impact
   - Steps to reproduce the issue
   - Any proof-of-concept code or screenshots
   - The version(s) affected
   - Your suggested fix (if you have one)

### What to Expect

| Timeline | Action |
| ---------------- | ------------------------------------------------ |
| Within 48 hours | Acknowledgement of your report |
| Within 7 days | Initial assessment and severity classification |
| Within 30 days | Patch released and CVE filed (if applicable) |
| Post-patch | Public disclosure with credit to the reporter |

We will keep you informed throughout the process and, with your permission, will credit you in the security advisory upon public disclosure.

## Scope

The following are **in scope** for security reports:

- **Browser extension code** (`src/`): XSS, credential leakage, unauthorized data access
- **GitHub Actions workflows** (`.github/workflows/`): secrets exposure, workflow injection, supply-chain attacks
- **Dependency vulnerabilities**: known CVEs in `package.json` dependencies
- **Data handling**: improper storage or transmission of API keys, tokens, or user credentials
- **WebDAV sync**: authentication bypass, data exposure during sync

The following are **out of scope**:

- Vulnerabilities in upstream relay station software (one-api, new-api, etc.) -- report to those vendors
- Rate-limiting or IP banning by relay sites (expected operational behavior)
- Social engineering attacks

## Security Best Practices for Contributors

When contributing to this project, please observe the following:

- **Never hardcode credentials, tokens, or API keys** -- use environment variables or browser storage APIs
- **Validate all external data** -- data from relay site APIs should be treated as untrusted
- **Pin dependency versions** -- use exact versions to prevent supply-chain attacks
- **Review GitHub Actions permissions** -- workflows should request the minimum permissions required
- **Use Content Security Policy** -- any new pages must respect the extension's CSP

Thank you for helping keep Flerapii and its users safe.
