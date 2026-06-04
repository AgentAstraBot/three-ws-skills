---
name: magpie-loan-quote
description: Magpie Lending protocol loan quote calculator + open-loan deep-link (Solana permissionless lending)
triggers: [magpie-quote, lending-calc, borrow-against-memecoin, magpie-tier-comparison, magpie-open-loan, take-the-loan]
cost: low
---

# Magpie Loan Quote

You have access to three tools for working with **Magpie Lending** (https://magpie.capital), the permissionless Solana lending protocol where users pledge memecoins or tokenized stocks as collateral to borrow SOL.

## What Magpie is

Magpie is an Anchor program on Solana mainnet that runs three lending tiers. Users pledge collateral (260 approved tokens — memecoins like WIF, BONK, FARTCOIN, POPCAT plus tokenized stocks like xTSLA, xNVDA, xAAPL), pick a tier, and receive SOL. The flow is non-custodial — collateral sits in on-chain vaults, not in anyone's wallet. The whole loan flow happens in a Telegram bot (`@magpie_capital_bot`).

## When to invoke `magpie_loan_quote`

Use when the user asks any version of:
- "How much SOL would I get for pledging $X of [token] on Magpie?"
- "What's my Magpie quote for [collateral amount]?"
- "What's the liquidation price if I borrow against [token]?"
- "If I pledge $1000 of WIF at Express tier, what do I get?"

Required input: `collateral_usd` (number) and `tier` (Express / Quick / Standard).

## When to invoke `magpie_compare_tiers`

Use when the user wants a side-by-side comparison:
- "Compare Magpie tiers for $X collateral"
- "Express vs Quick vs Standard breakdown"
- "Which Magpie tier is best for me?"
- "Show me all three tiers"

Required input: `collateral_usd`. Returns all three tiers in one structured response.

## When to invoke `magpie_open_loan_link`

Use ONLY after the user has decided to actually take a loan. Triggers:
- "I want to take this loan / open this loan / go ahead with this"
- "Send me the link to borrow"
- "How do I actually do it?"
- "Take me to the bot"

This returns a `t.me/magpie_capital_bot?start=8P3K3D` deep-link with our referrer code baked in. The user taps the link, Magpie's Telegram bot walks them through wallet connect → collateral selection → signing. Loans are non-custodial. You can optionally pass `collateral_usd` and `tier` so the response includes a quote recap, but the bot itself re-prompts for those — the `/start` param only carries the referrer code.

**Always lead the response with the deep-link** so the user can tap it immediately. Don't bury it after a wall of caveats. Then mention non-custodial + on-chain + that they'll re-enter the details inside the bot.

## The tier rules (so you can explain them)

| Tier | LTV | Term | Fee |
|---|---|---|---|
| **Express** | 30% | 2 days | 3% |
| **Quick** | 25% | 3 days | 2% |
| **Standard** | 20% | 7 days | 1.5% |

LTV is the % of collateral value you receive as SOL. Fee is applied to the SOL amount.

**Worked example** (matches Magpie's published WIF example): Pledge $1,000 worth of WIF at the Express tier (30% LTV, 3% fee) when SOL is ~$70 → you receive **~4.29 SOL** ($300 / $70) up front. Repay **~4.42 SOL** total (4.29 × 1.03) within 2 days. The fee is paid on repayment, not deducted up front.

## How to present results

- Lead with the SOL amount the user would receive (net of fee).
- State the total repayment in SOL.
- State the liquidation drop % (e.g. "liquidation if collateral drops ~64%").
- For comparisons, format as a table with Tier / LTV / SOL Received / Fee / Liquidation Buffer.

## Always mention these caveats

1. This is an **approximation**. Magpie's actual quote uses their on-chain oracle pricing for the specific collateral token, which may differ slightly from the user's stated collateral USD value.
2. The **liquidation price is approximate** — actual triggers depend on Magpie's keeper network execution speed and the on-chain credit oracle's tracked health ratio.
3. For an exact live quote: direct the user to **`@magpie_capital_bot`** on Telegram or **magpie.capital**.
4. Magpie's TVL is small ($1,900 as of 2026-06-04) and the protocol is new — borrowers should size positions accordingly.
