#!/usr/bin/env node

/**
 * Test script to verify Mnemosyne router is detecting databases correctly
 * Run from different directories to see database routing
 *
 * Usage:
 *   node test-router.js
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findProjectRoot(startDir) {
  let currentDir = path.resolve(startDir);
  const root = path.parse(currentDir).root;

  while (currentDir !== root) {
    const mnemosynePath = path.join(currentDir, '.mnemosyne');
    if (fs.existsSync(mnemosynePath)) {
      return { root: currentDir, configFile: mnemosynePath, type: '.mnemosyne' };
    }

    const envPath = path.join(currentDir, '.env');
    if (fs.existsSync(envPath)) {
      return { root: currentDir, configFile: envPath, type: '.env' };
    }

    currentDir = path.dirname(currentDir);
  }

  return null;
}

function parseEnvFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const config = {};

  content.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;

    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      config[key] = value;
    }
  });

  return config;
}

function getDatabaseName(projectInfo) {
  if (!projectInfo) return 'neo4j';

  const config = parseEnvFile(projectInfo.configFile);
  return config.MNEMOSYNE_DATABASE || config.NEO4J_DATABASE || 'neo4j';
}

// Main test
console.log('='.repeat(70));
console.log('🧪 MNEMOSYNE ROUTER TEST');
console.log('='.repeat(70));

const cwd = process.cwd();
console.log(`\n📁 Current Directory: ${cwd}`);

const projectInfo = findProjectRoot(cwd);

if (projectInfo) {
  console.log(`\n✅ Found project configuration:`);
  console.log(`   Root:        ${projectInfo.root}`);
  console.log(`   Config file: ${projectInfo.configFile}`);
  console.log(`   Type:        ${projectInfo.type}`);

  const config = parseEnvFile(projectInfo.configFile);
  console.log(`\n📋 Configuration:`);
  Object.entries(config).forEach(([key, value]) => {
    console.log(`   ${key.padEnd(25)} = ${value}`);
  });

  const dbName = getDatabaseName(projectInfo);
  console.log(`\n🎯 Target Database: ${dbName}`);

  if (dbName === 'neo4j') {
    console.log(`   ⚠️  Using global database (default)`);
  } else {
    console.log(`   ✅ Using project-specific database`);
  }
} else {
  console.log(`\n❌ No project configuration found`);
  console.log(`   Will use default global database: neo4j`);
  console.log(`\n💡 To configure for this project:`);
  console.log(`   1. Create .mnemosyne file in project root`);
  console.log(`   2. Add: MNEMOSYNE_DATABASE=your_db_name`);
  console.log(`   3. Create database in Neo4j: CREATE DATABASE your_db_name;`);
}

console.log('\n' + '='.repeat(70));
console.log('✨ Test complete!');
console.log('='.repeat(70) + '\n');

// Exit with status code
process.exit(projectInfo && getDatabaseName(projectInfo) !== 'neo4j' ? 0 : 1);
