# Agents & Free Tokens - Setup Cheat-Sheet

Goal: many AI coding agents + big combined free token budget, for $0. Personal use + hackathon.

## Mental model (keep these separate)

- **Agents** = the hands (OpenCode, Aider, Gemini CLI, Claude Code). They edit code.
- **Models** = the brain/fuel (free provider tokens). Agents call models.
- **Gateway** = pools many free provider keys behind ONE endpoint, auto-rotates + falls back on rate-limit.

More tokens = more free *model* keys, pooled through a gateway, fed to your agents.

```
Agents (OpenCode / Aider / Claude Code / Gemini CLI)
        |
   Gateway (localhost, OpenAI-compatible)  <- rotates keys, fallback on 429/5xx
        |
Your own free keys: Mistral + Groq + Cerebras + Gemini + Cohere + ...
```

## The gateway (the key piece)

### freellmapi (recommended) - github.com/tashfeenahmed/freellmapi
- ~7.4B tokens/month across 34 providers, 635 endpoints. MIT. ~23.8k stars.
- One OpenAI-compatible endpoint at localhost. Auto key-rotation + fallback (cools a 429'd key, retries next). Per-key RPM/TPM counters stop quota violations.
- Works with Claude Code, OpenCode, Aider, Cline, Cursor, Goose. Auto-config: `npx freellmapi setup-claude`, `setup-aider`, etc.
- Uses YOUR OWN provider keys (legit) - keys stay local (encrypted SQLite).
- Install: `curl -fsSL https://freellmapi.co/install.sh | bash` -> dashboard at http://localhost:3001

### Backup: free-llm-gateway - github.com/MrFadiAi/free-llm-gateway
- 24+ providers, 260+ models. Python, MIT. Simpler. Endpoint http://localhost:8080/v1. Add keys in `.env`.

### Lighter proxy: Mirrowel/LLM-API-Key-Proxy
- FastAPI, key rotation + failover, Claude/Cursor compatible. Good if freellmapi feels heavy.

## Free MODEL keys to collect (no credit card)

| Provider | Free budget | Coding model | Signup |
|----------|-------------|--------------|--------|
| Mistral | ~1B tok/month (opt into data training) | `devstral` / `codestral` | console.mistral.ai |
| Cerebras | ~1M tok/day, very fast | `gpt-oss-120b` | cloud.cerebras.ai |
| Groq | 14,400 req/day, fast | `llama-3.3-70b-versatile` | console.groq.com |
| Gemini | Flash free, 1M context | `gemini-flash` | aistudio.google.com |
| Cohere | 1,000 calls/month (trial) | command models | dashboard.cohere.com |
| OpenRouter | 50 req/day free (1000 w/ $10) | aggregates 20+ free | openrouter.ai |

Each provider = separate bucket. Stack them = way past any single limit.

## Free AGENTS (plug the gateway key in)

- **OpenCode** - BYO-model. You already have it via BharatCode. Point at gateway.
- **Aider** - git-native. `aider --openai-api-base http://localhost:3001/v1 --openai-api-key <gateway-key>`
- **Gemini CLI** - most generous built-in free tier, zero setup. Good standalone.
- **Ollama** - fully local, $0/token forever (you pay compute). Infinite fallback, slower.

## Setup order (30 min, one time)

1. Grab 3-4 free keys: Mistral + Groq + Cerebras + Gemini (10 min, no card).
2. Install `freellmapi`, open dashboard, paste those keys, copy the unified `freellmapi-...` token.
3. Wire agents: `npx freellmapi setup-aider` / `setup-opencode` (or point base-url manually).
4. Test: run a small prompt through Aider/OpenCode, confirm it routes + falls back.
5. Add Ollama as local fallback for infinite-but-slow $0.

## Hackathon multiplier

Each of your 4 teammates runs their own gateway + own free keys = 4x budget again. Plus Claude as lead. All syncing through AIMemory/ (see AGENTS.md).

## HONEST CAVEATS (read this)

1. **"Personal experimentation only"** - both gateways say it. Free tiers forbid commercial/abuse. Fine for learning + personal.
2. **Hackathon = gray zone.** Odoo wants YOUR code + you understanding it. A token gateway is fine as dev infra, but the *project* must be yours. Don't let "I used a token router" become the story.
3. **Reliability varies.** Free catalogs change weekly (Cerebras dropped models mid-2026). Fallback handles it, but DON'T bet the live demo on free tiers. Keep one stable/paid key for the demo moment.
4. **ToS.** Use tools that route YOUR OWN keys (freellmapi does). Avoid gpt4free-style tools that scrape/share others' keys - ToS violation + unreliable.

## Step-by-step: getting each free key (no card)

Do in order, ~5 min each. Copy each key immediately (often shown once). Minimum viable = just Groq + Gemini.

### 1. Groq (do first - easiest/fastest)
1. console.groq.com
2. Sign in (Google/GitHub)
3. Left menu -> API Keys -> Create API Key
4. Copy the `gsk_...` key now (shown once)
5. Model: `llama-3.3-70b-versatile`

### 2. Google Gemini (biggest context, simplest)
1. aistudio.google.com
2. Sign in with Google
3. Get API key (top-left) -> Create API key
4. Copy the `AIza...` key
5. Model: `gemini-flash`

### 3. Cerebras (fast, ~1M/day)
1. cloud.cerebras.ai
2. Sign up (Google/email)
3. API Keys -> Generate key
4. Copy `csk-...`
5. Model: `gpt-oss-120b`

### 4. Mistral (biggest budget ~1B/mo, best for code)
1. console.mistral.ai
2. Sign up
3. API Keys -> Create new key -> copy
4. Free tier: opt into data training to use it
5. Model: `codestral-latest`

### 5. Cohere (small, optional - 1k calls/mo)
1. dashboard.cohere.com
2. Sign up -> API Keys -> copy Trial key
3. Skip if you want (smallest)

### 6. OpenRouter (aggregator - grab last)
1. openrouter.ai
2. Sign in -> Keys -> Create Key
3. Copy `sk-or-...`
4. Free 50 req/day (1000 with optional $10 top-up)

### Then
- Store keys safe (scratch file / password manager) as you go.
- Install freellmapi, open localhost:3001, paste all keys, copy the unified `freellmapi-...` token.
- Wire agents: `npx freellmapi setup-aider` / `setup-opencode`.

## RESUME HERE (paused 2026-09-02)

Keyboard/paste issue - session closed mid-setup. On return:
- Nothing collected yet. Start at step 1 (Groq), then Gemini. That's enough to begin.
- After 2+ keys: install freellmapi (`curl -fsSL https://freellmapi.co/install.sh | bash`), paste keys at localhost:3001.
- Then ask me to help wire the gateway into OpenCode/Aider and test a routed prompt.
- Optional: also re-login bharatcode (`bharatcode auth login`) - its token expired 2026-08-10.

## Curated lists to bookmark

- github.com/amardeeplakshkar/awesome-free-llm-apis (permanent free tiers, rate limits listed)
- github.com/mnfst/awesome-free-llm-apis (free API key directory)
- github.com/nejib1/Free-LLM (34+ APIs, synced daily)
