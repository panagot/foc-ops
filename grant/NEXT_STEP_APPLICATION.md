# Grant Proposal: `foc-ops` — FOC Lifecycle Ops

**Program:** FIL Builder Next Step Grants (FIL-B + Filecoin Foundation)  
**Ask:** **$5,000 USD** · **Category:** Developer and data tooling  
**Timeline:** **30 days** after contract (Next Step rule for $5k)  

**How to apply:** Open a GitHub issue on [`filecoin-project/devgrants`](https://github.com/filecoin-project/devgrants/issues/new/choose) using the Builder Next Step template — **there is no separate online form**. See [program notes](https://github.com/filecoin-project/devgrants/blob/master/Program%20Resources/Builder%20Next%20Step%20Grants.md) and [fil.org/grants](https://fil.org/grants).

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
- **FWSS / warm inventory** — age/size policy inputs; dry-run live today; execute path in this grant.  
- **FCSS / cold path** — promotion target when policy fires (human-confirm first version).  
- **FVM `TierRegistry`** — already **deployed on Calibration**; `recordPromotion` proven on-chain; Mainnet deploy in this grant.  
- **Prometheus** — `foc_ops_runway_days`, `foc_ops_alert`, example alert rules.

**PoC evidence (Calibration) — live demo is the walkthrough (no Loom required to apply):**

| Artifact | Link |
| --- | --- |
| Hosted console | https://foc-ops.vercel.app |
| TierRegistry | [`0xc71acb123f31e4ee57d7a0a34234522f61fde589`](https://calibration.filfox.info/en/address/0xc71acb123f31e4ee57d7a0a34234522f61fde589) |
| Deploy tx | [`0x1b06a252…dcfb`](https://calibration.filfox.info/en/message/0x1b06a2528a43ab8071214a62784c212ec5b46e460d9c08778f75018a25f6dcfb) |
| Sample `recordPromotion` | [`0x24561b7e…b381`](https://calibration.filfox.info/en/message/0x24561b7e6d31b7feb002c702227559b7d4cf30f4524f67d538cd5da3e79cb381) |

On-chain growth = registry writes + cold promotions driven by real Pay pressure—not vanity dashboards.

### 3. How will you improve your project with this grant?

PoC already ships: live Pay FinOps, hosted Calibration console, wallet connect, TierRegistry + promote tx, Prometheus text.

| # | Grant deliverable | How we meet it | Timeframe |
| --- | --- | --- | --- |
| 1 | Mainnet FinOps + docs | `foc-ops status` / `metrics` on Mainnet Pay; README ops guide; alert YAML | Days 1–10 |
| 2 | Inventory + execute path | Replace demo JSON with Synapse/FWSS inventory pull; one warm→cold prepare + registry write | Days 11–22 |
| 3 | Mainnet registry + ship | Deploy TierRegistry on Mainnet; npm publish; public repo polish; verified addresses in final update | Days 23–30 |

**Success metrics:** `npm i foc-ops`; live demo URL; Filfox/Filscan Calibration + Mainnet registry addresses; CI runway check green.

### 4. What is the total amount of this grant request?

**$5,000 USD**

### 5. Adoption, Reach, and Growth Strategies

**Audience:** FOC / Synapse builders and indie apps that already hold USDFC in Filecoin Pay.

**First 10:** Dogfood Calibration + Mainnet; share CLI + https://foc-ops.vercel.app in Filecoin Slack/Discord + FIL-B; short post with demo link.

**First 100:** npm `foc-ops`, copy-paste Prometheus rules, GitHub Action when runway &lt; N days (compose with—not replace—filecoin-pin).

### 6. If accepted, do you agree to share monthly project updates in this Github Issue until the project described here is complete?

Yes.

### 7. Does your proposal comply with our Community Code of Conduct?

Yes.

### 8. Links and submissions

- Not a hackathon resubmit.  
- **Live demo (primary PoC):** https://foc-ops.vercel.app  
- **Repo:** https://github.com/panagot/foc-ops  
- Backup if this ask is declined (do **not** amend this issue): Terraform FOC provider — `grant/BACKUP_TERRAFORM.md` (separate proposal only).

### Additional questions

- **Team:** Panagiotis Pollis · panagiotispollis@gmail.com · GitHub `panagot` · sole engineer (design, CLI, FVM, docs).  
- **How I learned about this program:** Filecoin Foundation grants hub + Builder Next Step docs on `filecoin-project/devgrants`.

---

## Submit checklist (for proposer)

1. [ ] Make https://github.com/panagot/foc-ops **public**  
2. [ ] Disable Vercel Deployment Protection so reviewers can open the demo without login  
3. [ ] Open a **GitHub issue** on `filecoin-project/devgrants` (no web form) and paste this proposal  
4. [ ] Do **not** include Terraform in the same issue  
5. [ ] No Loom required to apply — point reviewers at the live demo  

> Note: FF’s *final* grant report checklist mentions a recorded demo for tooling projects. That is a completion artifact if they insist later — not a barrier to submitting with a working hosted demo.
