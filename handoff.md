# DeerFlow Handoff (HD)

## 📋 Status Overview
- **Repository**: `~/shadow-stack_local_1/deer-flow` (Cloned & Initialized)
- **Infrastructure**: `nginx` installed via brew. `make install` (uv + pnpm) completed.
- **Config**: 
    - `config.yaml` ➔ Claude 3 Opus/Sonnet (Proxy ready) + local Ollama.
    - `extensions_config.json` ➔ Supermemory MCP + Shadow Stack FS access enabled.
    - `.env` ➔ Placeholders added for all keys.

## ✅ Accomplished
1. **Source Control**: Cloned `bytedance/deer-flow` into the workspace.
2. **Setup**: Successfully ran `make config` and `make install`.
3. **Environment**:
    - Created a model cascade (Opus ➔ Sonnet ➔ Llama 3.2 ➔ Qwen 2.5).
    - Enabled `allow_host_bash` to allow local file modifications.
    - Integrated Supermemory MCP for cross-session project memory.
    - Added local filesystem access MCP to let DeerFlow edit `shadow-stack_local_1` directly.

## ⚠️ Pending / Blockers
- **API Keys**: User action needed in `deer-flow/.env` (ANTHROPIC_API_KEY, SUPERMEMORY_API_KEY).
- **uv Cache Error**: `make dev` failed once due to `/Users/work/.cache/uv` conflict.
- **Verification**: Once keys added, run `make dev` to start the UI.

## 🚀 Next Steps
1. **Fix UV Cache**: Try running with `UV_CACHE_DIR=/tmp/uv_cache make dev`.
2. **Fill Secrets**: User to fill out `deer-flow/.env`.
3. **Launch**: Open `http://localhost:2026` to check the dashboard.
