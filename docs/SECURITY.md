# Security Policy

## Supported Versions

We take security seriously and actively maintain the Netflix Clone project. The following versions are currently supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

---

## Reporting a Vulnerability

We appreciate your efforts to responsibly disclose your findings and will make every effort to acknowledge your contributions.

### How to Report a Security Vulnerability

**Please DO NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them using one of the following methods:

#### 1. Private Security Advisory (Preferred)

1. Navigate to the [Security tab](https://github.com/mujeebdev3/netflix-clone-vanilla-javascript/security) of this repository
2. Click "Report a vulnerability"
3. Fill out the vulnerability report form with as much detail as possible

Include the following information:

- **Type of vulnerability** (e.g., XSS, CSRF, API key exposure)
- **Full paths of affected source files**
- **Location of the affected source code** (tag/branch/commit or direct URL)
- **Step-by-step instructions to reproduce the issue**
- **Proof-of-concept or exploit code** (if possible)
- **Impact of the issue** (what an attacker might be able to do)
- **Any potential mitigation steps** you've identified

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your vulnerability report within 48 hours
- **Initial Assessment**: We will provide an initial assessment within 5 business days
- **Regular Updates**: We will keep you informed about our progress
- **Timeline**: We aim to resolve critical vulnerabilities within 30 days
- **Disclosure**: We will coordinate with you on public disclosure timing

---

## Security Best Practices for Users

### API Key Management

**❌ NEVER commit API keys to version control**

```javascript
// ❌ Bad - Hardcoded API key
const API_KEY = "1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p";

// ✅ Good - Use environment variables
const API_KEY = process.env.TMDB_API_KEY;
```

## Known Security Considerations

### Client-Side API Key Exposure

**Status**: ⚠️ Known Limitation

Since this is a frontend-only application, the TMDB API key is exposed in client-side JavaScript. This is a limitation of static site architecture.

**Mitigation:**

- Use TMDB's **free tier** API key with rate limiting
- Consider using TMDB's **authentication flow** for production apps
- For commercial projects, implement a **backend proxy** to hide the API key
- Monitor your API key usage in TMDB dashboard
- Regenerate keys if suspicious activity is detected

**Alternative Architecture (for production apps):**

```
Frontend → Backend API (Node.js/Python) → TMDB API
         ↑
    No API key exposed
```

### Rate Limiting

TMDB API has rate limits:

- **40 requests per 10 seconds** per IP address
- Exceeding limits results in 429 (Too Many Requests) response

**Our Implementation:**

- Debounced search queries (300ms delay)
- Cached API responses (1-hour duration)
- Request queuing for bulk operations

---

## Security Checklist for Contributors

When contributing code, ensure:

- [ ] No hardcoded secrets or API keys
- [ ] User input is sanitized
- [ ] No `eval()` or `innerHTML` with user input
- [ ] External links use `rel="noopener noreferrer"`
- [ ] Forms include CSRF protection (if added)
- [ ] File uploads are validated (if added)
- [ ] Authentication is secure (if added)
- [ ] Code has been reviewed for vulnerabilities

---

## Security Updates

### How to Stay Informed

- **Watch this repository** on GitHub for security announcements
- **Subscribe to releases** to get notified of security patches
- **Check the Security tab** periodically

### Applying Security Updates

When a security update is released:

```bash
# 1. Backup your current code
git stash

# 2. Pull the latest changes
git pull origin main

# 3. Review the security advisory
# Check CHANGELOG.md and GitHub Security tab

# 4. Test your application
# Verify everything works with the security patch

# 5. Deploy to production
# Follow your normal deployment process
```

---

## Resources

### Security Resources

- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [TMDB API Security](https://developers.themoviedb.org/3/getting-started/authentication)

---

## Legal

This project is provided "as is" without warranty of any kind. See the [LICENSE](LICENSE) file for details.

Users are responsible for:

- Securing their own TMDB API keys
- Complying with TMDB's Terms of Service
- Implementing appropriate security measures for their deployments

---

**Thank you for helping keep Netflix Clone secure!** 🔒
