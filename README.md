# Mnemosyne MCP

Knowledge graph memory for AI agents with local semantic search. Zero API costs.

> Named after Mnemosyne, the Greek goddess of memory and mother of the Muses.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js >= 20](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)

## Overview

Mnemosyne provides persistent memory for AI agents using Neo4j knowledge graphs and local vector embeddings. Unlike traditional solutions requiring paid API access, Mnemosyne runs embeddings locally via ONNX Runtime.

**Key Features:**
- Local semantic search with BGE embeddings
- No API keys or external dependencies
- Works offline after initial setup
- Compatible with Model Context Protocol (MCP)
- Drop-in replacement for cloud-based solutions

## Performance Comparison

| Metric | Cloud Services | Mnemosyne |
|--------|---------------|-----------|
| Cost | ~$0.02/1M tokens | Free |
| API Key | Required | None |
| Network | Always required | Initial download only |
| Privacy | External | Local |
| Latency | ~100ms | ~200-500ms |

## Installation

### Prerequisites

- Node.js >= 20.0.0
- Neo4j Database ([Download](https://neo4j.com/download/))

### Quick Start (NPM)

```bash
npx @zhadyz/mnemosyne-mcp
```

### From Source

```bash
git clone https://github.com/zhadyz/mnemosyne-mcp.git
cd mnemosyne-mcp
npm install
npm run build
```

### Neo4j Setup

1. Install Neo4j Desktop
2. Create a database instance
3. Set credentials (default password: `neo4j`)
4. Start the database (default port: 7687)

### Environment Configuration

Create `.env` in project root:

```bash
EMBEDDING_PROVIDER=local
LOCAL_EMBEDDING_MODEL=Xenova/bge-base-en-v1.5

NEO4J_URI=bolt://127.0.0.1:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=neo4j
# NEO4J_DATABASE - Automatically set by router based on project config
```

## Multi-Project Database Routing

Mnemosyne includes **built-in dynamic database routing** that automatically selects the correct Neo4j database based on your current project.

### Why Use Multi-Database Architecture?

**Performance at Scale:**
- Query 10⁴ entities instead of 10⁵+ in monolithic architecture
- O(log n) query complexity through database partitioning
- Linear project addition without performance degradation

**Project Isolation:**
- Namespace separation prevents cross-contamination of knowledge graphs
- Each project gets its own isolated database
- Global patterns database for cross-project learnings

### Setup

**1. Create project databases in Neo4j:**
```cypher
CREATE DATABASE my_project_db IF NOT EXISTS;
CREATE DATABASE another_project_db IF NOT EXISTS;
```

**2. Add `.mnemosyne` file to each project root:**
```bash
# Project-specific database name (required)
MNEMOSYNE_DATABASE=my_project_db

# Optional metadata
PROJECT_NAME=My Project
RETENTION_DAYS=90
AUTO_CLEANUP=true
ISOLATION_LEVEL=project
```

**3. Router automatically detects database:**
```
Your Projects:
├─ project-alpha/
│  └─ .mnemosyne          → MNEMOSYNE_DATABASE=alpha_db
│     Routes to "alpha_db" database ✓
│
├─ project-beta/
│  └─ .mnemosyne          → MNEMOSYNE_DATABASE=beta_db
│     Routes to "beta_db" database ✓
│
└─ unconfigured-project/
   No .mnemosyne → Routes to "neo4j" (global patterns) ✓
```

The router walks up the directory tree from your current working directory, finds `.mnemosyne` or `.env`, and routes to the specified database. If no config is found, it defaults to `neo4j` (global patterns database).

**Template:**
Copy the included template to your project:
```bash
cp node_modules/@zhadyz/mnemosyne-mcp/.mnemosyne.template .mnemosyne
# Edit MNEMOSYNE_DATABASE to your database name
```

## Claude Integration

### Claude Code (Recommended)

Add Mnemosyne to Claude Code with a single command:

```bash
claude mcp add --scope user mnemosyne -- npx -y @zhadyz/mnemosyne-mcp
```

Verify it's installed:
```bash
claude mcp list
```

You should see `mnemosyne: npx -y @zhadyz/mnemosyne-mcp - ✓ Connected`

**Default Configuration:**
- Neo4j URI: `bolt://localhost:7687`
- Username/Password: `neo4j` / `neo4j`
- Database: Automatic (via router - `neo4j` if no `.mnemosyne` file found)
- Embeddings: Local (BGE base-en-v1.5, 768 dimensions)

**Custom Neo4j Setup:**
If you use different credentials, edit `~/.claude.json` and add environment variables:

```bash
claude mcp add --scope user mnemosyne \
  -e NEO4J_PASSWORD=your_password \
  -- npx -y @zhadyz/mnemosyne-mcp
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mnemosyne": {
      "command": "npx",
      "args": ["-y", "@zhadyz/mnemosyne-mcp"],
      "env": {
        "NEO4J_URI": "bolt://127.0.0.1:7687",
        "NEO4J_USERNAME": "neo4j",
        "NEO4J_PASSWORD": "neo4j",
        "EMBEDDING_PROVIDER": "local",
        "LOCAL_EMBEDDING_MODEL": "Xenova/bge-base-en-v1.5"
      }
    }
  }
}
```

### Local Development

```json
{
  "mcpServers": {
    "mnemosyne": {
      "command": "node",
      "args": ["/absolute/path/to/mnemosyne-mcp/dist/router.js"],
      "env": {
        "NEO4J_URI": "bolt://127.0.0.1:7687",
        "NEO4J_USERNAME": "neo4j",
        "NEO4J_PASSWORD": "neo4j",
        "EMBEDDING_PROVIDER": "local",
        "LOCAL_EMBEDDING_MODEL": "Xenova/bge-base-en-v1.5"
      }
    }
  }
}
```

## Embedding Models

Mnemosyne supports multiple BGE models:

| Model | Dimensions | Size | Use Case |
|-------|-----------|------|----------|
| bge-base-en-v1.5 | 768 | 90MB | Balanced (default) |
| bge-small-en-v1.5 | 384 | 30MB | Resource-constrained |
| bge-large-en-v1.5 | 1024 | 200MB | Maximum accuracy |
| bge-m3 | 1024 | 200MB | Multilingual |

Models download automatically on first use and cache to `~/.cache/huggingface/`.

## Usage

### Create Entities

```javascript
{
  "name": "create_entities",
  "arguments": {
    "entities": [{
      "name": "TypeScript",
      "entityType": "programming_language",
      "observations": [
        "Strongly typed superset of JavaScript",
        "Compiles to JavaScript",
        "Static type checking"
      ]
    }]
  }
}
```

### Semantic Search

```javascript
{
  "name": "semantic_search",
  "arguments": {
    "query": "type-safe languages for web development",
    "limit": 5
  }
}
```

### Create Relations

```javascript
{
  "name": "create_relations",
  "arguments": {
    "relations": [{
      "from": "TypeScript",
      "to": "JavaScript",
      "relationType": "compiles_to"
    }]
  }
}
```

## Architecture

```
EmbeddingServiceFactory
├── DefaultEmbeddingService (testing)
├── OpenAIEmbeddingService (cloud)
└── LocalEmbeddingService (ONNX)
```

All services implement `IEmbeddingService`, enabling seamless provider swapping.

### Local Embeddings Stack

- **ONNX Runtime:** Optimized ML inference
- **Transformers.js:** JavaScript ML library
- **BGE Models:** BAAI general embeddings
- **L2 Normalization:** Vector similarity search

## Development

```bash
npm test              # Run tests
npm run test:watch    # Watch mode
npm run build         # Build
npm run dev           # Development mode
npm run fix           # Lint and format
```

## Configuration

| Variable | Options | Description |
|----------|---------|-------------|
| `EMBEDDING_PROVIDER` | `auto`, `local`, `openai` | Provider selection |
| `LOCAL_EMBEDDING_MODEL` | BGE model name | Local model choice |
| `NEO4J_URI` | `bolt://...` | Database connection |
| `NEO4J_USERNAME` | string | Database user |
| `NEO4J_PASSWORD` | string | Database password |
| `NEO4J_DATABASE` | string | Database name |

**Provider Selection:**
- `auto`: OpenAI if API key present, otherwise local
- `local`: Always use local embeddings
- `openai`: Always use OpenAI (requires API key)

## Credits

Forked from [memento-mcp](https://github.com/gannonh/memento-mcp) by Gannon Hall.

**Additions:**
- Local ONNX embedding support
- BGE model integration
- Auto-fallback configuration
- Zero-dependency operation

## License

MIT License - see [LICENSE](LICENSE) file.

## Contributing

Pull requests welcome.

---

Built by [zhadyz](https://github.com/zhadyz)
Powered by ONNX Runtime + Transformers.js + BGE Embeddings
