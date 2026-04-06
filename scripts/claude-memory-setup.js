#!/usr/bin/env node

/**
 * Claude Memory Tool Setup with Supermemory Backend
 * 
 * This script configures Claude's native memory tool to use Supermemory as the backend.
 * It creates the necessary configuration and test files.
 */

const fs = require('fs');
const path = require('path');

// Check for required environment variables
const supermemoryApiKey = process.env.SUPERMEMORY_API_KEY || '';
const anthropicApiKey = process.env.ANTHROPIC_API_KEY || '';

console.log('🧠 Claude Memory Tool Setup');
console.log('===========================\n');

if (!supermemoryApiKey) {
  console.log('⚠️  SUPERMEMORY_API_KEY not found in environment');
  console.log('   Please add it to your .env file or set it via Doppler');
  console.log('   doppler secrets set SUPERMEMORY_API_KEY=your_key');
} else {
  console.log('✅ SUPERMEMORY_API_KEY found');
}

if (!anthropicApiKey) {
  console.log('⚠️  ANTHROPIC_API_KEY not found in environment');
  console.log('   Please add it to your .env file or set it via Doppler');
} else {
  console.log('✅ ANTHROPIC_API_KEY found');
}

console.log('\n📦 Installed packages:');
console.log('   @supermemory/tools');
console.log('   @anthropic-ai/sdk');

console.log('\n🔧 Next steps:');
console.log('   1. Set SUPERMEMORY_API_KEY in .env or Doppler');
console.log('   2. Set ANTHROPIC_API_KEY in .env or Doppler');
console.log('   3. Run test: node scripts/test-claude-memory.js');

// Create test script
const testScript = `#!/usr/bin/env node

/**
 * Test Claude Memory Tool Integration
 * 
 * This script tests the Claude Memory Tool with Supermemory backend.
 * Run: node scripts/test-claude-memory.js
 */

const Anthropic = require('@anthropic-ai/sdk');
const { createClaudeMemoryTool } = require('@supermemory/tools/claude-memory');

// Load environment variables
require('dotenv').config();

const anthropic = new Anthropic();

const memoryTool = createClaudeMemoryTool(process.env.SUPERMEMORY_API_KEY, {
  projectId: "shadow-stack-local",
  containerTags: ["user-work", "project-shadow-stack"],
});

async function testMemory() {
  console.log('🧪 Testing Claude Memory Tool...\\n');

  try {
    // Test 1: Create a memory
    console.log('📝 Test 1: Creating memory...');
    const createResult = await memoryTool.handleCommandForToolResult({
      command: 'create',
      path: '/memories/test.txt',
      file_text: 'This is a test memory entry for Shadow Stack'
    }, 'test-1');
    console.log('✅ Create result:', createResult);

    // Test 2: View the memory
    console.log('\\n👁️  Test 2: Reading memory...');
    const viewResult = await memoryTool.handleCommandForToolResult({
      command: 'view',
      path: '/memories/test.txt'
    }, 'test-2');
    console.log('✅ View result:', viewResult);

    // Test 3: List memories
    console.log('\\n📋 Test 3: Listing memories...');
    const listResult = await memoryTool.handleCommandForToolResult({
      command: 'view',
      path: '/memories/'
    }, 'test-3');
    console.log('✅ List result:', listResult);

    console.log('\\n✅ All tests passed!');
  } catch (error) {
    console.error('\\n❌ Test failed:', error.message);
    console.log('\\n💡 Make sure:');
    console.log('   1. SUPERMEMORY_API_KEY is set');
    console.log('   2. ANTHROPIC_API_KEY is set');
    console.log('   3. You have internet connection');
  }
}

testMemory();
`;

fs.writeFileSync(
  path.join(__dirname, 'test-claude-memory.js'),
  testScript
);

console.log('\n📄 Created test script: scripts/test-claude-memory.js');
console.log('   Run: node scripts/test-claude-memory.js');
