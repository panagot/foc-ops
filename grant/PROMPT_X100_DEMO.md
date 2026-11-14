# Prompt — foc-ops X100 capability theater

**Debate source:** Auto + [Critic](96fb6b77-5506-4884-bcf3-d5d51e8a24bf) — reject chrome-only; ship verbs.

**Role:** Senior ops-product engineer. Turn the Calibration console from a static poster into a live lifecycle demo a Next Step reviewer can *operate*.

**Product:** `foc-ops` — Filecoin Pay runway → alerts → warm→cold dry-run → projected registry intents. Path `filecoin/foc-ops`. Network Calibration (314159).

## Non-negotiables (capability theater)

1. **Scenario pack** — `Healthy` | `Low runway` (default) | `Deficit` | `Live Calibration`. First paint must *hurt* (low runway / alert firing), not ∞ on `0x…0001`.
2. **Address + poll** — paste `0x` address; 8s refresh; ticking epoch / last scrape / latency badge.
3. **Policy scrubber** — live `promoteAfterDays` + `minSizeBytes`; re-evaluate; rows migrate promote↔skip; delta counts.
4. **Run dry-run** — buttoned action with stepped activity feed: read inventory → apply policy → would promote N → projected registry intents (unsigned / no chain write).
5. **Alert drill** — embed metrics scrape; inject spend steps `ok → low_runway → deficit`; header pulse + log on threshold cross; show PromQL that would fire.
6. **Runway ↔ tier coupling** — “Promote N warm → est. burn ↓ → runway +Xd” (honest demo model, labeled).
7. **Inventory that looks real** — 30+ pieces, real-shaped CIDs, sizes, ages; filterable tables.
8. **Grant demoted** — one footer sentence + link to `.md`; not a primary product panel. How-it-works = what you just ran.

## Anti-goals

No extra tooltips-for-tooltips, font polish, grant copy essays, or Loom of the old idle UI.

## Success

Reviewer opens `:5310` → Low runway · alert firing → scrubs policy → runs dry-run → sees intents + coupling → drills alert to deficit. They believe M1–M2 already exist.
