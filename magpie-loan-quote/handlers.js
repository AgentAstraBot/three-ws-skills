// handlers.js — magpie-loan-quote skill for three.ws
//
// Two tools:
//   magpie_loan_quote({ collateral_usd, tier, sol_price_usd? }, ctx)
//   magpie_compare_tiers({ collateral_usd, sol_price_usd? }, ctx)
//
// Pure math + a single DexScreener fetch for live SOL/USD price.
// No API keys, no auth, no server-side state. Runs in a sandboxed Web Worker.

const TIERS = {
  Express:  { ltv: 0.30, term_days: 2, fee_pct: 0.03  },
  Quick:    { ltv: 0.25, term_days: 3, fee_pct: 0.02  },
  Standard: { ltv: 0.20, term_days: 7, fee_pct: 0.015 },
};

// Approximation: Magpie liquidates when collateral health drops below a buffer.
// We model liquidation as triggering when collateral USD value falls to
// (loan_usd × LIQUIDATION_BUFFER). With a 1.2x buffer, a 30% LTV loan
// liquidates when collateral drops to 30% × 1.2 = 36% of its initial value,
// i.e. a ~64% drop. Conservative vs reality (Magpie has not had a single
// liquidation since launch on 2026-06-02 — actual thresholds may be tighter).
const LIQUIDATION_BUFFER = 1.2;

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const DEXSCREENER_URL = `https://api.dexscreener.com/latest/dex/tokens/${SOL_MINT}`;

async function fetchSolPriceUsd(ctx) {
  try {
    const res = await ctx.fetch(DEXSCREENER_URL);
    if (!res.ok) return null;
    const data = await res.json();
    const pairs = data?.pairs;
    if (!Array.isArray(pairs) || pairs.length === 0) return null;
    // Highest-liquidity pair has the most reliable price
    const sorted = [...pairs].sort(
      (a, b) => (b?.liquidity?.usd ?? 0) - (a?.liquidity?.usd ?? 0)
    );
    const px = parseFloat(sorted[0].priceUsd);
    return Number.isFinite(px) && px > 0 ? px : null;
  } catch (err) {
    return null;
  }
}

function round(n, dp) {
  const m = Math.pow(10, dp);
  return Math.round(n * m) / m;
}

function calcTier(collateral_usd, tier_name, sol_price) {
  const t = TIERS[tier_name];
  // Magpie's stated mechanic (verified against their public example
  // "Pledge 8,000 WIF · Get 3.25 SOL · 30% LTV · Fee 3% · repay 3.35 SOL"):
  //   sol_received = collateral_usd × LTV / sol_price   (full LTV amount, no upfront fee)
  //   total_repay  = sol_received × (1 + fee_pct)        (fee paid on repayment)
  const loan_usd = collateral_usd * t.ltv;
  const sol_received = loan_usd / sol_price;
  const fee_sol = sol_received * t.fee_pct;
  const total_repay_sol = sol_received + fee_sol;
  // Liquidation drop %: how far collateral must fall before liquidation triggers.
  // Approximation using a 1.2x safety buffer over the loan principal.
  const liq_drop_pct = (1 - (t.ltv * LIQUIDATION_BUFFER)) * 100;
  const liq_collateral_usd = collateral_usd * t.ltv * LIQUIDATION_BUFFER;
  return {
    tier: tier_name,
    ltv_pct: round(t.ltv * 100, 1),
    term_days: t.term_days,
    fee_pct: round(t.fee_pct * 100, 2),
    sol_received: round(sol_received, 4),
    fee_sol: round(fee_sol, 4),
    total_repay_sol: round(total_repay_sol, 4),
    liquidation_drop_pct: round(liq_drop_pct, 1),
    liquidation_collateral_usd: round(liq_collateral_usd, 2),
  };
}

// ---------- Tool 1: single-tier quote ----------
export async function magpie_loan_quote({ collateral_usd, tier, sol_price_usd }, ctx) {
  if (typeof collateral_usd !== 'number' || !(collateral_usd > 0)) {
    return { ok: false, error: 'collateral_usd must be a positive number' };
  }
  if (!TIERS[tier]) {
    return {
      ok: false,
      error: `Invalid tier: "${tier}". Must be one of: Express, Quick, Standard.`,
    };
  }

  const sol_price = (typeof sol_price_usd === 'number' && sol_price_usd > 0)
    ? sol_price_usd
    : await fetchSolPriceUsd(ctx);
  if (!sol_price) {
    return {
      ok: false,
      error: 'Could not determine SOL price. Pass sol_price_usd explicitly or retry — DexScreener may be temporarily unreachable.',
    };
  }

  const calc = calcTier(collateral_usd, tier, sol_price);

  return {
    ok: true,
    inputs: {
      collateral_usd,
      tier,
      sol_price_usd: round(sol_price, 2),
    },
    quote: calc,
    summary: `Pledge $${collateral_usd} at the ${tier} tier → receive ${calc.sol_received} SOL. Repay ${calc.total_repay_sol} SOL (= ${calc.sol_received} + ${calc.fee_sol} fee) within ${calc.term_days} days. Liquidation if collateral drops ~${calc.liquidation_drop_pct}%.`,
    caveats: [
      'Approximation. Magpie\'s actual quote uses their on-chain oracle pricing for the specific token.',
      'Liquidation drop % uses a 1.2x safety buffer model — actual thresholds depend on Magpie\'s keeper network.',
      'Magpie TVL is small (~$1,900 as of 2026-06-04). Size positions accordingly.',
    ],
    next_steps: 'For the live on-chain quote with Magpie\'s oracle pricing, message @magpie_capital_bot on Telegram or visit magpie.capital.',
  };
}

// ---------- Tool 2: three-tier comparison ----------
export async function magpie_compare_tiers({ collateral_usd, sol_price_usd }, ctx) {
  if (typeof collateral_usd !== 'number' || !(collateral_usd > 0)) {
    return { ok: false, error: 'collateral_usd must be a positive number' };
  }

  const sol_price = (typeof sol_price_usd === 'number' && sol_price_usd > 0)
    ? sol_price_usd
    : await fetchSolPriceUsd(ctx);
  if (!sol_price) {
    return {
      ok: false,
      error: 'Could not determine SOL price. Pass sol_price_usd explicitly or retry.',
    };
  }

  const tiers = ['Express', 'Quick', 'Standard'].map(name =>
    calcTier(collateral_usd, name, sol_price)
  );

  return {
    ok: true,
    inputs: {
      collateral_usd,
      sol_price_usd: round(sol_price, 2),
    },
    tiers,
    recommendation: {
      max_payout: 'Express — 30% LTV gives the most SOL up front, but the tightest liquidation buffer (~64% drop tolerated).',
      lowest_fee: 'Standard — 1.5% fee, 7-day term, ~76% drop tolerated before liquidation.',
      balanced: 'Quick — 25% LTV with 2% fee and 3-day term. The most popular tier per Magpie.',
    },
    caveats: [
      'Pure math approximation based on Magpie\'s published tier rules.',
      'Liquidation drop % uses a 1.2x safety buffer model — actual thresholds may be tighter.',
    ],
    next_steps: 'Pick your tier and message @magpie_capital_bot on Telegram for the live quote with Magpie\'s on-chain oracle pricing.',
  };
}
