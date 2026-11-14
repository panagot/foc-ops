# foc-ops — FOC Lifecycle Ops

**See burn → act before warm storage dies.**

Open-source ops tooling for [Filecoin Onchain Cloud](https://docs.filecoin.cloud/):

1. **FinOps** — USDFC runway, lockup, and “days until deficit” from [Filecoin Pay](https://docs.filecoin.cloud/)  
2. **Tier policy** — dry-run / execute **warm (FWSS) → cold (FCSS)** when age/cost rules fire  
3. **FVM TierRegistry** — on-chain map of warm PieceCID → cold archive (Calibration → Mainnet)

We do **not** replace [filecoin-pin](https://github.com/filecoin-project/filecoin-pin). We add **observe → alert → promote** that FOC apps still lack.

| | |
| --- | --- |
| **Network (default)** | Filecoin **Calibration** testnet · chain id `314159` |
| **Live console** | `npm run demo` → http://localhost:5310 |
| **License** | Dual **MIT OR Apache-2.0** |
| **Grant draft** | [`grant/NEXT_STEP_APPLICATION.md`](./grant/NEXT_STEP_APPLICATION.md) ($5k Next Step · 30 days) |
| **Backup if declined** | [`grant/BACKUP_TERRAFORM.md`](./grant/BACKUP_TERRAFORM.md) |

---

## Live demo (local)

### 1. Install

```bash
git clone git@github.com:panagot/foc-ops.git   # private — needs access
cd foc-ops
npm install
```

Repo: https://github.com/panagot/foc-ops (private)


### 2. Optional — local Calibration test wallet

A **gitignored** local key for testing (not a real “private coin”; Calibration uses **tFIL** + Filecoin Pay **USDFC**):

```bash
node scripts/gen-local-wallet.mjs
# → .wallets/calibration-test.json + .env.local
```

Fund **tFIL** on Calibration (faucet; URL may change):

- https://faucet.calibnet.chainsafe-fil.io/
- Or Filfox / Glif Calibration faucet links from current docs

Then deposit/test USDFC into Filecoin Pay for that address when you exercise FinOps.

**Never commit** `.env.local`, `.wallets/`, or private keys.

### 3. Start the console

```bash
npm run demo
```

Open **http://localhost:5310**

### Hosted demo (Vercel)

**Live:** https://foc-ops.vercel.app  

- Project: `foc-ops` (linked to this private GitHub repo)
- APIs: `/api/status` · `/api/tier` · `/api/network` · `/api/registry` · `/metrics`
- Static console from `public/` · Calibration Pay + TierRegistry wired

Redeploy: `npx vercel --prod`

### What you should see

| Step | Action | Expected |
| --- | --- | --- |
| 1 | Page load | **Live Calibration** default · RPC badge shows chain `314159` + block height |
| 2 | Header | Epoch / scrape latency / alert from **real** Filecoin Pay (`getAccountSummary`) |
| 3 | **Connect wallet** | Adds/switches MetaMask·Rabby to Calibration → live Pay for *your* address |
| 4 | **Run dry-run** | Stepped activity feed + warm→cold intents (no chain write until registry deployed) |
| 5 | **Drill · low runway** | Optional scenario theater (labeled drill — not the product path) |
| 6 | **Network + FVM** | Live Glif probe + TierRegistry status / wallet `recordPromotion` when deployed |
| 7 | Inject spend | Alert drill `ok → low_runway → deficit` + `/metrics` scrape pane |

### Reviewer walkthrough (live demo — no video required)

1. Open https://foc-ops.vercel.app — RPC badge on Calibration  
2. Connect wallet → Live Pay for that address  
3. Scrub `promoteAfterDays` → promote/skip deltas  
4. Run dry-run → intents  
5. Network + FVM → registry address / optional wallet promote  

---

## CLI

```bash
# Live RPC proof
npm run network

# Filecoin Pay runway (read-only)
npm run foc-ops -- status --address 0xYourAddress --network calibration

# Tier dry-run (rich demo inventory)
npm run foc-ops -- tier dry-run \
  --policy examples/policy.example.json \
  --inventory examples/inventory.demo.json

# Prometheus exporter
npm run foc-ops -- metrics --address 0xYourAddress --port 9108

# FVM registry
npm run registry:status
```

| Command | Purpose |
| --- | --- |
| `foc-ops status` | Pay runway / alert |
| `foc-ops network` | Calibration/mainnet RPC probe |
| `foc-ops tier dry-run` | Warm → cold policy evaluation |
| `foc-ops registry status\|get` | TierRegistry |
| `foc-ops metrics` | Prometheus gauges |

---

## Deploy TierRegistry (Calibration)

**Live on Calibration (deployed):**

| | |
| --- | --- |
| **TierRegistry** | [`0xc71acb123f31e4ee57d7a0a34234522f61fde589`](https://calibration.filfox.info/en/address/0xc71acb123f31e4ee57d7a0a34234522f61fde589) |
| **Deploy tx** | [`0x1b06a252…dcfb`](https://calibration.filfox.info/en/message/0x1b06a2528a43ab8071214a62784c212ec5b46e460d9c08778f75018a25f6dcfb) |
| **Deployer** | `0x82cb7b219c51ebc68fb2eE090393e2E05f01Fd08` |

Artifact: [`deployments/calibration.json`](./deployments/calibration.json)

```bash
npm i -D solc          # once, for compile
npm run deploy:registry -- --network calibration
# → deployments/calibration.json
```

---

## Architecture (short)

```
Console / CLI
    │
    ├─ Filecoin Pay (synapse-core getAccountSummary) ── Glif Calibration RPC
    ├─ Tier policy engine (local inventory → promote/skip)
    ├─ Prometheus gauges + example alert rules
    └─ FVM TierRegistry (recordPromotion / getPromotion)
```

APIs (demo server): `/api/status` · `/api/tier` · `/api/dry-run` · `/api/network` · `/api/registry` · `/metrics`

---

## Grant materials

- Strategy: [`grant/GRANT_STRATEGY.md`](./grant/GRANT_STRATEGY.md)  
- Next Step draft: [`grant/NEXT_STEP_APPLICATION.md`](./grant/NEXT_STEP_APPLICATION.md)  
- Demo prompts: [`grant/PROMPT_X100_DEMO.md`](./grant/PROMPT_X100_DEMO.md)  
- CI template: [`runway-check.workflow.yml`](./runway-check.workflow.yml) (move to `.github/workflows/` once the GitHub token has `workflow` scope)

---

## Security

- Private keys only in **gitignored** `.env.local` / `.wallets/`  
- Demo never ships keys  
- Default network is **Calibration** — do not point demos at Mainnet funds  

## License

Copyright (c) 2026 Panagiotis Pollis (`panagot`). Dual-licensed under MIT and Apache-2.0 — see `LICENSE`, `LICENSE-APACHE`, `NOTICE`.
