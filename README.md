# three-ws-skills

A growing collection of skill bundles for [three.ws](https://three.ws) agents. Each skill is a static four-file bundle (`manifest.json`, `SKILL.md`, `tools.json`, `handlers.js`) hosted via GitHub Pages and registered with a three.ws agent via the skill manifest URL.

## Live skills

| Skill | What it does | Install URL |
|---|---|---|
| **[magpie-loan-quote](./magpie-loan-quote/)** | Calculate Magpie Lending quotes — pledge memecoin or tokenized-stock collateral, see SOL received, repay amount, and approximate liquidation buffer across all three tiers. Pure math + DexScreener for live SOL price. No API key. | `https://agentastrabot.github.io/three-ws-skills/magpie-loan-quote/` |

## Live agent

**Agent Magpie** runs this skill end-to-end:
- Marketplace listing: <https://three.ws/marketplace/agents/00e92aa0-7337-413e-b1e9-855db7a380bf>
- Brain: Claude Sonnet 4.6
- Persona: scoped to invoking `magpie_loan_quote` / `magpie_compare_tiers` on any Magpie / loan / borrow mention.

## Install on your own three.ws agent

1. Open your agent at <https://three.ws/dashboard/agents> → click **Edit**.
2. Open the **Skills** tab (under **BRAIN** in the sidebar).
3. Paste the install URL above into the "Add a skill" input → click **Add**.
4. Click **Save skills**.
5. The skill is now part of your agent's system prompt — chat will route loan-quote questions through the tools.

## Embed Agent Magpie on your own page

```html
<script type="module" src="https://three.ws/agent-3d/latest/agent-3d.js"></script>
<agent-3d src="https://three.ws/api/avatars/237cb6ce-ab6b-4ff6-856a-58dfe45e00d6"></agent-3d>
```

## Example: calling the tools

### `magpie_loan_quote`

**Input**
```json
{ "collateral_usd": 1000, "tier": "Express", "sol_price_usd": 70 }
```

**Output**
```json
{
  "ok": true,
  "inputs": { "collateral_usd": 1000, "tier": "Express", "sol_price_usd": 70 },
  "quote": {
    "tier": "Express",
    "ltv_pct": 30,
    "term_days": 2,
    "fee_pct": 3,
    "sol_received": 4.2857,
    "fee_sol": 0.1286,
    "total_repay_sol": 4.4143,
    "liquidation_drop_pct": 64,
    "liquidation_collateral_usd": 360
  },
  "summary": "Pledge $1000 at the Express tier → receive 4.2857 SOL. Repay 4.4143 SOL (= 4.2857 + 0.1286 fee) within 2 days. Liquidation if collateral drops ~64%.",
  "next_steps": "For the live on-chain quote with Magpie's oracle pricing, message @magpie_capital_bot on Telegram or visit magpie.capital."
}
```

### `magpie_compare_tiers`

**Input**
```json
{ "collateral_usd": 1000, "sol_price_usd": 70 }
```

**Output** (abridged)
```json
{
  "ok": true,
  "tiers": [
    { "tier": "Express",  "ltv_pct": 30, "sol_received": 4.2857, "total_repay_sol": 4.4143, "liquidation_drop_pct": 64 },
    { "tier": "Quick",    "ltv_pct": 25, "sol_received": 3.5714, "total_repay_sol": 3.6429, "liquidation_drop_pct": 70 },
    { "tier": "Standard", "ltv_pct": 20, "sol_received": 2.8571, "total_repay_sol": 2.9000, "liquidation_drop_pct": 76 }
  ],
  "recommendation": {
    "max_payout": "Express — 30% LTV gives the most SOL up front, but the tightest liquidation buffer (~64% drop tolerated).",
    "lowest_fee": "Standard — 1.5% fee, 7-day term, ~76% drop tolerated before liquidation.",
    "balanced": "Quick — 25% LTV with 2% fee and 3-day term. The most popular tier per Magpie."
  }
}
```

## Math model (verified)

```
sol_received = collateral_usd × LTV / sol_price_usd
total_repay  = sol_received × (1 + fee_pct)
liquidation_drop_pct ≈ (1 − LTV × 1.2) × 100
```

| Tier | LTV | Term | Fee |
|---|---|---|---|
| **Express** | 30% | 2 days | 3% |
| **Quick** | 25% | 3 days | 2% |
| **Standard** | 20% | 7 days | 1.5% |

Matches Magpie's own published example (pledge 8,000 WIF → receive 3.25 SOL → repay 3.35 SOL at 30% LTV / 3% fee).

## Coming soon

- `sol-token-lookup` — Solana token data via DexScreener (no key)
- `pumpfun-curve-calc` — Pump.fun bonding curve math (pure compute)
- `sol-token-authority-check` — Mint/freeze authority + LP burn rug primitive
- `crew-overlap-lookup` — Cross-reference Solana wallets against a known rug-crew watchlist

## Build / deploy

Static files. To fork:

1. Fork this repo.
2. Enable GitHub Pages on `main` branch, root folder.
3. Drop a `.nojekyll` at the repo root (already present here) so `.md` files serve raw.
4. The install URL becomes `https://<username>.github.io/three-ws-skills/<skill-name>/`.

## Credits

- **Agent Magpie avatar (GLB)**: ["Standing magpie bird"](https://sketchfab.com/3d-models/standing-magpie-bird-04bec699b5404ea3a45952e23406ba31) by [kamu](https://sketchfab.com/asad.aziz009) on Sketchfab, used under [CC Attribution](https://creativecommons.org/licenses/by/4.0/). Generated with Rodin Gen-1.
- **Magpie Lending protocol**: <https://magpie.capital> · [@MagpieLoans](https://x.com/MagpieLoans) · `@magpie_capital_bot` on Telegram.
- **Host platform**: [three.ws](https://three.ws).

## License

MIT — fork it, remix it, ship your own.
