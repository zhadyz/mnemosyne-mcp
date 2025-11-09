# Mnemosyne MCP Router - Portable Setup

## Problem Statement

Standard `@zhadyz/mnemosyne-mcp` implements monolithic database architecture. This router provides dynamic database selection based on working directory context, enabling namespace isolation and performance optimization.

## How It Works (Portable)

```
Universal Deployment:
├─ ProjectAlpha/
│  └─ .mnemosyne  → MNEMOSYNE_DATABASE=alpha_db
│     → Routes to "alpha_db" database
│
├─ ProjectBeta/
│  └─ .mnemosyne  → MNEMOSYNE_DATABASE=beta_db
│     → Routes to "beta_db" database
│
└─ Unconfigured/ → Routes to "neo4j" (global patterns database)
```

## Option 1: Local Development

**Pre-publication testing configuration:**

### Claude Desktop Config
```json
{
  "mcpServers": {
    "mnemosyne": {
      "command": "npx",
      "args": [
        "-y",
        "C:/Users/eclip/Desktop/mnemosyne-mcp-router"
      ],
      "env": {
        "NEO4J_URI": "bolt://127.0.0.1:7687",
        "NEO4J_USERNAME": "neo4j",
        "NEO4J_PASSWORD": "memento123",
        "EMBEDDING_PROVIDER": "local",
        "LOCAL_EMBEDDING_MODEL": "Xenova/bge-base-en-v1.5"
      }
    }
  }
}
```

**Cross-machine deployment:**
1. Transfer `mnemosyne-mcp-router/` directory to target machine
2. Update configuration path to match local filesystem
3. Restart Claude Code runtime

## Option 2: npm Registry Publication (Universal Portability)

**Post-publication configuration:**

### 1. Publish Package
```bash
cd C:\Users\eclip\Desktop\mnemosyne-mcp-router
npm publish --access public
```

### 2. Update Config (Works on ANY computer)
```json
{
  "mcpServers": {
    "mnemosyne": {
      "command": "npx",
      "args": [
        "-y",
        "@zhadyz/mnemosyne-mcp-router"
      ],
      "env": {
        "NEO4J_URI": "bolt://127.0.0.1:7687",
        "NEO4J_USERNAME": "neo4j",
        "NEO4J_PASSWORD": "memento123",
        "EMBEDDING_PROVIDER": "local",
        "LOCAL_EMBEDDING_MODEL": "Xenova/bge-base-en-v1.5"
      }
    }
  }
}
```

**Universal deployment achieved.** Zero path dependencies.

### 3. Team Distribution
Distribution requires configuration only - npx resolves router automatically.

## Option 3: Git Repository Distribution

**GitHub-based deployment:**

### 1. Create Git Repo
```bash
cd C:\Users\eclip\Desktop\mnemosyne-mcp-router
git init
git add .
git commit -m "Initial commit: Mnemosyne MCP Router"
gh repo create zhadyz/mnemosyne-mcp-router --public --source=. --push
```

### 2. Update Config
```json
{
  "mcpServers": {
    "mnemosyne": {
      "command": "npx",
      "args": [
        "-y",
        "github:zhadyz/mnemosyne-mcp-router"
      ],
      "env": { ... }
    }
  }
}
```

**Git-based universal deployment achieved.**

## Deployment Strategy

1. **Development phase:** Local path configuration
2. **Team distribution:** npm or GitHub publication
3. **Production deployment:** npm registry as `@zhadyz/mnemosyne-mcp-router`

## Universal Portability

### Local Configuration (Machine-Specific)
```json
"args": ["C:/Users/eclip/Desktop/mnemosyne-mcp-router"]  // Filesystem-dependent
```

### Published Configuration (Universal)
```json
"args": ["-y", "@zhadyz/mnemosyne-mcp-router"]  // Filesystem-agnostic
```

## Testing Portability

**Machine A (Development):**
```bash
cd C:\workspace\compliance-system
# Connects to database specified in .mnemosyne
```

**Machine B (Production):**
```bash
cd /var/projects/compliance-system
# Connects to same database (if .mnemosyne exists with matching configuration)
```

## Deployment Execution

Select deployment strategy:

**Local Testing:**
- Local filesystem configuration active

**Git Distribution:**
```bash
cd mnemosyne-mcp-router
git init && git add . && git commit -m "Initial commit"
gh repo create --public
# Configure: github:username/mnemosyne-mcp-router
```

**npm Production:**
```bash
cd mnemosyne-mcp-router
npm login
npm publish --access public
# Configure: @zhadyz/mnemosyne-mcp-router
```

## File Structure

```
mnemosyne-mcp-router/
├── index.js              # Main router logic
├── test-router.js        # Test script
├── package.json          # npm metadata
├── README.md             # User documentation
├── .mnemosyne.template   # Template for projects
└── PORTABLE_SETUP.md     # This file
```

## Modification Protocol

**Post-modification deployment:**

Local development:
```bash
# Changes active after Claude Code restart
```

npm registry:
```bash
npm version patch  # Semantic versioning: patch|minor|major
npm publish
# npx resolves latest version automatically
```

---

**Status:** Local filesystem deployment active
**Target:** npm registry deployment (universal zero-configuration portability)
