# Grant Proposal: `foc-ops` — FOC Lifecycle Ops

**Project Name:** foc-ops (FOC Lifecycle Ops)

**Proposal Category:** `Developer and data tooling`

**Individual or Entity Name:** Individual — Panagiotis Pollis (panagot)

**Proposer:** `panagot`

**Project Repo(s):** https://github.com/panagot/foc-ops *(create/push before submit)* · local: `filecoin/foc-ops/`

**Filecoin ecosystem affiliations:** None. Independent builder. Live product shipping elsewhere: [AI Agents Archive](https://aiagentsarchive.com/) (Base USDC micropay desk). No PL / FF / FFDW employment or investment relationship.

**(Optional) Technical Sponsor:** N/A

**Do you agree to open source all work you do on behalf of this RFP under the MIT/Apache-2 dual-license?:** Yes — repo already dual-licensed (`LICENSE` + `LICENSE-APACHE`).

---

### 1. What is your project and what problem does it solve? (max 100 words)

FOC can pin and pay, but operators still go blind on **USDFC runway** and keep data on expensive **warm** rails until Pay deficit kills service. `foc-ops` is CLI + Calibration console + Prometheus: live Filecoin Pay health (“days until deficit”), **warm→cold** tier dry-run/execute, and an FVM **TierRegistry** mapping warm PieceCID → cold archive on Calibration then Mainnet. Wallet connect proves real Pay; we do **not** reimplement filecoin-pin—we keep FOC apps alive and cheaper under payment pressure.

### 2. How is Filecoin used in this project?

- **Filecoin Pay** via `@filoz/synapse-core` `getAccountSummary` — runway, lockup, funds, debt (FinOps). Live Calibration RPC (Glif) + browser wallet (chain id 314159).  
- **FWSS / warm inventory** — policy inputs for promote-after-days / size; dry-run today, execute in grant.  
- **FCSS / cold path** — promotion target when policy fires (human-confirm first versions).  
- **FVM `TierRegistry`** — Solidity: `recordPromotion(warm, cold, policy)`; deploy script + wallet submit; Calibration then Mainnet addresses in final report.  
- **Prometheus + CI** — `foc_ops_runway_days` / `foc_ops_alert`; GitHub Action probes Calibration.

On-chain growth = registry writes + cold promotions driven by real Pay pressure—not vanity dashboards.

### 3. How will you improve your project with this grant?

| Number | Grant Deliverable | How we meet it | Timeframe |
| --- | --- | --- | --- |
| 1 | FinOps MVP | `foc-ops status` + `metrics` against Calibration + Mainnet Pay; docs; demo Loom | Weeks 1–3 |
| 2 | Tier dry-run + FVM registry | Policy engine; `TierRegistry` on Calibration; PieceCID mapping txs | Weeks 4–7 |
| 3 | Warm→cold execute path | One end-to-end promote path (warm inventory → cold propose/ref); Mainnet registry | Weeks 8–11 |
| 4 | Ship + demo | OSS repo, dual license, recorded demo, example Grafana/alert rules | Week 12 |

### 4. What is the total amount of this grant request?

**$10,000 USD**

### 5. Adoption, Reach, and Growth Strategies

**Audience:** FOC / Synapse builders, SP-adjacent ops, indie apps pinning to warm storage who already hold USDFC in Filecoin Pay.

**First 10:** Dogfood on our own FOC test wallets; share CLI in Filecoin Slack/Discord + FIL-B channels; blog one “runway before outage” post.

**First 100:** npm `foc-ops`, copy-paste Prometheus config, GitHub Action that fails CI when runway &lt; N days (compose, not replace filecoin-pin).

### 6. If accepted, do you agree to share monthly project updates in this Github Issue until the project described here is complete?

Yes.

### 7. Does your proposal comply with our Community Code of Conduct?

Yes.

### 8. Links and submissions

- Not a hackathon resubmit.  
- Backup if this ask is declined (do **not** amend this issue): Terraform FOC provider — see repo `grant/BACKUP_TERRAFORM.md`.

### Additional questions

- **Team:** Panagiotis Pollis · panagiotispollis@gmail.com · GitHub `panagot` · sole engineer (design, CLI, FVM, docs).  
- **How I learned about this program:** Filecoin Foundation grants hub + Builder Next Step docs on `filecoin-project/devgrants`.
