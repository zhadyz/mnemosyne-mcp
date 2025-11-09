#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname, parse } from 'path';

/**
 * Mnemosyne MCP Router
 *
 * Dynamically routes to the correct Neo4j database based on project configuration.
 * Walks up directory tree from current working directory to find .mnemosyne or .env files.
 *
 * Configuration priority:
 * 1. .mnemosyne (dedicated config - preferred)
 * 2. .env (fallback)
 * 3. neo4j (global patterns database - default)
 */

interface ProjectConfig {
  root: string;
  configFile: string;
  type: '.mnemosyne' | '.env';
}

interface ProjectMetadata {
  name: string;
  retention_days: number;
  auto_cleanup: boolean;
  isolation_level: string;
}

/**
 * Walk up directory tree to find project configuration
 */
function findProjectRoot(startDir: string): ProjectConfig | null {
  let currentDir = resolve(startDir);
  const root = parse(currentDir).root;

  while (currentDir !== root) {
    // Check for .mnemosyne (dedicated config - preferred)
    const mnemosynePath = resolve(currentDir, '.mnemosyne');
    if (existsSync(mnemosynePath)) {
      return { root: currentDir, configFile: mnemosynePath, type: '.mnemosyne' };
    }

    // Check for .env (fallback)
    const envPath = resolve(currentDir, '.env');
    if (existsSync(envPath)) {
      return { root: currentDir, configFile: envPath, type: '.env' };
    }

    currentDir = dirname(currentDir);
  }

  return null;
}

/**
 * Parse environment file for configuration
 */
function parseEnvFile(filePath: string): Record<string, string> {
  const content = readFileSync(filePath, 'utf8');
  const config: Record<string, string> = {};

  content.split('\n').forEach((line) => {
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
 * Extract database name from project configuration
 */
function getDatabaseName(projectInfo: ProjectConfig | null): string {
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
 * Extract project metadata from configuration
 */
function getProjectMetadata(projectInfo: ProjectConfig | null): ProjectMetadata | null {
  if (!projectInfo) return null;

  const config = parseEnvFile(projectInfo.configFile);

  return {
    name: config.PROJECT_NAME || parse(projectInfo.root).base,
    retention_days: config.RETENTION_DAYS ? parseInt(config.RETENTION_DAYS, 10) : 90,
    auto_cleanup: config.AUTO_CLEANUP === 'true',
    isolation_level: config.ISOLATION_LEVEL || 'project',
  };
}

/**
 * Main router entry point
 */
async function main() {
  const cwd = process.cwd();

  console.error('============================================================');
  console.error('[Mnemosyne Router] Starting...');
  console.error(`[Mnemosyne Router] Working directory: ${cwd}`);

  // Find project configuration
  const projectInfo = findProjectRoot(cwd);

  if (projectInfo) {
    console.error(`[Mnemosyne Router] Project root: ${projectInfo.root}`);
    console.error(`[Mnemosyne Router] Config file: ${projectInfo.configFile}`);
  }

  // Get database name and metadata
  const dbName = getDatabaseName(projectInfo);
  const metadata = getProjectMetadata(projectInfo);

  if (metadata) {
    console.error(`[Mnemosyne Router] Project: ${metadata.name}`);
  }

  console.error(`[Mnemosyne Router] Target database: ${dbName}`);
  console.error('============================================================');

  // Set environment variable for database
  process.env.NEO4J_DATABASE = dbName;

  // Set optional project metadata
  if (metadata && projectInfo) {
    process.env.MNEMOSYNE_PROJECT_NAME = metadata.name;
    process.env.MNEMOSYNE_PROJECT_ROOT = projectInfo.root;
    process.env.MNEMOSYNE_RETENTION_DAYS = metadata.retention_days.toString();
    process.env.MNEMOSYNE_AUTO_CLEANUP = metadata.auto_cleanup.toString();
    process.env.MNEMOSYNE_ISOLATION_LEVEL = metadata.isolation_level;
  }

  // Import and run the actual MCP server
  await import('./index.js');
}

// Run router
main().catch((error) => {
  console.error('[Mnemosyne Router] Fatal error:', error);
  process.exit(1);
});
