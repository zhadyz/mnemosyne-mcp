#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Find project root by looking for .mnemosyne or .env file
 * Walks up directory tree from current working directory
 */
function findProjectRoot(startDir) {
  let currentDir = path.resolve(startDir);
  const root = path.parse(currentDir).root;

  while (currentDir !== root) {
    // Check for .mnemosyne (dedicated config - preferred)
    const mnemosynePath = path.join(currentDir, '.mnemosyne');
    if (fs.existsSync(mnemosynePath)) {
      return { root: currentDir, configFile: mnemosynePath, type: '.mnemosyne' };
    }

    // Check for .env (fallback)
    const envPath = path.join(currentDir, '.env');
    if (fs.existsSync(envPath)) {
      return { root: currentDir, configFile: envPath, type: '.env' };
    }

    currentDir = path.dirname(currentDir);
  }

  return null;
}

/**
 * Parse simple KEY=VALUE format (subset of .env parsing)
 */
function parseEnvFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const config = {};

  content.split('\n').forEach(line => {
    line = line.trim();

    // Skip comments and empty lines
    if (!line || line.startsWith('#')) return;

    // Parse KEY=VALUE
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();

      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      config[key] = value;
    }
  });

  return config;
}

/**
 * Determine which Neo4j database to use
 */
function getDatabaseName(projectInfo) {
  if (!projectInfo) {
    console.error('[Mnemosyne Router] No project config found - using global database: neo4j');
    return 'neo4j';
  }

  const config = parseEnvFile(projectInfo.configFile);
  const dbName = config.MNEMOSYNE_DATABASE || config.NEO4J_DATABASE;

  if (dbName) {
    console.error(`[Mnemosyne Router] Found database in ${projectInfo.type}: ${dbName}`);
    return dbName;
  }

  console.error('[Mnemosyne Router] No MNEMOSYNE_DATABASE specified - using global database: neo4j');
  return 'neo4j';
}

/**
 * Get project metadata for logging and potential future features
 */
function getProjectMetadata(projectInfo) {
  if (!projectInfo) return null;

  const config = parseEnvFile(projectInfo.configFile);
  return {
    name: config.PROJECT_NAME || path.basename(projectInfo.root),
    database: config.MNEMOSYNE_DATABASE || config.NEO4J_DATABASE || 'neo4j',
    retention_days: config.RETENTION_DAYS ? parseInt(config.RETENTION_DAYS) : 90,
    auto_cleanup: config.AUTO_CLEANUP !== 'false', // default true
    isolation_level: config.ISOLATION_LEVEL || 'project'
  };
}

// Main execution
async function main() {
  const cwd = process.cwd();

  console.error('='.repeat(60));
  console.error('[Mnemosyne Router] Starting...');
  console.error(`[Mnemosyne Router] Working directory: ${cwd}`);

  // Find project configuration
  const projectInfo = findProjectRoot(cwd);

  if (projectInfo) {
    console.error(`[Mnemosyne Router] Project root: ${projectInfo.root}`);
    console.error(`[Mnemosyne Router] Config file: ${projectInfo.configFile}`);
  } else {
    console.error('[Mnemosyne Router] No project config found');
  }

  // Determine database
  const dbName = getDatabaseName(projectInfo);
  const metadata = getProjectMetadata(projectInfo);

  if (metadata) {
    console.error(`[Mnemosyne Router] Project: ${metadata.name}`);
    console.error(`[Mnemosyne Router] Retention: ${metadata.retention_days} days`);
    console.error(`[Mnemosyne Router] Isolation: ${metadata.isolation_level}`);
  }

  console.error(`[Mnemosyne Router] Target database: ${dbName}`);
  console.error('='.repeat(60));

  // Prepare environment for Mnemosyne MCP server
  const env = {
    ...process.env,
    NEO4J_DATABASE: dbName,
    // Pass project metadata as env vars for potential use by MCP server
    ...(metadata ? {
      MNEMOSYNE_PROJECT_NAME: metadata.name,
      MNEMOSYNE_PROJECT_ROOT: projectInfo.root,
      MNEMOSYNE_RETENTION_DAYS: metadata.retention_days.toString(),
      MNEMOSYNE_AUTO_CLEANUP: metadata.auto_cleanup.toString(),
      MNEMOSYNE_ISOLATION_LEVEL: metadata.isolation_level
    } : {})
  };

  // Spawn the actual @zhadyz/mnemosyne-mcp server
  const child = spawn('npx', ['-y', '@zhadyz/mnemosyne-mcp'], {
    env,
    stdio: 'inherit',
    shell: true
  });

  // Handle exit
  child.on('error', (err) => {
    console.error('[Mnemosyne Router] Error spawning MCP server:', err);
    process.exit(1);
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      console.error(`[Mnemosyne Router] MCP server killed by signal: ${signal}`);
      process.exit(1);
    } else {
      console.error(`[Mnemosyne Router] MCP server exited with code: ${code}`);
      process.exit(code || 0);
    }
  });

  // Handle termination signals
  process.on('SIGTERM', () => {
    console.error('[Mnemosyne Router] Received SIGTERM, shutting down...');
    child.kill('SIGTERM');
  });

  process.on('SIGINT', () => {
    console.error('[Mnemosyne Router] Received SIGINT, shutting down...');
    child.kill('SIGINT');
  });
}

main().catch(err => {
  console.error('[Mnemosyne Router] Fatal error:', err);
  process.exit(1);
});
