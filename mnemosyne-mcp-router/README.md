# @zhadyz/mnemosyne-mcp-router

> Dynamic database routing for [@zhadyz/mnemosyne-mcp](https://github.com/zhadyz/mnemosyne-mcp) - automatically selects the correct Neo4j database based on your current directory.

[![npm version](https://badge.fury.io/js/%40zhadyz%2Fmnemosyne-mcp-router.svg)](https://www.npmjs.com/package/@zhadyz/mnemosyne-mcp-router)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Rationale

Standard `@zhadyz/mnemosyne-mcp` operates on a monolithic database architecture. This router implements dynamic database selection to address fundamental scalability and isolation constraints:

- **Project isolation** - Namespace separation prevents cross-contamination of knowledge graphs
- **Performance at scale** - O(log n) query complexity through database partitioning
- **Global pattern extraction** - Shared database accumulates cross-project learnings
- **Zero configuration overhead** - Declarative `.mnemosyne` configuration in project root

## How It Works

```
Directory Structure:
├─ compliance-project/
│  └─ .mnemosyne          → MNEMOSYNE_DATABASE=compliance_db
│     Routes to "compliance_db" database
│
├─ orchestration-system/
│  └─ .mnemosyne          → MNEMOSYNE_DATABASE=orchestration_db
│     Routes to "orchestration_db" database
│
└─ untagged-directory/
   No .mnemosyne → Routes to "neo4j" (global patterns database)
```

The router traverses the directory hierarchy from the current working directory, locates `.mnemosyne` or `.env` configuration files, extracts the `MNEMOSYNE_DATABASE` variable, and dynamically routes database connections accordingly.

## Installation

### Option 1: npm (Recommended)

```bash
npm install -g @zhadyz/mnemosyne-mcp-router
```

### Option 2: npx (No installation)

```bash
npx -y @zhadyz/mnemosyne-mcp-router
```

## Configuration

### 1. Update Claude Desktop Config

**Before (single database):**
```json
{
  "mcpServers": {
    "mnemosyne": {
      "command": "npx",
      "args": ["-y", "@zhadyz/mnemosyne-mcp"],
      "env": {
        "NEO4J_URI": "bolt://127.0.0.1:7687",
        "NEO4J_USERNAME": "neo4j",
        "NEO4J_PASSWORD": "your_password",
        "NEO4J_DATABASE": "neo4j"
      }
    }
  }
}
```

**After (dynamic routing):**
```json
{
  "mcpServers": {
    "mnemosyne": {
      "command": "npx",
      "args": ["-y", "@zhadyz/mnemosyne-mcp-router"],
      "env": {
        "NEO4J_URI": "bolt://127.0.0.1:7687",
        "NEO4J_USERNAME": "neo4j",
        "NEO4J_PASSWORD": "your_password",
        "EMBEDDING_PROVIDER": "local",
        "LOCAL_EMBEDDING_MODEL": "Xenova/bge-base-en-v1.5"
      }
    }
  }
}
```

**Critical:** Remove `NEO4J_DATABASE` from configuration - database selection is now project-scoped.

### 2. Configure Projects

Create `.mnemosyne` in your project root:

```bash
# Project-specific database name (required)
MNEMOSYNE_DATABASE=my_project_db

# Optional metadata
PROJECT_NAME=My Awesome Project
RETENTION_DAYS=90
AUTO_CLEANUP=true
ISOLATION_LEVEL=project
```

**Or use existing `.env`:**
```bash
MNEMOSYNE_DATABASE=my_project_db
```

### 3. Create Database in Neo4j

```cypher
CREATE DATABASE my_project_db IF NOT EXISTS;
```

### 4. Restart Claude Code

Changes take effect after restart.

## Usage

### Router Verification

```bash
cd ~/Desktop/mnemosyne-mcp-router
npm test
```

Manual verification:
```bash
cd /path/to/target/project
node -e "console.log(process.cwd())"  # Validate working directory
```

### Router Diagnostics

The router emits diagnostic output to stderr:

```
============================================================
[Mnemosyne Router] Starting...
[Mnemosyne Router] Working directory: /home/user/projects/my-app
[Mnemosyne Router] Project root: /home/user/projects/my-app
[Mnemosyne Router] Config file: /home/user/projects/my-app/.mnemosyne
[Mnemosyne Router] Found database in .mnemosyne: my_project_db
[Mnemosyne Router] Project: My Awesome Project
[Mnemosyne Router] Target database: my_project_db
============================================================
```

## Configuration Reference

### `.mnemosyne` File Format

| Variable | Default | Description |
|----------|---------|-------------|
| `MNEMOSYNE_DATABASE` | `neo4j` | Neo4j database name (required) |
| `PROJECT_NAME` | (directory name) | Human-readable project name |
| `RETENTION_DAYS` | `90` | Data retention period |
| `AUTO_CLEANUP` | `true` | Enable automatic cleanup |
| `ISOLATION_LEVEL` | `project` | `project` or `global` |

### Database Naming Conventions

Required naming schema:
- `neo4j` - Global cross-project patterns database (mandatory fallback)
- `project_name` - snake_case identifier for project-scoped databases
- `archive_YYYY` - Cold storage for deprecated projects

## Architecture

### Hybrid Multi-Database Design

```
┌─────────────────────────────────────┐
│   neo4j (Global Patterns)           │
│   - Cross-project learnings         │
│   - Validated best practices        │
│   - Agent performance metrics       │
│   - Curated, high-confidence data   │
└─────────────────────────────────────┘
              ↕
┌─────────────────────────────────────┐
│   Project Databases                 │
│   - compliance_db (Compliance)      │
│   - orchestrator_db (Orchestration) │
│   - application_db (Application)    │
│   - Isolated, project-specific      │
└─────────────────────────────────────┘
```

**Performance Characteristics:**
- **Query complexity** - O(10^4) entities vs O(10^5+) in monolithic architecture
- **Namespace isolation** - Zero cross-project data contamination
- **Knowledge extraction** - High-confidence patterns promote to global database
- **Horizontal scalability** - Linear project addition without performance degradation

## Configuration Template

Deploy `.mnemosyne.template` to project root as `.mnemosyne`:

```bash
cp node_modules/@zhadyz/mnemosyne-mcp-router/.mnemosyne.template .mnemosyne
```

Modify `MNEMOSYNE_DATABASE` parameter to target database identifier.

## Troubleshooting

### Database Resolution Failure

Database must exist in Neo4j before routing:
```cypher
CREATE DATABASE target_database_name IF NOT EXISTS;
```

### Configuration Detection Failure

Diagnostic protocol:
1. Verify `.mnemosyne` exists in project hierarchy
2. Validate file contains `MNEMOSYNE_DATABASE=<identifier>`
3. Confirm working directory: `pwd`
4. Inspect router stderr output for diagnostic messages

### Incorrect Database Selection

Resolution steps:
1. Execute test suite: `npm test`
2. Analyze router diagnostic output for detection logic
3. Router traverses upward from cwd - verify `.mnemosyne` placement
4. Validate database existence: `SHOW DATABASES;` in Neo4j console

## Development

```bash
# Clone repo
git clone https://github.com/zhadyz/mnemosyne-mcp.git
cd mnemosyne-mcp/router

# Install dependencies
npm install

# Test locally
npm test

# Link for local development
npm link

# Update Claude config to use local version
{
  "command": "mnemosyne-mcp-router",
  "args": []
}
```

## Publishing

```bash
# Bump version
npm version patch  # or minor/major

# Publish to npm
npm publish --access public

# Tag release
git tag v1.0.0
git push origin v1.0.0
```

## Related Projects

- [@zhadyz/mnemosyne-mcp](https://github.com/zhadyz/mnemosyne-mcp) - Main Mnemosyne MCP server
- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP specification

## License

MIT © zhadyz

## Contributing

Submit issues or pull requests via [GitHub repository](https://github.com/zhadyz/mnemosyne-mcp).
