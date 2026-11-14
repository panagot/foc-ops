# Grant Proposal: `foc-ops` — FOC Lifecycle Ops

**Program:** FIL Builder Next Step Grants (FIL-B + Filecoin Foundation)  
**Ask:** **$10,000 USD** · **Category:** Developer and data tooling  
**Timeline:** 12 weeks after contract  

---

**Project Name:** foc-ops (FOC Lifecycle Ops)

**Proposal Category:** `Developer and data tooling`

**Individual or Entity Name:** Individual — Panagiotis Pollis (panagot)

**Proposer:** `panagot`

**Project Repo(s):** https://github.com/panagot/foc-ops  

> **Pre-submit:** make the repo **public** (or add Filecoin Foundation as collaborator). Currently private while polishing.

**Live demo:** https://foc-ops.vercel.app  

**Filecoin ecosystem affiliations:** None. Independent builder. Live product shipping elsewhere: [AI Agents Archive](https://aiagentsarchive.com/) (Base USDC micropay desk). No PL / FF / FFDW employment or investment relationship.

**(Optional) Technical Sponsor:** N/A

**Do you agree to open source all work you do on behalf of this RFP under the MIT/Apache-2 dual-license?:** Yes — repo is dual-licensed (`LICENSE` + `LICENSE-APACHE` + `NOTICE`).

---

### 1. What is your project and what problem does it solve? (max 100 words)

FOC can pin and pay, but operators still go blind on **USDFC runway** and keep data on expensive **warm** rails until Pay deficit kills service. `foc-ops` is CLI + Calibration console + Prometheus: live Filecoin Pay health (“days until deficit”), **warm→cold** tier dry-run/execute, and an FVM **TierRegistry** mapping warm PieceCID → cold archive on Calibration then Mainnet. We do **not** reimplement filecoin-pin—we keep FOC apps alive and cheaper under payment pressure.

### 2. How is Filecoin used in this project?

- **Filecoin Pay** via `@filoz/synapse-core` `getAccountSummary` — runway, lockup, funds, debt. Live Calibration (Glif) + browser wallet (chain id **314159**).  
- **FWSS / warm inventory** — age/size policy inputs; dry-run live today; execute path in grant.  
- **FCSS / cold path** — promotion target when policy fires (human-confirm first versions).  
- **FVM `TierRegistry`** — already **deployed on Calibration**; `recordPromotion` proven on-chain; Mainnet deploy in grant.  
- **Prometheus** — `foc_ops_runway_days`, `foc_ops_alert`, example alert rules.

**PoC evidence (Calibration):**

| Artifact | Link |
| --- | --- |
| Hosted console | https://foc-ops.vercel.app |
| TierRegistry | [`0xc71acb123f31e4ee57d7a0a34234522f61fde589`](https://calibration.filfox.info/en/address/0xc71acb123f31e4ee57d7a0a34234522f61fde589) |
| Deploy tx | [`0x1b06a252…dcfb`](https://calibration.filfox.info/en/message/0x1b06a2528a43ab8071214a62784c212ec5b46e460d9c08778f75018a25f6dcfb) |
| Sample `recordPromotion` | [`0x24561b7e…b381`](https://calibration.filfox.info/en/message/0x24561b7e6d31b7feb002c702227559b7d4cf30f4524f67d538cd5da3e79cb381) |

On-chain growth = registry writes + cold promotions driven by real Pay pressure—not vanity dashboards.

### 3. How will you improve your project with this grant?

PoC already ships: live Pay FinOps, Calibration console, wallet connect, TierRegistry deploy + one promote tx, Prometheus text, hosted demo.

| # | Grant deliverable | How we meet it | Timeframe |
| --- | --- | --- | --- |
| 1 | Harden FinOps | Mainnet Pay status + metrics; Grafana/alert docs; Loom of live console | Weeks 1–3 |
| 2 | Registry + inventory | Public repo; FWSS/Synapse inventory pull (replace demo JSON); N Calibration registry txs | Weeks 4–7 |
| 3 | Warm→cold execute | One documented promote-prepare path (warm → cold ref + registry write); Mainnet TierRegistry | Weeks 8–11 |
| 4 | Ship | npm package, dual-license OSS, final demo, verified Calibration + Mainnet addresses | Week 12 |

**Success metrics:** `npm i foc-ops` works; Loom ≤3 min; Filfox/Filscan links for Calibration + Mainnet registry; CI runway check green.

### 4. What is the total amount of this grant request?

**$10,000 USD**

### 5. Adoption, Reach, and Growth Strategies

**Audience:** FOC / Synapse builders and indie apps that already hold USDFC in Filecoin Pay.

**First 10:** Dogfood Calibration + Mainnet wallets; share CLI in Filecoin Slack/Discord + FIL-B; one “runway before outage” post with demo link.

**First 100:** npm `foc-ops`, copy-paste Prometheus rules, GitHub Action that fails when runway &lt; N days (compose with—not replace—filecoin-pin).

### 6. If accepted, do you agree to share monthly project updates in this Github Issue until the project described here is complete?

Yes.

### 7. Does your proposal comply with our Community Code of Conduct?

Yes.

### 8. Links and submissions

- Not a hackathon resubmit.  
- **Live demo:** https://foc-ops.vercel.app  
- **Repo:** https://github.com/panagot/foc-ops  
- Backup if this ask is declined (do **not** amend this issue): Terraform FOC provider — `grant/BACKUP_TERRAFORM.md` (separate proposal only).

### Additional questions

- **Team:** Panagiotis Pollis · panagiotispollis@gmail.com · GitHub `panagot` · sole engineer (design, CLI, FVM, docs).  
- **How I learned about this program:** Filecoin Foundation grants hub + Builder Next Step docs on `filecoin-project/devgrants`.

---

## Submit checklist (for proposer)

1. [ ] Make https://github.com/panagot/foc-ops **public**  
2. [ ] Disable Vercel Deployment Protection (or confirm public access)  
3. [ ] Record ≤3 min Loom: RPC → wallet → Pay → dry-run → registry  
4. [ ] Open issue on `filecoin-project/devgrants` using this text  
5. [ ] Do **not** include Terraform in the same issue  
