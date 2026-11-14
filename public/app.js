const $ = (sel) => document.querySelector(sel);

const state = {
  scenario: "live",
  address: "0x0000000000000000000000000000000000000001",
  promoteAfterDays: 30,
  minSizeBytes: 0,
  lastPromoteCount: null,
  lastAlert: null,
  spendStep: 0, // 0=base scenario, 1=force low, 2=force deficit override on display
  status: null,
  tier: null,
  wallet: null,
  registry: null,
  network: null,
};

function fmtUsdfc(weiStr) {
  const wei = BigInt(weiStr || "0");
  const whole = wei / 10n ** 18n;
  const frac = (wei % 10n ** 18n).toString().padStart(18, "0").slice(0, 4);
  return `${whole}.${frac} USDFC`;
}

function fmtBytes(n) {
  if (n == null) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KiB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MiB`;
  return `${(n / 1024 ** 3).toFixed(2)} GiB`;
}

function shortCid(s) {
  if (!s) return "—";
  return s.length > 28 ? `${s.slice(0, 18)}…${s.slice(-6)}` : s;
}

function alertClass(a) {
  if (a === "ok") return "ok";
  if (a === "low_runway") return "warn";
  return "bad";
}

function setNav(id) {
  document.querySelectorAll(".nav-item").forEach((b) => {
    b.classList.toggle("active", b.dataset.nav === id);
  });
  document.querySelectorAll(".panel").forEach((p) => {
    p.classList.toggle("active", p.id === `panel-${id}`);
  });
}

document.querySelectorAll("[data-nav]").forEach((el) => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    setNav(el.dataset.nav);
  });
});

function logFeed(el, level, msg) {
  const line = document.createElement("div");
  line.className = `feed-line ${level || ""}`;
  const ts = new Date().toISOString().slice(11, 19);
  line.innerHTML = `<span class="ts">${ts}</span><span>${msg}</span>`;
  el.prepend(line);
  while (el.children.length > 40) el.lastChild.remove();
}

function gaugeSvg(runwayDays) {
  const infinite = runwayDays === null;
  const days = infinite ? 30 : Math.max(0, Math.min(30, runwayDays));
  const pct = infinite ? 1 : days / 30;
  const r = 54;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);
  const color =
    infinite || days >= 14 ? "#2fbf8a" : days > 0 ? "#d4a017" : "#d4655a";
  const label = infinite ? "inf" : String(runwayDays);
  return `<svg viewBox="0 0 140 90" role="img" aria-label="Runway gauge">
    <path d="M16 70 A54 54 0 0 1 124 70" fill="none" stroke="#24302c" stroke-width="10" stroke-linecap="round"/>
    <path d="M16 70 A54 54 0 0 1 124 70" fill="none" stroke="${color}" stroke-width="10" stroke-linecap="round"
      stroke-dasharray="${c}" stroke-dashoffset="${offset}" style="transition:stroke-dashoffset 700ms ease"/>
    <text x="70" y="62" text-anchor="middle" fill="${color}" font-family="JetBrains Mono, monospace" font-size="18">${label}</text>
    <text x="70" y="78" text-anchor="middle" fill="#8b9c93" font-family="Sora, sans-serif" font-size="9">days / 30 scale</text>
  </svg>`;
}

function barSvg(funds, lockup, available) {
  const f = Number(BigInt(funds || "0")) / 1e18;
  const l = Number(BigInt(lockup || "0")) / 1e18;
  const a = Number(BigInt(available || "0")) / 1e18;
  const max = Math.max(f, l, a, 0.0001);
  const rows = [
    { name: "funds", v: f, color: "#5a8f7b" },
    { name: "lockup", v: l, color: "#d4a017" },
    { name: "available", v: a, color: "#2fbf8a" },
  ];
  const h = 18;
  const gap = 14;
  const height = rows.length * (h + gap) + 8;
  const bars = rows
    .map((r, i) => {
      const y = 8 + i * (h + gap);
      const w = Math.max(2, (r.v / max) * 220);
      return `<text x="0" y="${y + 13}" fill="#8b9c93" font-size="10" font-family="Sora,sans-serif">${r.name}</text>
        <rect x="70" y="${y}" width="220" height="${h}" rx="4" fill="#24302c"/>
        <rect x="70" y="${y}" width="${w}" height="${h}" rx="4" fill="${r.color}" style="transition:width 700ms ease"/>`;
    })
    .join("");
  return `<svg viewBox="0 0 300 ${height}" role="img">${bars}</svg>`;
}

function pieSvg(promote, skip) {
  const total = Math.max(1, promote + skip);
  const p = (promote / total) * 360;
  const r = 48;
  const cx = 70;
  const cy = 55;
  const toXY = (deg) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };
  const [x1, y1] = toXY(0);
  const [x2, y2] = toXY(p);
  const large = p > 180 ? 1 : 0;
  const path =
    promote === 0
      ? ""
      : `<path d="M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z" fill="#2fbf8a"/>`;
  return `<svg viewBox="0 0 200 120" role="img">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#24302c"/>
    ${path}
    <circle cx="${cx}" cy="${cy}" r="28" fill="#101614"/>
    <text x="140" y="48" fill="#2fbf8a" font-size="11" font-family="JetBrains Mono,monospace">promote ${promote}</text>
    <text x="140" y="68" fill="#8b9c93" font-size="11" font-family="JetBrains Mono,monospace">skip ${skip}</text>
  </svg>`;
}

function timelineSvg(items, thresholdDays) {
  const w = 320;
  const h = 110;
  const maxAge = Math.max(thresholdDays, ...items.map((i) => i.ageDays || 0), 1);
  const thrX = 40 + (thresholdDays / maxAge) * 240;
  const dots = items
    .slice(0, 36)
    .map((it, idx) => {
      const age = it.ageDays ?? 0;
      const x = 40 + (age / maxAge) * 240;
      const y = 28 + (idx % 4) * 16;
      const fill = age >= thresholdDays ? "#2fbf8a" : "#8b9c93";
      return `<circle cx="${x}" cy="${y}" r="4" fill="${fill}" opacity="0.9"><title>${it.pieceCid || ""} age ${age}d</title></circle>`;
    })
    .join("");
  return `<svg viewBox="0 0 ${w} ${h}" role="img">
    <line x1="40" y1="92" x2="280" y2="92" stroke="#24302c" stroke-width="2"/>
    <line x1="${thrX}" y1="16" x2="${thrX}" y2="96" stroke="#d4a017" stroke-dasharray="4 3"/>
    <text x="${thrX}" y="12" text-anchor="middle" fill="#d4a017" font-size="9" font-family="Sora,sans-serif">${thresholdDays}d</text>
    ${dots}
  </svg>`;
}

function applySpendOverride(status) {
  if (!status || status.error) return status;
  if (state.spendStep === 0) return status;
  if (state.spendStep === 1) {
    return {
      ...status,
      runwayDays: Math.min(status.runwayDays ?? 6, 5.1),
      availableFunds: "8000000000000000000",
      alert: "low_runway",
      drill: "injected_low_runway",
    };
  }
  return {
    ...status,
    runwayDays: 0,
    availableFunds: "0",
    debt: "42000000000000000000",
    alert: "deficit",
    healthy: false,
    drill: "injected_deficit",
  };
}

function pulseAlert(alert) {
  const shell = $("#appShell");
  shell.classList.remove("pulse-warn", "pulse-bad");
  if (alert === "low_runway") shell.classList.add("pulse-warn");
  if (alert === "deficit") shell.classList.add("pulse-bad");
  if (state.lastAlert && state.lastAlert !== alert) {
    logFeed(
      $("#activityFeed"),
      alert === "ok" ? "ok" : "warn",
      `ALERT THRESHOLD · ${state.lastAlert} → ${alert}`
    );
  }
  state.lastAlert = alert;
}

function renderStatus(raw) {
  const status = applySpendOverride(raw);
  state.status = status;
  if (status.error) {
    $("#demoCallout").textContent = `Error: ${status.error}`;
    return;
  }

  const modeLabel =
    status.mode === "live"
      ? `Live Calibration · ${shortCid(status.address)}`
      : `Scenario <strong>${status.scenario}</strong> · ${shortCid(status.address)}`;
  $("#demoCallout").innerHTML = `${modeLabel}${
    status.drill ? ` · drill <code class="mono">${status.drill}</code>` : ""
  } · scrape ${status.scrapeMs ?? "—"}ms`;

  const runwayLabel =
    status.runwayDays === null ? "∞" : String(status.runwayDays);
  $("#ovRunway").textContent = runwayLabel;
  $("#ovRunwaySub").textContent =
    status.alert === "deficit"
      ? "in deficit · rails at risk"
      : "until Pay deficit · Calibration-shaped";
  $("#ovAlert").className = alertClass(status.alert);
  $("#ovAlert").textContent = status.alert;
  $("#epochBadge").textContent = `epoch ${status.epoch}`;
  $("#scrapeBadge").textContent = `${status.scrapeMs ?? "—"}ms · ${new Date(
    status.scrapedAt || Date.now()
  ).toISOString().slice(11, 19)}Z`;
  $("#alertBadge").className = `badge alert-badge ${alertClass(status.alert)}`;
  $("#alertBadge").textContent = `alert ${status.alert}`;
  $("#gaugeChart").innerHTML = gaugeSvg(status.runwayDays);
  $("#barChart").innerHTML = barSvg(
    status.funds,
    status.totalLockup,
    status.availableFunds
  );
  $("#finopsKv").innerHTML = [
    ["mode", status.scenario || status.mode],
    ["funds", fmtUsdfc(status.funds)],
    ["available", fmtUsdfc(status.availableFunds)],
    ["lockup", fmtUsdfc(status.totalLockup)],
    ["debt", fmtUsdfc(status.debt)],
    [
      "runway",
      status.runwayDays === null ? "∞" : `${status.runwayDays} days`,
    ],
  ]
    .map(
      ([k, v]) =>
        `<div class="kv-row"><span>${k}</span><span class="mono">${v}</span></div>`
    )
    .join("");

  $("#cliMirror").textContent = [
    `$ foc-ops status --address ${status.address} --network calibration`,
    `network=${status.network} scenario=${status.scenario}`,
    `runway=${runwayLabel}d alert=${status.alert}`,
    `available=${fmtUsdfc(status.availableFunds)} lockup=${fmtUsdfc(status.totalLockup)} debt=${fmtUsdfc(status.debt)}`,
    `epoch=${status.epoch}`,
  ].join("\n");

  pulseAlert(status.alert);
}

function renderTier(tier) {
  state.tier = tier;
  const promote = tier.promote || [];
  const skip = tier.skip || [];
  $("#ovPromote").textContent = String(promote.length);
  $("#ovSkip").textContent = String(skip.length);
  $("#ovInv").textContent = String(tier.inventoryCount ?? "—");
  $("#policyDaysLabel").textContent = String(tier.policy?.promoteAfterDays ?? 30);
  $("#minSizeLabel").textContent = String(tier.policy?.minSizeBytes ?? 0);

  if (state.lastPromoteCount !== null) {
    const d = promote.length - state.lastPromoteCount;
    $("#tierDelta").textContent =
      d === 0 ? `Δ promote 0` : `Δ promote ${d > 0 ? "+" : ""}${d}`;
    $("#tierDelta").className = `delta ${d > 0 ? "up" : d < 0 ? "down" : ""}`;
  }
  state.lastPromoteCount = promote.length;

  const c = tier.coupling;
  if (c) {
    $("#couplingDays").textContent = `+${c.runwayDaysGained}d`;
    $("#couplingSub").textContent = `${c.promoteCount} promotes · ${c.gib} GiB · −${c.burnSavedPerDayUsdfc} USDFC/day burn (demo model)`;
  }

  $("#pieChart").innerHTML = pieSvg(promote.length, skip.length);
  const ages = [
    ...promote.map((p) => ({ ...p, ageDays: p.ageDays })),
    ...skip.map((p) => {
      const m = /age ([\d.]+)d/.exec(p.reason || "");
      return { ...p, ageDays: m ? Number(m[1]) : 0 };
    }),
  ];
  $("#timelineChart").innerHTML = timelineSvg(
    ages,
    tier.policy?.promoteAfterDays ?? 30
  );

  $("#promoteBody").innerHTML = promote.length
    ? promote
        .map(
          (p) =>
            `<tr><td class="mono">${shortCid(p.pieceCid)}</td><td class="mono">${p.ageDays ?? "—"}d</td><td class="mono">${fmtBytes(p.sizeBytes)}</td><td>${p.reason}</td></tr>`
        )
        .join("")
    : `<tr><td colspan="4" class="muted">Nothing to promote — lower promoteAfterDays</td></tr>`;

  $("#skipBody").innerHTML = skip
    .slice(0, 40)
    .map(
      (p) =>
        `<tr><td class="mono">${shortCid(p.pieceCid)}</td><td class="muted">${p.reason}</td><td><span class="tag">${p.tier || "?"}</span></td></tr>`
    )
    .join("");
}

async function fetchMetrics() {
  const q = new URLSearchParams({
    scenario: state.scenario,
    address: state.address,
  });
  const res = await fetch(`/api/metrics-text?${q}`);
  const text = await res.text();
  $("#metricsPane").textContent = text.trim();
}

async function fetchNetworkAndRegistry() {
  const [netRes, regRes] = await Promise.all([
    fetch("/api/network"),
    fetch("/api/registry"),
  ]);
  const net = await netRes.json();
  const reg = await regRes.json();
  state.network = net;
  state.registry = reg;

  if (net.ok) {
    $("#rpcBadge").textContent = `RPC live · blk ${net.blockNumber} · ${net.latencyMs}ms`;
    $("#rpcBadge").classList.add("ok");
  } else {
    $("#rpcBadge").textContent = `RPC fail · ${net.error || "error"}`;
    $("#rpcBadge").classList.add("bad");
  }

  $("#netKv").innerHTML = net.ok
    ? [
        ["ok", "true"],
        ["network", net.network],
        ["chainId", `${net.chainId} (expect ${net.expectedChainId})`],
        ["block", net.blockNumber],
        ["latency", `${net.latencyMs}ms`],
        ["rpc", net.rpcUrl],
      ]
        .map(
          ([k, v]) =>
            `<div class="kv-row"><span>${k}</span><span class="mono">${v}</span></div>`
        )
        .join("")
    : `<div class="kv-row"><span>error</span><span class="bad">${net.error}</span></div>`;

  $("#regKv").innerHTML = [
    ["deployed", String(reg.deployed)],
    ["address", reg.address || "(not deployed)"],
    ["network", reg.network],
  ]
    .map(
      ([k, v]) =>
        `<div class="kv-row"><span>${k}</span><span class="mono">${v}</span></div>`
    )
    .join("");

  $("#regHint").textContent = reg.deployed
    ? "Registry live — wallet can submit recordPromotion on Calibration."
    : reg.deployHint || "Deploy TierRegistry to enable on-chain promote.";

  $("#txTemplate").textContent = reg.walletTxTemplate
    ? JSON.stringify(reg.walletTxTemplate, null, 2)
    : `sample calldata:\n${reg.sampleCalldata}\n\n${reg.deployHint}`;
}

async function ensureCalibration(ethereum, chain) {
  const id = await ethereum.request({ method: "eth_chainId" });
  if (id?.toLowerCase() === chain.chainId.toLowerCase()) return;
  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chain.chainId }],
    });
  } catch (err) {
    if (err?.code === 4902 || String(err?.message || "").includes("4902")) {
      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: chain.chainId,
            chainName: chain.chainName,
            nativeCurrency: chain.nativeCurrency,
            rpcUrls: chain.rpcUrls,
            blockExplorerUrls: chain.blockExplorerUrls,
          },
        ],
      });
    } else {
      throw err;
    }
  }
}

async function connectWallet() {
  const ethereum = window.ethereum;
  if (!ethereum) {
    logFeed($("#activityFeed"), "warn", "no EIP-1193 wallet — install MetaMask/Rabby");
    return;
  }
  const reg = state.registry || (await (await fetch("/api/registry")).json());
  state.registry = reg;
  const chain = reg.calibrationChain;
  await ensureCalibration(ethereum, chain);
  const accounts = await ethereum.request({
    method: "eth_requestAccounts",
  });
  const addr = accounts?.[0];
  if (!addr) return;
  state.wallet = addr;
  state.address = addr;
  state.scenario = "live";
  state.spendStep = 0;
  $("#addrInput").value = addr;
  document.querySelectorAll("[data-scenario]").forEach((b) => {
    b.classList.toggle("active", b.dataset.scenario === "live");
  });
  $("#btnWallet").textContent = `${addr.slice(0, 6)}…${addr.slice(-4)}`;
  $("#btnWallet").classList.add("connected");
  $("#btnWalletSide").textContent = "Wallet connected · live Pay";
  $("#walletNote").innerHTML = `Live Filecoin Pay for <code class="mono">${addr}</code> on Calibration.`;
  logFeed($("#activityFeed"), "ok", `wallet connected · ${addr.slice(0, 10)}… · live mode`);
  await refresh();
}

async function walletSubmitPromote() {
  const ethereum = window.ethereum;
  if (!ethereum || !state.wallet) {
    await connectWallet();
  }
  if (!window.ethereum || !state.wallet) return;
  const reg =
    state.registry || (await (await fetch("/api/registry")).json());
  if (!reg.deployed || !reg.walletTxTemplate) {
    logFeed(
      $("#activityFeed"),
      "warn",
      "registry not deployed — run scripts/deploy-registry.mjs with FOC_PRIVATE_KEY"
    );
    setNav("network");
    return;
  }
  await ensureCalibration(window.ethereum, reg.calibrationChain);
  const tx = reg.walletTxTemplate;
  const hash = await window.ethereum.request({
    method: "eth_sendTransaction",
    params: [
      {
        from: state.wallet,
        to: tx.to,
        data: tx.data,
        value: tx.value || "0x0",
      },
    ],
  });
  logFeed($("#activityFeed"), "ok", `recordPromotion tx ${hash}`);
  $("#txTemplate").textContent = `submitted:\n${hash}\n\n${JSON.stringify(tx, null, 2)}`;
}

async function refresh() {
  const sq = new URLSearchParams({
    scenario: state.scenario,
    address: state.address,
  });
  const tq = new URLSearchParams({
    promoteAfterDays: String(state.promoteAfterDays),
    minSizeBytes: String(state.minSizeBytes),
  });
  const [statusRes, tierRes] = await Promise.all([
    fetch(`/api/status?${sq}`),
    fetch(`/api/tier?${tq}`),
  ]);
  const status = await statusRes.json();
  const tier = await tierRes.json();
  renderStatus(status);
  renderTier(tier);
  await Promise.all([fetchMetrics(), fetchNetworkAndRegistry()]);
}

async function runDryRun() {
  const feed = $("#activityFeed");
  const intents = $("#intentFeed");
  intents.innerHTML = "";
  logFeed(feed, "info", "dry-run started");
  setNav("tier");
  const q = new URLSearchParams({
    promoteAfterDays: String(state.promoteAfterDays),
    minSizeBytes: String(state.minSizeBytes),
  });
  const res = await fetch(`/api/dry-run?${q}`);
  const data = await res.json();
  for (const step of data.steps || []) {
    await new Promise((r) => setTimeout(r, Math.min(step.t ? 45 : 30, 80)));
    logFeed(feed, step.level, step.msg);
    if (step.intent) {
      const row = document.createElement("div");
      row.className = "intent";
      row.innerHTML = `<div class="mono">${shortCid(step.intent.pieceCid)}</div>
        <div class="muted">${step.intent.action} · ${fmtBytes(step.intent.sizeBytes)}</div>
        <div class="mono intent-call">${step.intent.registryCalldataPreview}</div>`;
      intents.prepend(row);
    }
  }
  $("#cliMirror").textContent += `\n$ foc-ops tier dry-run — would promote ${data.promote?.length ?? 0}`;
  logFeed(feed, "ok", "dry-run complete · no chain writes");
}

function injectSpend() {
  state.spendStep = Math.min(2, state.spendStep + 1);
  if (state.status) renderStatus(state.status);
  fetchMetrics();
  logFeed(
    $("#activityFeed"),
    "warn",
    state.spendStep === 1
      ? "INJECT SPEND · forcing low_runway"
      : "INJECT SPEND · forcing deficit"
  );
  setNav("finops");
}

// Scenario buttons
document.querySelectorAll("[data-scenario]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.scenario = btn.dataset.scenario;
    state.spendStep = 0;
    document.querySelectorAll("[data-scenario]").forEach((b) => {
      b.classList.toggle("active", b === btn);
    });
    logFeed($("#activityFeed"), "info", `scenario → ${state.scenario}`);
    refresh().catch(console.error);
  });
});

$("#btnApplyAddr").addEventListener("click", () => {
  const v = $("#addrInput").value.trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(v)) {
    logFeed($("#activityFeed"), "warn", "invalid address");
    return;
  }
  state.address = v;
  refresh().catch(console.error);
});

$("#btnRunDry").addEventListener("click", () => {
  runDryRun().catch((e) => logFeed($("#activityFeed"), "warn", String(e)));
});
$("#btnInjectSpend").addEventListener("click", injectSpend);
$("#btnWallet").addEventListener("click", () =>
  connectWallet().catch((e) => logFeed($("#activityFeed"), "warn", String(e)))
);
$("#btnWalletSide").addEventListener("click", () =>
  connectWallet().catch((e) => logFeed($("#activityFeed"), "warn", String(e)))
);
$("#btnSignPromote").addEventListener("click", () =>
  walletSubmitPromote().catch((e) =>
    logFeed($("#activityFeed"), "warn", String(e?.message || e))
  )
);

$("#policyDays").addEventListener("input", (e) => {
  state.promoteAfterDays = Number(e.target.value);
  $("#policyDaysLabel").textContent = String(state.promoteAfterDays);
  refresh().catch(console.error);
});
$("#minSize").addEventListener("input", (e) => {
  state.minSizeBytes = Number(e.target.value);
  $("#minSizeLabel").textContent = String(state.minSizeBytes);
  refresh().catch(console.error);
});

refresh()
  .then(() => logFeed($("#activityFeed"), "ok", "console live · Calibration Pay default"))
  .catch((err) => {
    $("#demoCallout").textContent = String(err);
  });

setInterval(() => {
  refresh().catch(() => {});
}, 8000);
