# Table at Café de Flore

Pick up to three guests — Camus, Sartre, Beauvoir, Cézanne, Satie, Kusama, Ernaux, Sanmao 三毛 — sit them at a table at the Café de Flore, and talk with them. They answer you, and each other, in the spirit of their work. Powered by Claude.

**Try it:** https://wenyuew.github.io/emilywang.github.io/table-at-cafe-de-flore/

## How it works

- One static page: `table-at-cafe-de-flore/index.html`. No build step and no server.
- Each visitor uses their own Anthropic API key. They paste it once, and it stays in their browser (localStorage). It's sent only to `api.anthropic.com`, never to this site.
- Each message becomes one Claude call. It carries the chosen guests' personas, the conversation so far, and what to do next ("answer the visitor", "keep talking among yourselves", or "answer one guest directly"). Claude streams back lines like `camus: …`, and the page turns each line into a guest's speech as it arrives.
- Replies come in whatever language the visitor writes in.
- The **Speak** button uses the browser's built-in speech recognition (Chrome, Edge, Safari) in English, French or Chinese.

## Settings

Near the top of the script in `index.html`:

```js
const PROXY_URL = '';                // empty = visitors use their own key
const MODEL = 'claude-sonnet-5';     // or 'claude-haiku-4-5-20251001' for cheaper replies
```

## Optional, later: let anyone play on your key

The `worker/` folder holds a Cloudflare Worker that keeps your own API key private and caps daily use. To use it, deploy it (`npx wrangler login`, `npx wrangler kv namespace create RATE`, `npx wrangler deploy`, `npx wrangler secret put ANTHROPIC_API_KEY`). Then paste its address into `PROXY_URL`, and the key box disappears for visitors.

## Note

These are imagined conversations. The guests' lines are invented and are not real quotes.
