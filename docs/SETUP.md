# 🚀 Netflix Clone - Complete Setup Guide

This comprehensive guide will walk you through the entire setup process, from installation to deployment.

---

## 📋 Table of Contents

- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Running the Application](#-running-the-application)
- [Team Development Setup](#-team-development-setup)

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software

| Software               | Minimum Version | Download Link                                           | Purpose                            |
| ---------------------- | --------------- | ------------------------------------------------------- | ---------------------------------- |
| **Node.js** (Optional) | v14.0.0+        | [nodejs.org ](https://nodejs.org/)                      | JavaScript runtime (for dev tools) |
| **Git**                | v2.0+           | [git-scm.com](https://git-scm.com/)                     | Version control                    |
| **Code Editor**        | Any             | [VS Code](https://code.visualstudio.com/) (recommended) | Development                        |
| **Modern Browser**     | Latest          | Chrome, Firefox, Safari, or Edge                        | Testing                            |

### Optional Tools

- **[Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)** (VS Code Extension) — Best for development
- **[Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)** — Code formatting
- **[ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)** — JavaScript linting
- **[GitLens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens)** — Enhanced Git integration

### TMDB API Account

You'll need a free TMDB API key to fetch movie data.

1. Create an account at [themoviedb.org](https://www.themoviedb.org/signup)
2. Verify your email address
3. Navigate to **Settings → API**
4. Request an API key (choose "Developer" option)
5. Fill out the application form (you can use placeholder URLs for a personal project)
6. Copy your API key once approved (usually instant)

---

## 📥 Installation

### Step 1: Clone the Repository

```bash
# Using HTTPS
git clone https://github.com/mujeebdev3/NetflixClone.git

# Navigate into the project directory
cd netflix-clone
```

### Step 2: Verify Project Structure

After cloning, your directory should look like this:

```
netflix-clone/
├── index.html
├── css/
├── js/
├── pages/
├── assets/
├── docs/
└── README.md
```

### Step 3: Install Development Dependencies (Optional)

If you want to use advanced development tools:

```bash
# Initialize npm (optional)
npm init -y

# Install development dependencies (optional)
npm install --save-dev http-server
```

> **Note:** This project uses vanilla JavaScript with no build process, so npm is optional. You can skip this step if you're using Live Server or Python's HTTP server.

---

## 🏃 Running the Application

### Method 1: VS Code Live Server (Recommended)

1. **Install Live Server Extension**

   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
   - Search for "Live Server"
   - Install by Ritwick Dey

2. **Start the Server**

   - Right-click on `index.html`
   - Select "Open with Live Server"
   - Your browser will automatically open at `http://localhost:5500`

3. **Auto-Reload**
   - Any changes you make will automatically reload the page

### Method 2: Python HTTP Server

**Python 3:**

```bash
python -m http.server 8000
```

**Python 2:**

```bash
python -m SimpleHTTPServer 8000
```

Then open `http://localhost:8000` in your browser.

### Method 3: Node.js HTTP Server

```bash
# Install http-server globally (one-time)
npm install -g http-server

# Run the server
http-server -p 8000

# Or use npx (no installation needed)
npx http-server -p 8000
```

Then open `http://localhost:8000` in your browser.

### Method 4: PHP Built-in Server

```bash
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

---

### Issue: Images Not Loading

**Symptoms:**

- Broken image icons
- Alt text showing instead of images

**Solutions:**

1. Check your internet connection
2. Verify API key is working
3. Check browser console for specific errors
4. Clear browser cache (Ctrl+Shift+R / Cmd+Shift+R)

### Issue: Live Server Not Working

**Symptoms:**

- Right-click menu doesn't show "Open with Live Server"
- Server won't start

**Solutions:**

1. Ensure Live Server extension is installed and enabled
2. Restart VS Code
3. Check if another process is using port 5500
4. Try a different port in Live Server settings

---

## 👥 Team Development Setup

### Git Workflow

```bash
# Create a new feature branch
git checkout -b feature/movie-search

# Make changes and commit
git add .
git commit -m "feat: add movie search functionality"

# Push to remote
git push origin feature/movie-search

# Create pull request on GitHub
```

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting, missing semicolons, etc.
refactor: code restructuring
test: adding tests
chore: maintenance tasks
```

### Branch Naming Convention

```
feature/feature-name     # New features
bugfix/issue-description # Bug fixes
hotfix/critical-bug      # Urgent fixes
docs/documentation-update # Documentation
```

### Code Review Checklist

Before submitting a PR, ensure:

- [ ] Code follows BEM naming convention (CSS)
- [ ] ES6+ syntax used consistently
- [ ] No console.log statements in production code
- [ ] Comments added for complex logic
- [ ] Tested in Chrome, Firefox, and Safari
- [ ] Responsive design verified on mobile
- [ ] Accessibility tested with keyboard navigation
- [ ] No ESLint errors or warnings
- [ ] Documentation updated (if needed)

---

## 📚 Additional Resources

### Official Documentation

- [TMDB API Documentation](https://developers.themoviedb.org/3)
- [MDN Web Docs](https://developer.mozilla.org/)

### Learning Resources

- [JavaScript.info](https://javascript.info/) — Modern JavaScript tutorial
- [CSS-Tricks](https://css-tricks.com/) — CSS techniques and guides
- [Web.dev](https://web.dev/) — Web development best practices

---

## 🆘 Need Help?

- 📖 Read the [README.md](./README.md) for project overview
- 🐛 Check [existing issues](https://github.com/mujeebdev3/NetflixClone/issues)
- 💬 Start a [discussion](https://github.com/mujeebdev3/NetflixClone/discussions)

---

**Happy Coding! 🚀**
