# Step 1.13 — GitOps + MCP

**Status: 🔄 IN PROGRESS**

## Goal

Build GitOps infrastructure for AI-powered development workflow.

## Architecture

```
Shadow Stack Widget
└── server/index.js (Express, port 3001)
     └── POST /api/gitops
          ├── createIssue     ✅ DONE
          └── createPullRequest ✅ DONE
```

## API Endpoints

### GET /api/gitops

Health check and info.

### POST /api/gitops

```json
{
  "action": "createIssue",
  "params": {
    "title": "Issue title",
    "body": "Issue body",
    "labels": ["bug", "enhancement"]
  }
}
```

```json
{
  "action": "createPullRequest",
  "params": {
    "head": "feature-branch",
    "base": "main",
    "title": "PR title",
    "body": "PR description"
  }
}
```

## Testing

```bash
npm run api  # Start server on port 3001

# Test GET
curl http://localhost:3001/api/gitops

# Test createIssue
curl -X POST http://localhost:3001/api/gitops \
  -H "Content-Type: application/json" \
  -d '{"action":"createIssue","params":{"title":"Test","body":"Body"}}'
```

## Sub-steps

- [x] 1.13.0 — Doppler secrets setup
- [x] 1.13.1 — GitOps v0: createIssue
- [x] 1.13.2 — GitOps v1: createPullRequest
- [ ] 1.13.3 — GitOps v2: createCommit, queryFiles
- [ ] 1.13.4 — Telegram bot /issue command
- [ ] 1.13.5 — Slack bot /gitops-issue
- [ ] 1.13.6 — OpenCode agent skill
- [ ] 1.13.7 — MCP stdio client (R&D)
