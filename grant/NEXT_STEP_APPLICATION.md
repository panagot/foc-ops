# Grant Proposal: `foc-ops` — FOC Lifecycle Ops

**Program:** FIL Builder Next Step Grants (FIL-B + Filecoin Foundation)  
**Ask:** **$5,000 USD** · **Category:** Developer and data tooling  
**Timeline:** **30 days** after contract signature (program rule for $5k awards)

**Contact (for review + post-approval):**  
- **Email (primary):** panagiotispollis@gmail.com  
- **GitHub:** [@panagot](https://github.com/panagot)  
- **Application issue:** all Q&A and monthly updates happen as **comments on this GitHub issue**  
- **After approval:** Filecoin Foundation typically emails the address above + continues on the issue thread to send the Open Source Software Grant Agreement and funding steps (`grants@fil.org` if needed)

**Apply path:** GitHub issue on [`filecoin-project/devgrants`](https://github.com/filecoin-project/devgrants/issues/new/choose) — **no separate web form**. Program overview: [fil.org/grants](https://fil.org/grants) · [Builder Next Step notes](https://github.com/filecoin-project/devgrants/blob/master/Program%20Resources/Builder%20Next%20Step%20Grants.md).

---

**Project Name:** foc-ops (FOC Lifecycle Ops)

**Proposal Category:** `Developer and data tooling`

**Individual or Entity Name:** Individual — Panagiotis Pollis (panagot)

**Proposer:** `panagot`

**Project Repo(s):** https://github.com/panagot/foc-ops  

> **Pre-submit:** make the repo **public** (or grant Filecoin Foundation read access). Currently private while polishing.

**Live demo (primary PoC walkthrough):** https://foc-ops.vercel.app  

**Filecoin ecosystem affiliations:** None. Independent builder. Live product shipping elsewhere: [AI Agents Archive](https://aiagentsarchive.com/) (Base USDC micropay desk). No Protocol Labs / Filecoin Foundation / FFDW employment or investment relationship.

**(Optional) Technical Sponsor:** N/A

**Do you agree to open source all work you do on behalf of this RFP under the MIT/Apache-2 dual-license?:** Yes — repository already dual-licensed (`LICENSE`, `LICENSE-APACHE`, `NOTICE`).

---

### 1. What is your project and what problem does it solve? (max 100 words)

FOC can pin and pay, but operators still go blind on **USDFC runway** and keep data on expensive **warm** rails until Pay deficit kills service. `foc-ops` is CLI + Calibration console + Prometheus: live Filecoin Pay health (“days until deficit”), **warm→cold** tier dry-run/execute, and an FVM **TierRegistry** mapping warm PieceCID → cold archive on Calibration then Mainnet. We do **not** reimplement filecoin-pin—we keep FOC apps alive and cheaper under payment pressure.

### 2. How is Filecoin used in this project?

#### 2.1 Stack map

| Layer | Filecoin surface | What foc-ops does today | Grant “next step” |
| --- | --- | --- | --- |
| Payments | **Filecoin Pay** (`@filoz/synapse-core` `getAccountSummary`) | Live runway, lockup, funds, debt, alert states on **Calibration** (Glif RPC, chain id **314159**) | Same APIs on **Mainnet**; document ops runbooks |
| Warm storage | **FWSS / Synapse** piece inventory | Policy dry-run on age/size against demo inventory | Pull real warm inventory from Synapse/FWSS APIs |
| Cold path | **FCSS / archive** target | Dry-run “would promote” + coupling estimate | One **promote-prepare** path (human-confirm) ending in cold ref |
| On-chain audit | **FVM TierRegistry** (Solidity) | **Deployed on Calibration**; `recordPromotion` mined | Deploy + verify on **Mainnet**; more Calibration txs |
| Observability | Prometheus gauges | `/metrics`, example alert YAML, hosted scrape pane | CI runway check + Grafana snippet docs |

#### 2.2 Why this is on-chain / FVM (criterion fit)

Next Step requires an on-chain FVM project. foc-ops centers on `contracts/TierRegistry.sol`:

- `recordPromotion(bytes32 warmPieceCid, bytes32 coldRefHash, bytes32 policyId)`  
- `getPromotion` / public `promotions` mapping  
- Emits `Promoted` for explorers and indexers  

Warm/cold CID strings are hashed (`keccak256`) so mappings are compact and auditable without storing arbitrary-length strings on-chain.

#### 2.3 PoC evidence (Calibration) — live demo is the walkthrough

| Artifact | Link |
| --- | --- |
| Hosted console | https://foc-ops.vercel.app |
| Private repo (public before submit) | https://github.com/panagot/foc-ops |
| TierRegistry | [`0xc71acb123f31e4ee57d7a0a34234522f61fde589`](https://calibration.filfox.info/en/address/0xc71acb123f31e4ee57d7a0a34234522f61fde589) |
| Deploy tx | [`0x1b06a2528a43ab8071214a62784c212ec5b46e460d9c08778f75018a25f6dcfb`](https://calibration.filfox.info/en/message/0x1b06a2528a43ab8071214a62784c212ec5b46e460d9c08778f75018a25f6dcfb) |
| Sample `recordPromotion` | [`0x24561b7e6d31b7feb002c702227559b7d4cf30f4524f67d538cd5da3e79cb381`](https://calibration.filfox.info/en/message/0x24561b7e6d31b7feb002c702227559b7d4cf30f4524f67d538cd5da3e79cb381) |
| Deployer / dogfood wallet | `0x82cb7b219c51ebc68fb2eE090393e2E05f01Fd08` |

**Reviewer path (no Loom required to apply):** open demo → RPC badge shows Calibration → Connect wallet (optional) → Run dry-run → Network + FVM shows registry address / wallet promote.

#### 2.4 Explicit non-goals (scope discipline)

- Not a replacement for [filecoin-pin](https://github.com/filecoin-project/filecoin-pin) / Synapse upload.  
- Not an SP marketplace, CDN, or Filebeam client.  
- Not a Terraform provider in *this* issue (backup only if declined — see §8).

#### 2.5 Technical design (current architecture)

```
CLI / Vercel console
  ├─ foc-ops status|network|metrics     → Filecoin Pay + Glif RPC
  ├─ foc-ops tier dry-run               → policy engine (age/size/source tier)
  ├─ foc-ops registry status|get        → TierRegistry reads
  └─ Browser wallet (EIP-1193)          → Calibration switch + optional recordPromotion
```

- Runtime: Node ≥20, ESM, `viem`, `@filoz/synapse-core`  
- Console APIs: `/api/status` `/api/tier` `/api/dry-run` `/api/network` `/api/registry` `/metrics`  
- Deploy helper: `scripts/deploy-registry.mjs` (solc + Calibration/Mainnet)

### 3. How will you improve your project with this grant?

**Already built (PoC):** FinOps CLI + hosted Calibration console, wallet connect/disconnect, live Pay scrape, tier dry-run + coupling model, Prometheus text, TierRegistry on Calibration + one promote tx, dual MIT/Apache license.

**What $5k / 30 days buys (the “Next Step”):** take the PoC from “Calibration demo” → “shippable ops tool with Mainnet registry + real inventory + one execute path.”

| # | Grant deliverable | How we meet objectives (detail) | Acceptance criteria | Days |
| --- | --- | --- | --- | --- |
| 1 | **Mainnet FinOps + ops docs** | Wire `foc-ops status` / `metrics` to Mainnet Pay via existing `synapse-core` client; document alert thresholds (`ok` / `low_runway` / `deficit`); publish Grafana/Prometheus snippet; harden README quickstart | CLI works with Mainnet address; docs merged; demo still green on Calibration | 1–10 |
| 2 | **Real inventory + promote-prepare** | Replace `examples/inventory.demo.json` with Synapse/FWSS inventory fetch for a configured account; CLI `tier dry-run` against live pieces; implement one **human-confirmed** warm→cold prepare that writes `recordPromotion` (Calibration first) | Dry-run lists real PieceCIDs when credentials/config present; ≥1 additional Calibration registry tx from the path | 11–22 |
| 3 | **Mainnet TierRegistry + ship** | Deploy `TierRegistry` to Mainnet; record addresses in `deployments/`; npm package publish (`foc-ops`); public repo polish; final issue update with explorer links | Verified Calibration **and** Mainnet contract addresses; `npm i foc-ops` works; MVP + demo URL in final update | 23–30 |

#### 3.1 Budget (indicative, single engineer)

| Use | Amount |
| --- | --- |
| Engineering (FinOps Mainnet, inventory, execute path, Mainnet deploy) | $4,200 |
| Testnet/mainnet fees, tooling, hosting (Vercel, RPC) | $300 |
| Docs / packaging / final report | $500 |
| **Total** | **$5,000** |

#### 3.2 Success metrics (evaluation-aligned)

| Metric | Target by day 30 |
| --- | --- |
| On-chain | TierRegistry verified on **Calibration + Mainnet**; ≥2 Calibration promote txs total |
| Product | Public GitHub + npm CLI; hosted demo remains live |
| Ops | Prometheus alerts documented; optional CI runway check |
| Adoption seed | Demo + CLI shared in ≥1 FIL-B / Filecoin Discord or Slack channel; short public post with demo link |

#### 3.3 Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| FWSS inventory API shape changes | Abstract adapter; keep JSON inventory fallback |
| Mainnet deploy cost / timing | Script already proven on Calibration; dry-run gas on Calibration first |
| 30-day crunch | PoC already done; grant scope is Mainnet + inventory + one execute path only |

### 4. What is the total amount of this grant request?

**$5,000 USD**

### 5. Adoption, Reach, and Growth Strategies

**Audience:** FOC / Synapse app builders and operators who already deposit USDFC into Filecoin Pay and pin/store on warm rails.

**First 10 users**

1. Dogfood on our Calibration + Mainnet Pay wallets.  
2. Share https://foc-ops.vercel.app + `npm` CLI in Filecoin Slack/Discord and FIL-B channels.  
3. One short public write-up (“see burn before warm dies”) linking demo + Filfox registry.  
4. Offer office-hours style walkthrough for 2–3 FOC builders (async).

**First 100 users**

1. npm `foc-ops` with copy-paste Prometheus rules.  
2. GitHub Action that fails CI when runway &lt; N days (compose with filecoin-pin workflows, not replace them).  
3. Keep demo public as the always-on PoC for docs and grant reporting.

### 6. If accepted, do you agree to share monthly project updates in this Github Issue until the project described here is complete?

Yes. For a 30-day $5k scope, expect **weekly progress comments** on this issue plus a **final update** with Mainnet/Calibration addresses, demo URL, npm package, and next 3–6 month plans.

### 7. Does your proposal comply with our Community Code of Conduct?

Yes.

### 8. Links and submissions

- Not a hackathon resubmit.  
- **Live demo:** https://foc-ops.vercel.app  
- **Repo:** https://github.com/panagot/foc-ops  
- **Email:** panagiotispollis@gmail.com  
- Backup if this ask is declined (**separate** issue only — do not amend this one): Terraform FOC provider — repo path `grant/BACKUP_TERRAFORM.md`.

### Additional questions

- **Team:** Panagiotis Pollis · **panagiotispollis@gmail.com** · GitHub [`panagot`](https://github.com/panagot) · sole engineer (product, CLI, FVM, console, docs).  
- **Timezone / response:** Europe (UTC+2 / UTC+3) · typically replies within 24h on email or issue comments.  
- **How I learned about this program:** Filecoin Foundation grants hub + Builder Next Step documentation in `filecoin-project/devgrants`.

---

## Post-approval: how Filecoin Foundation contacts you

1. **During review:** comments from FF staff (e.g. `FF-FOIT`) **on this GitHub issue**; sometimes questions by email.  
2. **If moving forward:** email to **panagiotispollis@gmail.com** with next steps / Open Source Software Grant Agreement (as in prior Next Step awards).  
3. **General grants inbox:** [grants@fil.org](mailto:grants@fil.org)  
4. **After contract:** monthly (here: weekly) updates stay on **this same issue** until completion; final update lists Mainnet + Calibration addresses and demo.

Watch: GitHub issue notifications + the email above.

---

## Proposer submit checklist (do not paste into issue)

1. [ ] Make https://github.com/panagot/foc-ops **public**  
2. [ ] Disable Vercel Deployment Protection (demo must open without login)  
3. [ ] Open Builder Next Step issue on `filecoin-project/devgrants` and paste §§ above (from Project Name through Additional questions)  
4. [ ] Keep Terraform out of this issue  
