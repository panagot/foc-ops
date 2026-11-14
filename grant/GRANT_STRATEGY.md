# Grant strategy — maximize Next Step approval (pre-submit)

Debate inputs: product Autopilot + [Grant critic](0193653a-fe35-4b1f-bbcd-ab12594c9267) · Filecoin Builder Next Step criteria · FOC/Pay public goals.

## Verdict

**Critic baseline:** ~25–35% (scenario-default theater, no wallet, no registry tx).  
**After hardening:** ~55–65% aligned with critic — live Calibration **default**, wallet connect, RPC proof, registry deploy/read path, dual license, CI.  
**To clear ~80%+:** deploy `TierRegistry` on Calibration (Filscan link), 60s Loom, public GitHub, dogfood Pay address.

## Active Filecoin needs this hits

| Need | Why reviewers care | How foc-ops answers |
| --- | --- | --- |
| FOC Pay retention | FilPGF Revenue track wants recurring Pay users / ARR; silent deficit kills rails | FinOps runway + Prometheus before outage |
| Warm cost control | FWSS is the expensive hot path; cold/archive underused | Age/cost tier dry-run → promote path |
| Dev tooling gap | Next Step focus: Developer and data tooling | CLI + console + alerts, not another pin client |
| On-chain FVM | Criterion: on-chain project, Calibration + Mainnet ship | `TierRegistry.sol` + deploy script + wallet `recordPromotion` |
| Don’t fork filecoin-pin | Existing OSS covers pin/release | Explicit non-goal; we consume Synapse/Pay |

## Killers (still watch)

1. **Registry not deployed yet** — Solidity + calldata ≠ verified Calibration address.  
2. **Empty live Pay wallet** — Connect wallet → still zeros unless you fund Calibration Pay.  
3. **No public repo / Loom** — Next Step wants PoC + demo artifact.  
4. **Scope creep** — Terraform backup must stay a *separate* issue if declined.

## Shipped this session (PoC bar)

- Live Glif Calibration probe (`foc-ops network`, `/api/network`, RPC badge)  
- Wallet connect → add/switch Calibration 314159 → live `getAccountSummary`  
- Network + FVM panel; wallet submit when registry deployed  
- `scripts/deploy-registry.mjs`, dual MIT/Apache, GitHub Action runway check  
- Capability theater retained for storytelling; Live+wallet for proof  

## Proposal angle (use in GitHub issue)

> FOC already has pin + Pay + warm storage — operators still can’t see USDFC runway or promote warm→cold under payment pressure. `foc-ops` ships FinOps CLI/metrics, tier dry-run, and an FVM TierRegistry so promotions are auditable on Calibration then Mainnet. We do not replace filecoin-pin; we keep FOC apps alive and cheaper. $10k / 12 weeks.

## Out of scope (dilutes odds)

Full CDN/Filebeam, SP marketplace, Terraform-in-same-ask, mainnet spend in demo, wallet custody, rewriting Synapse.

## Before you open the GitHub issue

1. `FOC_PRIVATE_KEY=… npm run deploy:registry` → paste address into README  
2. Push `github.com/panagot/foc-ops`  
3. Record Loom: RPC live → wallet → Pay → dry-run → (optional) registry tx  
4. Soften draft only for facts; keep $10k / Developer and data tooling  
