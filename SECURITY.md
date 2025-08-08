# Security Policy

## Supported Versions

We take security seriously and actively maintain the following versions of Genassist:

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |
| main    | :white_check_mark: |

## Reporting a Vulnerability

We appreciate responsible disclosure of security vulnerabilities. If you discover a security issue in Genassist, please follow these guidelines:

### How to Report

**Email:** [loic.muhirwa@gmail.com](mailto:loic.muhirwa@gmail.com)

**Subject:** `[SECURITY] Vulnerability Report - Genassist`

### What to Include

Please provide the following information in your report:

1. **Description** - A clear description of the vulnerability
2. **Location** - The specific component, file, or service affected
3. **Impact** - Potential impact and attack scenarios
4. **Reproduction** - Step-by-step instructions to reproduce the issue
5. **Proof of Concept** - Code, screenshots, or logs demonstrating the vulnerability
6. **Suggested Fix** - If you have ideas for remediation (optional)

### Response Timeline

- **Initial Response:** Within 48 hours of receipt
- **Status Update:** Weekly updates until resolution
- **Resolution:** We aim to address critical vulnerabilities within 7 days
- **Disclosure:** Coordinated disclosure after fix is deployed

### What to Expect

1. We will acknowledge receipt of your vulnerability report
2. We will confirm the vulnerability and determine its severity
3. We will work on a fix and keep you updated on progress
4. We will coordinate the disclosure timeline with you
5. We will credit you in our security acknowledgments (if desired)

## Security Considerations

### For Users

- **Environment Variables:** Never commit `.env` files containing sensitive credentials
- **API Keys:** Store API keys securely and rotate them regularly
- **Network Access:** Run services behind appropriate firewalls and access controls
- **Updates:** Keep dependencies up to date using `npm audit` and `pip check`

### For Developers

- **Dependencies:** Regularly audit and update dependencies
- **Input Validation:** Validate all user inputs on both frontend and backend
- **Authentication:** Implement proper authentication and authorization
- **HTTPS:** Always use HTTPS in production environments
- **Rate Limiting:** Implement rate limiting to prevent abuse
- **Logging:** Log security events but avoid logging sensitive data

## Security Features

### Current Implementations

- **Input Sanitization:** User inputs are validated and sanitized
- **CORS Configuration:** Proper Cross-Origin Resource Sharing policies
- **Environment Isolation:** Separate development and production environments
- **Dependency Scanning:** Regular dependency vulnerability scanning
- **Rate Limiting:** API rate limiting to prevent abuse

### Planned Enhancements

- **Authentication:** OAuth2/JWT-based authentication system
- **Audit Logging:** Comprehensive security event logging
- **Encryption:** End-to-end encryption for sensitive data
- **Security Headers:** Implementation of security headers (CSP, HSTS, etc.)

## Vulnerability Disclosure Policy

### Scope

This security policy applies to:

- Main Genassist application (frontend and backend)
- Deploy scripts and configuration files
- Documentation and examples
- Dependencies we directly maintain

### Out of Scope

- Third-party dependencies (please report to their maintainers)
- Issues in development/test environments
- Social engineering attacks
- Physical security issues

### Safe Harbor

We support safe harbor for security researchers who:

- Make a good faith effort to avoid privacy violations and data destruction
- Only interact with accounts you own or with explicit permission
- Do not access or modify data belonging to others
- Report vulnerabilities promptly
- Do not publicly disclose issues until they are resolved

## Security Best Practices

### For Installation

```bash
# Verify integrity of dependencies
npm audit
pip check

# Use virtual environments
python3 -m venv .venv
source .venv/bin/activate

# Set proper file permissions
chmod 600 .env*
chmod +x scripts/*.sh
```

### For Production Deployment

```bash
# Use production builds
make build

# Set secure environment variables
export NODE_ENV=production
export PYTHONPATH=/path/to/app

# Run with non-root user
sudo -u appuser make deploy
```

## Contact Information

**Security Team:** [loic.muhirwa@gmail.com](mailto:loic.muhirwa@gmail.com)

**PGP Key:** Available upon request

**Project Repository:** [https://github.com/justmeloic/genassist](https://github.com/justmeloic/genassist)

## Acknowledgments

We thank the security community for helping keep Genassist secure. Security researchers who responsibly disclose vulnerabilities will be acknowledged here (with their permission).

---

**Last Updated:** August 8, 2025

For general questions or support, please use the project's standard communication channels. This security contact should only be used for reporting security vulnerabilities.
