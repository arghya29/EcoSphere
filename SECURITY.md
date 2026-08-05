# Security Policy

## Supported Versions

We currently provide security updates for the following versions of EcoSphere:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Threat Model & Scope

EcoSphere is a modern web application built on Next.js. The following vulnerabilities are **in scope**:

- Cross-Site Scripting (XSS)
- Authentication and authorization flaws
- Insecure direct object references (IDOR)
- Sensitive data exposure (PII, tokens)
- Server-Side Request Forgery (SSRF)

**Out of scope**:

- Social engineering (phishing, etc.)
- Denial of Service (DoS/DDoS) attacks
- Vulnerabilities in third-party dependencies already reported upstream

## Reporting a Vulnerability

We take the security of our users and data very seriously. If you discover a vulnerability in EcoSphere, please **do not open a public issue**. Instead, follow this responsible disclosure process:

1. **Email us**: Send your report to `security@ecosphere-project.example.com` with the subject `[Security] <Brief description>`.
2. **Details**: Include steps to reproduce the vulnerability, a proof of concept if applicable, and an assessment of its impact.
3. **Response**: We will acknowledge your report within 48 hours and provide an estimated timeline for a fix.
4. **Fix & Disclosure**: Once the vulnerability is patched, we will publish a security advisory and (if desired) credit you in our release notes.

Thank you for helping keep EcoSphere secure!
