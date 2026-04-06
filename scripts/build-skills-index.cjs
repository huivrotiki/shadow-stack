// scripts/build-skills-index.cjs
// Индексация skills из GitHub репозиториев

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CACHE_DIR = path.join(process.env.HOME, '.cache/zeroclaw-skills');
const INDEX_FILE = path.join(__dirname, '../.state/skills-index.json');
const MAX_FILE_SIZE = 500 * 1024; // 500KB

const REPO_CATEGORIES = {
  'awesome-opencode': 'opencode',
  'agent-zero': 'agent-framework',
  'awesome-openclaw-skills': 'openclaw',
  'awesome-claude-code': 'claude-code',
  'the-book-of-secret-knowledge': 'knowledge',
  '.github': 'templates',
  'build-your-own-x': 'tutorials',
  'awesome': 'curated-lists',
  'awesome-selfhosted': 'selfhosted',
  'awesome-python': 'python',
  'browser-use': 'browser-automation',
  'open-ralph-wiggum': 'ralph-loop'
};

function scanRepo(repoPath, category) {
  const skills = [];
  const findCmd = `find "${repoPath}" -name "*.md" -type f -size -${MAX_FILE_SIZE}c`;
  let files;
  
  try {
    files = execSync(findCmd, { encoding: 'utf8' })
      .split('\n')
      .filter(f => f && !f.includes('node_modules') && !f.includes('.git'));
  } catch (e) {
    console.warn(`Failed to scan ${repoPath}: ${e.message}`);
    return skills;
  }
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(CACHE_DIR, file);
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1] : path.basename(file, '.md');
      const keywords = extractKeywords(content.slice(0, 500));
      
      skills.push({
        title,
        path: relativePath,
        category,
        keywords,
        size: content.length,
        repo: path.basename(path.dirname(file))
      });
    } catch (e) {
      console.warn(`Failed to read ${file}: ${e.message}`);
    }
  }
  
  return skills;
}

function extractKeywords(text) {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3);
  
  const freq = {};
  words.forEach(w => freq[w] = (freq[w] || 0) + 1);
  
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

function buildIndex() {
  console.log('Building skills index...');
  
  const index = {
    updated: new Date().toISOString(),
    repos: [],
    skills: [],
    categories: {}
  };
  
  for (const [repoName, category] of Object.entries(REPO_CATEGORIES)) {
    const repoPath = path.join(CACHE_DIR, repoName);
    
    if (!fs.existsSync(repoPath)) {
      console.warn(`Repo not found: ${repoName}`);
      continue;
    }
    
    console.log(`Scanning ${repoName} (${category})...`);
    const skills = scanRepo(repoPath, category);
    
    index.repos.push({ name: repoName, category, skills: skills.length });
    index.skills.push(...skills);
    
    if (!index.categories[category]) {
      index.categories[category] = 0;
    }
    index.categories[category] += skills.length;
  }
  
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
  
  console.log(`✅ Index built: ${index.skills.length} skills from ${index.repos.length} repos`);
  console.log(`Categories: ${JSON.stringify(index.categories)}`);
}

buildIndex();
