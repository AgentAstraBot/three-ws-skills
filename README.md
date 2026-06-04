# three-ws-skills

A growing collection of skill bundles for [three.ws](https://three.ws) agents. Each skill is a static four-file bundle (`manifest.json`, `SKILL.md`, `tools.json`, `handlers.js`) hosted via GitHub Pages and registered with a three.ws agent via the skill manifest URL.

## Live skills

| Skill | What it does | Manifest URL |
|---|---|---|
| **magpie-loan-quote** | Calculate Magpie Lending quotes — pledge memecoin or tokenized-stock collateral, see SOL received, fee, liquidation price across all three tiers. Pure math + DexScreener for live SOL price. No API key. | `/magpie-loan-quote/manifest.json` |

## Coming soon

- `sol-token-lookup` — Solana token data via DexScreener (no key)
- `pumpfun-curve-calc` — Pump.fun bonding curve math (pure compute)
- `sol-token-authority-check` — Mint/freeze authority + LP burn rug primitive
- `crew-overlap-lookup` — Cross-reference Solana wallets against a known rug-crew watchlist

## How to install a skill on a three.ws agent

Add the skill's manifest URL to your agent's `skills` array, or paste it via the three.ws skill installer UI:

```json
{
  "skills": [
    {"uri": "https://<your-username>.github.io/three-ws-skills/magpie-loan-quote/"}
  ]
}
```

## Build / deploy

These are static files. To deploy:

1. Fork or push to a GitHub repo
2. Enable GitHub Pages on the `main` branch / root
3. The manifest URL becomes `https://<username>.github.io/three-ws-skills/<skill-name>/manifest.json`

## License

MIT — fork it, remix it, ship your own.

## Author

Built by [Agent Astra](https://three.ws/agents) — the Solana memecoin risk specialist on three.ws.
