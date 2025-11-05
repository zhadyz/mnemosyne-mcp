# Mnemosyne MCP 🧠

**FREE Local Embeddings for Knowledge Graph Memory - Zero API Costs**

Mnemosyne MCP is a powerful memory system for AI agents and LLMs, featuring **100% FREE local semantic search** using ONNX Runtime. Never pay for embeddings again!

> Named after Mnemosyne, the Greek goddess of memory and mother of the Muses.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js >= 20](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)

## 🎯 Why Mnemosyne?

### The Problem with Traditional Memory Systems

Most AI memory systems using embeddings require:
- 💸 **Paid API keys** (OpenAI: ~$0.02 per 1M tokens)
- 🔐 **API credentials** to manage
- 🌐 **Internet connection** for every operation
- 🔒 **Privacy concerns** - your data leaves your machine

### The Mnemosyne Solution

✅ **100% FREE** - No API costs, ever
✅ **No API Keys** - Works out of the box
✅ **100% Local** - Complete privacy, data never leaves your machine
✅ **Offline-First** - Works without internet (after initial model download)
✅ **Semantic Search** - Powerful BGE embeddings for intelligent memory retrieval
✅ **Drop-in Replacement** - Compatible with existing MCP workflows

## 📊 Cost Comparison

| Feature | OpenAI (Original) | Mnemosyne (This) |
|---------|-------------------|------------------|
| **Cost** | ~$0.02 per 1M tokens | **FREE** ✅ |
| **API Key** | Required | **Not Required** ✅ |
| **Internet** | Always required | Only for first-time setup |
| **Privacy** | Data sent to OpenAI | **100% Local** ✅ |
| **Speed** | Fast (~100ms) | Medium (~200-500ms) |
| **Quality** | Excellent | Very Good |

## 🚀 Quick Start

### Prerequisites

1. **Node.js** >= 20.0.0
2. **Neo4j** Database ([Download Neo4j Desktop](https://neo4j.com/download/))

### Installation

```bash
# Clone the repository
git clone https://github.com/zhadyz/mnemosyne-mcp.git
cd mnemosyne-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

### Neo4j Setup

1. Install Neo4j Desktop from https://neo4j.com/download/
2. Create a new database instance
3. Set password (we'll use `memento123` in examples)
4. Start the database

### Configuration

Create a `.env` file in the project root:

```bash
# Embedding Provider (local = FREE!)
EMBEDDING_PROVIDER=local

# Local Embedding Model (choose one):
# - Xenova/bge-base-en-v1.5 (768d, ~90MB) - RECOMMENDED
# - Xenova/bge-small-en-v1.5 (384d, ~30MB) - Fastest
# - Xenova/bge-large-en-v1.5 (1024d, ~200MB) - Best quality
# - Xenova/bge-m3 (1024d, ~200MB) - Multilingual
LOCAL_EMBEDDING_MODEL=Xenova/bge-base-en-v1.5

# Neo4j Configuration
NEO4J_URI=bolt://127.0.0.1:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=memento123
NEO4J_DATABASE=neo4j
```

### Claude Desktop Integration

Add to your Claude Desktop config (`~/.config/claude/claude_desktop_config.json` on macOS/Linux or `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "mnemosyne": {
      "command": "node",
      "args": ["/path/to/mnemosyne-mcp/dist/index.js"],
      "env": {
        "NEO4J_URI": "bolt://127.0.0.1:7687",
        "NEO4J_USERNAME": "neo4j",
        "NEO4J_PASSWORD": "memento123",
        "NEO4J_DATABASE": "neo4j",
        "EMBEDDING_PROVIDER": "local",
        "LOCAL_EMBEDDING_MODEL": "Xenova/bge-base-en-v1.5"
      }
    }
  }
}
```

### First Run

On first use, Mnemosyne will automatically download the BGE model (~90MB for base model). This happens once and is cached locally in `~/.cache/huggingface/`.

**Subsequent runs work 100% offline!**

## 🎨 Features

### Core Features

- **Knowledge Graph Memory** - Store entities, observations, and relationships
- **Semantic Search** - Find relevant memories using natural language
- **Temporal Awareness** - Track when information was learned
- **Versioning** - Keep history of all changes
- **Confidence Scoring** - Track reliability of stored information
- **Vector Decay** - Confidence decreases over time (configurable)

### Local Embedding Models

Mnemosyne supports multiple BGE (BAAI General Embedding) models:

| Model | Dimensions | Size | Best For |
|-------|-----------|------|----------|
| **bge-base-en-v1.5** | 768 | ~90MB | Balanced performance (default) |
| **bge-small-en-v1.5** | 384 | ~30MB | Speed and low memory |
| **bge-large-en-v1.5** | 1024 | ~200MB | Maximum accuracy |
| **bge-m3** | 1024 | ~200MB | Multilingual support |

## 📖 Usage Examples

### Create Entities and Memories

```javascript
// Create an entity
{
  "name": "create_entities",
  "arguments": {
    "entities": [{
      "name": "TypeScript",
      "entityType": "programming_language",
      "observations": [
        "Strongly typed superset of JavaScript",
        "Compiles to plain JavaScript",
        "Great for large-scale applications"
      ]
    }]
  }
}

// Search semantically
{
  "name": "semantic_search",
  "arguments": {
    "query": "type-safe languages for web development",
    "limit": 5
  }
}
```

### Build Relationships

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

## 🏗️ Architecture

```
EmbeddingServiceFactory
├── DefaultEmbeddingService (random vectors, testing)
├── OpenAIEmbeddingService (paid, cloud-based)
└── LocalEmbeddingService (FREE, local ONNX) ✨ NEW!
```

All services implement the same `IEmbeddingService` interface, making them completely interchangeable.

### How Local Embeddings Work

1. **ONNX Runtime** - Optimized inference engine for ML models
2. **Transformers.js** - JavaScript library leveraging ONNX Runtime
3. **BGE Models** - State-of-the-art embedding models from BAAI
4. **Vector Normalization** - L2 normalization for similarity search

## 🔧 Development

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build
npm run build

# Development mode (watch)
npm run dev

# Lint and format
npm run fix
```

## 📦 Environment Variables

| Variable | Options | Description |
|----------|---------|-------------|
| `EMBEDDING_PROVIDER` | `auto`, `local`, `openai` | Embedding provider selection |
| `LOCAL_EMBEDDING_MODEL` | BGE model name | Which local model to use |
| `NEO4J_URI` | `bolt://...` | Neo4j connection string |
| `NEO4J_USERNAME` | string | Neo4j username |
| `NEO4J_PASSWORD` | string | Neo4j password |
| `NEO4J_DATABASE` | string | Neo4j database name |

### Provider Selection Logic

- **`auto`** (default): Uses OpenAI if `OPENAI_API_KEY` is present, otherwise falls back to local
- **`local`**: Always uses FREE local embeddings (recommended)
- **`openai`**: Always uses OpenAI embeddings (requires API key)

## 🎓 Credits

This project is a fork of [memento-mcp](https://github.com/gannonh/memento-mcp) by Gannon Hall.

**What we added:**
- ✨ FREE local embeddings using ONNX Runtime
- 🎯 Support for multiple BGE models
- 🔧 Auto-fallback when no API key present
- 📚 Comprehensive configuration options

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.

## 🌟 Star History

If you find Mnemosyne useful, please consider giving it a star! ⭐

---

**Built with** 🧠 by [zhadyz](https://github.com/zhadyz)
**Powered by** ONNX Runtime + Transformers.js + BGE Embeddings
**Free as in freedom, free as in beer** 🍺
