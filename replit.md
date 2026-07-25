# Seamless Bridge — All-in-One AI Platform

A React + Express web app that provides a unified interface for accessing multiple leading AI models (GPT, Claude, Gemini, DeepSeek, Grok, and more) in one seamless workspace.

## How to run

```
npm run dev
```

Server starts on port 5000. The Vite dev server is embedded — no separate frontend process needed.

## Required secrets

| Secret | Purpose |
|---|---|
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Authenticates server-side chat requests through Replit LLM Gateway |

Set these in the Replit Secrets panel.

## Architecture

- **Frontend**: React 19 + Vite + Tailwind CSS v4
- **Backend**: Express (TypeScript, run with `tsx`)
- **AI**: Replit LLM Gateway (OpenAI-compatible streaming SSE) via `/api/chat`
- **Theme**: Dark/light toggle, persisted to localStorage

## Key files

| File | Role |
|---|---|
| `src/App.tsx` | Landing page, routing, nav |
| `src/components/ChatPage.tsx` | Full-screen chat interface with sidebar |
| `src/components/ModelSelector.tsx` | Model picker dropdown |
| `src/lib/models.ts` | AI model definitions and Gemini mapping |
| `server.ts` | Express server + `/api/chat` streaming endpoint |

## Pages / routes (client-side tab routing)

- `home` — Landing page with hero + chat input + AI marquee
- `chat` — Full-screen chat with sidebar, history, model selector
- `about`, `impact`, `faq`, `privacy`, `terms`, `contact`, `security` — Info pages

## User preferences

- Keep the dark theme as default
- Preserve the zinc color palette and existing visual style
