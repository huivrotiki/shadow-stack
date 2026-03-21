# Shadow Stack Widget v3.2

![CI](https://github.com/huivrotiki/shadow-stack-widget/actions/workflows/ci.yml/badge.svg)
![Node](https://img.shields.io/badge/node-22.x-green)
![Electron](https://img.shields.io/badge/electron-41-blue)
![Platform](https://img.shields.io/badge/platform-macOS%20|%20Linux%20|%20Windows-lightgrey)

> AI-powered dev setup autopilot widget — Electron + React + Vite + Tailwind

## What is this?

Shadow Stack Widget is a desktop overlay (Electron app) that automates your full AI dev stack setup on macOS — step by step, with an AI autopilot button for each step.

## Steps (0-11)

| #   | Step                            | Description                                |
| --- | ------------------------------- | ------------------------------------------ |
| 0   | Разведка и аудит                | System audit: chip, memory, disk, software |
| 1   | Homebrew, Node.js, Python       | Install core tools                         |
| 2   | Ollama + локальные модели       | Local LLM runtime                          |
| 3   | OpenClaw Agent                  | AI agent framework                         |
| 4   | NeMo Agent Toolkit              | NVIDIA agent toolkit                       |
| 5   | OpenCode SDK                    | AI coding SDK                              |
| 6   | Vercel AI SDK 6 + ToolLoopAgent | Vercel AI + tool loop                      |
| 7   | Playwright MCP + Shadow Chrome  | Browser automation                         |
| 8   | Supabase + Postgres             | Database layer                             |
| 9   | Langfuse Observability          | LLM tracing                                |
| 10  | Tailscale VPN Mesh              | Secure networking                          |
| 11  | Telegram Bot Alerts             | Notifications                              |

## Quick Start

```bash
bash bootstrap-shadow-widget.sh
```

Or manually:

```bash
git clone https://github.com/huivrotiki/shadow-stack-widget.git
cd shadow-stack-widget
npm install
npm run start
```

## Features

- Always-on-top desktop widget
- Draggable, resizable, fullscreen support
- AI Autopilot button per step
- Global "AI Autopilot (all)" button
- Progress bar with step counter
- Error reporting to Comet/Opik with auto-fix
- Headless mode: `npm run headless`
- Dock icon for quick launch

## Stack

- **Electron 41** — desktop shell
- **React 19** — UI
- **Vite 6** — bundler
- **Tailwind CSS 4** — styling
- **lucide-react** — icons

## Scripts

```bash
npm run dev          # Vite dev server only
npm run start        # Electron + Vite together
npm run build        # Production build
npm run pack         # Package as .app
npm run dist         # Build distributable
npm run kill-port    # Free port 5175
npm run api          # Start GitOps API (port 3001)
npm run api:dev      # Start GitOps API with watch mode
```

## Migration Phases

| Phase    | Status         | Description                         |
| -------- | -------------- | ----------------------------------- |
| **0**    | ✅ Complete    | Audit and preparation               |
| **1**    | 🔄 In Progress | Pre-migration (Go-live: 2026-04-04) |
| **1.13** | 🔄 95%         | GitOps + MCP                        |
| **2**    | ⏳ Planned     | Migration (Go-live: 2026-04-05)     |
| **3**    | ⏳ Planned     | Post-migration (2026-04-12)         |

See `phase-*/README.md` for details.

## Repo

https://github.com/huivrotiki/shadow-stack-widget
