# Prompt — foc-ops localhost demo (Calibration)

**Role:** Senior product designer + frontend engineer for Filecoin infrastructure tools.

**Product:** `foc-ops` — FOC Lifecycle Ops. Observe Filecoin Pay USDFC runway, alert before deficit, dry-run warm (FWSS) → cold (FCSS) tier promotions. Grant ask: Filecoin Builder Next Step $10k. Backup if declined: Terraform FOC provider (`grant/BACKUP_TERRAFORM.md`).

**Network:** Default **Filecoin Calibration testnet** (chain id 314159). Label it clearly. Live `getAccountSummary` via `@filoz/synapse-core`. Example inventory for tier dry-run until real piece feeds exist.

**Deliverable:** One localhost demo (`npm run demo` → http://localhost:5310) that feels like a real ops console, not a stub.

## Required chrome
1. **Header** — product name, Calibration badge, epoch/clock, link to metrics + grant docs.  
2. **Sidebar** — nav: Overview · FinOps · Tier policy · How it works · Grant & backup. Active section highlighting.  
3. **Footer** — Calibration RPC note, MIT license, pointer to backup Terraform proposal, repo path `filecoin/foc-ops`.  
4. **Tooltips** — every metric (runway, available, lockup, debt, promote-after) has a `?` control with plain-language explanation.  
5. **Graphs** — at least: runway gauge; funds vs lockup bar; promote vs skip breakdown; simple timeline of policy evaluation. SVG/CSS only (no new heavy chart libs unless already installed).  
6. **Explain how it works** — 4-step strip: Pay summary → Alert thresholds → Tier dry-run → FVM registry (M2).  
7. **Anti-slop** — no purple gradients, no Inter/Roboto, no emoji icons. Ops aesthetic: deep ink/zinc, one emerald accent, mono for data, sans for UI. Motion: subtle fades / bar grow only.

## Data
- FinOps: live Calibration for configurable address (default demo zero-address ok; show “demo address” callout).  
- Tier: `examples/policy.example.json` + `examples/inventory.example.json`.  
- APIs: `/api/status`, `/api/tier`, `/metrics`, static `/`.

## Success
Someone unfamiliar with FOC can open localhost, understand runway, see a promotion dry-run, and know what ships in the grant vs the Terraform backup.
