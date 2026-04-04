'use strict';
// factory/deployer.cjs — Netlify Deployer for Agent Factory
// Deploys build directories to Netlify using https module (no external deps)

const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Deploy a build directory to Netlify
 * @param {object} opts
 * @param {string} opts.buildDir - Path to build directory
 * @param {string} opts.buildId - Build identifier
 * @param {string} [opts.siteName] - Custom site name
 * @returns {Promise<object>} { url, siteId, deployId, adminUrl }
 */
async function deploy(opts) {
  const { buildDir, buildId } = opts;
  const token = process.env.NETLIFY_AUTH_TOKEN;

  if (!token) {
    throw new Error('NETLIFY_AUTH_TOKEN not set. Add it to .env');
  }

  if (!fs.existsSync(buildDir)) {
    throw new Error(`Build directory not found: ${buildDir}`);
  }

  const siteName = opts.siteName || `af-${buildId}`.slice(0, 60).replace(/[^a-z0-9-]/g, '-');

  // Step 1: Create site
  let site;
  try {
    site = await netlifyApi('POST', '/api/v1/sites', token, { name: siteName });
  } catch (err) {
    if (err.statusCode === 422) {
      const fallbackName = `${siteName}-${Date.now().toString(36)}`;
      site = await netlifyApi('POST', '/api/v1/sites', token, { name: fallbackName });
    } else {
      throw err;
    }
  }

  // Step 2: Collect files and compute SHA1 hashes
  const files = collectFiles(buildDir);
  const fileHashes = {};
  const hashToFile = {};

  for (const file of files) {
    const relPath = '/' + path.relative(buildDir, file).replace(/\\/g, '/');
    const content = fs.readFileSync(file);
    const hash = crypto.createHash('sha1').update(content).digest('hex');
    fileHashes[relPath] = hash;
    hashToFile[hash] = file;
  }

  // Step 3: Create deploy with file digest
  const deployData = await netlifyApi('POST', `/api/v1/sites/${site.id}/deploys`, token, {
    files: fileHashes,
    draft: false,
  });

  // Step 4: Upload required files
  const required = deployData.required || [];
  for (const hash of required) {
    const filePath = hashToFile[hash];
    if (!filePath) continue;

    const content = fs.readFileSync(filePath);
    const relPath = '/' + path.relative(buildDir, filePath).replace(/\\/g, '/');

    await netlifyUpload(`/api/v1/deploys/${deployData.id}/files${relPath}`, token, content);
  }

  // Step 5: Update build manifest
  const manifestPath = path.join(buildDir, 'build.json');
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    manifest.status = 'deployed';
    manifest.deploy = {
      url: `https://${site.subdomain || site.name}.netlify.app`,
      siteId: site.id,
      deployId: deployData.id,
      adminUrl: site.admin_url,
      deployedAt: new Date().toISOString(),
    };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  }

  return {
    url: `https://${site.subdomain || site.name}.netlify.app`,
    siteId: site.id,
    deployId: deployData.id,
    adminUrl: site.admin_url,
  };
}

/**
 * Make an HTTPS request to the Netlify API
 */
function netlifyApi(method, endpoint, token, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.netlify.com',
      path: endpoint,
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'AgentFactory/1.0',
      },
    };
    if (data) options.headers['Content-Length'] = Buffer.byteLength(data);

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 400) {
            const err = new Error(`Netlify API ${res.statusCode}: ${JSON.stringify(parsed.errors || parsed.error || parsed.message)}`);
            err.statusCode = res.statusCode;
            reject(err);
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject(new Error(`Invalid JSON from Netlify: ${body.slice(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Netlify API timeout')); });

    if (data) req.write(data);
    req.end();
  });
}

/**
 * Upload a file to a Netlify deploy
 */
function netlifyUpload(endpoint, token, content) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.netlify.com',
      path: endpoint,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
        'Content-Length': content.length,
        'User-Agent': 'AgentFactory/1.0',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(body));
    });

    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Upload timeout')); });
    req.write(content);
    req.end();
  });
}

/**
 * Collect all deployable files in a directory
 */
function collectFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.name === 'build.json' || entry.name === '.DS_Store') continue;
    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Check if Netlify token is configured
 */
function isConfigured() {
  return !!process.env.NETLIFY_AUTH_TOKEN;
}

module.exports = { deploy, isConfigured };
