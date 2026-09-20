import { useEffect, useRef } from 'react';

// Generated from the published engagement-plan artifact. Styles are scoped under
// .proposal-page so this route can live inside the SPA without leaking into any
// other screen's DOM.

const PROPOSAL_STYLES = `

  :root {
    --ink: #111827;
    --muted: #64748B;
    --paper: #F8FAFC;
    --brand: #50BB7F;
    --brand-dark: #369663;
    --brand-light: #6EE7B7;
    --white-glass: rgba(255,255,255,.4);
    --white-glass-soft: rgba(255,255,255,.55);
    --border: rgba(17,24,39,.1);
    --shadow-soft: 0 18px 50px rgba(17,24,39,.08);
    --shadow-glass: 0 22px 70px rgba(17,24,39,.12);
    --shadow-glow: 0 18px 45px rgba(80,187,127,.26);
  }

   .proposal-page * { box-sizing: border-box; }
   .proposal-page { scroll-behavior: smooth; }
   .proposal-page {
    margin: 0;
    background: var(--paper);
    color: var(--ink);
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
    font-variant-numeric: tabular-nums;
  }
   .proposal-page a { color: inherit; text-decoration: none; }
   .proposal-page h1, .proposal-page h2, .proposal-page h3 { text-wrap: balance; margin: 0; }
   .proposal-page p { margin: 0; }
   .proposal-page ul { margin: 0; padding: 0; list-style: none; }
   .proposal-page table { border-collapse: collapse; width: 100%; }

   .proposal-page .wrap { max-width: 72rem; margin: 0 auto; padding-inline: 20px; }
  @media (min-width: 640px) {  .proposal-page .wrap { padding-inline: 24px; } }
  @media (min-width: 1024px) {  .proposal-page .wrap { padding-inline: 32px; } }

  /* ---- top bar ---- */
   .proposal-page .topbar {
    position: sticky; top: env(safe-area-inset-top, 0px); z-index: 40;
    background: rgba(237,237,237,.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border);
  }
   .proposal-page .topbar-inner {
    max-width: 72rem; margin: 0 auto; padding: 10px 20px;
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
  }
   .proposal-page .topbar-brand { font-size: 14px; font-weight: 700; white-space: nowrap; }
   .proposal-page .toc { display: none; align-items: center; gap: 6px; overflow-x: auto; scrollbar-width: none; }
   .proposal-page .toc::-webkit-scrollbar { display: none; }
  @media (min-width: 1100px) {  .proposal-page .toc { display: flex; } }
   .proposal-page .toc a {
    white-space: nowrap; border-radius: 999px; padding: 7px 13px; font-size: 11px; font-weight: 800;
    letter-spacing: .02em; color: rgba(17,24,39,.55); transition: all .2s;
  }
   .proposal-page .toc a:hover { background: rgba(255,255,255,.5); color: var(--brand); }
   .proposal-page .toc a.active { background: var(--brand); color: #fff; box-shadow: var(--shadow-glow); }
   .proposal-page .btn-print {
    display: inline-flex; align-items: center; gap: 7px; min-height: 38px; border-radius: 999px;
    border: 1px solid rgba(17,24,39,.8); background: transparent; padding: 8px 16px;
    font-family: inherit; font-size: 13px; font-weight: 700; color: var(--ink); cursor: pointer;
    transition: all .2s; flex-shrink: 0;
  }
   .proposal-page .btn-print:hover { background: rgba(255,255,255,.5); transform: translateY(-1px); }

  /* ---- hero ---- */
   .proposal-page .hero {
    border-radius: 1rem; border: 1px solid var(--border); background: var(--white-glass);
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    box-shadow: var(--shadow-soft); padding: 28px; margin-top: 24px;
  }
  @media (min-width: 640px) {  .proposal-page .hero { padding: 40px; } }
  @media (min-width: 1024px) {  .proposal-page .hero { padding: 48px; } }
   .proposal-page .hero-top { display: flex; flex-direction: column; gap: 28px; }
  @media (min-width: 1024px) {  .proposal-page .hero-top { flex-direction: row; align-items: flex-end; justify-content: space-between; } }
   .proposal-page .hero-badge {
    display: inline-flex; border-radius: 999px; background: rgba(80,187,127,.1); color: var(--brand);
    padding: 7px 16px; font-size: 13px; font-weight: 700;
  }
   .proposal-page .kicker { font-size: 14px; font-weight: 500; color: rgba(17,24,39,.7); margin-top: 30px; }
   .proposal-page h1.title { font-size: clamp(2.6rem, 7vw, 5.5rem); font-weight: 700; line-height: .95; letter-spacing: -.02em; margin-top: 18px; }
   .proposal-page .title .accent { color: var(--brand); }
   .proposal-page .lede { max-width: 46rem; font-size: 19px; font-weight: 600; line-height: 1.5; color: rgba(17,24,39,.7); margin-top: 18px; }
   .proposal-page .lede-body { max-width: 46rem; font-size: 15px; line-height: 1.7; color: rgba(17,24,39,.65); margin-top: 20px; }

   .proposal-page .stat-col { display: grid; gap: 14px; min-width: 240px; }
   .proposal-page .stat-card { border-radius: 1rem; border: 1px solid var(--border); background: rgba(255,255,255,.5); padding: 18px; }
   .proposal-page .stat-label { font-size: 11px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: rgba(17,24,39,.5); }
   .proposal-page .stat-value { font-size: 26px; font-weight: 700; letter-spacing: -.01em; margin-top: 8px; }
   .proposal-page .stat-desc { font-size: 13px; line-height: 1.5; color: rgba(17,24,39,.55); margin-top: 6px; }

   .proposal-page .chip-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 28px; }
   .proposal-page .chip { border-radius: 999px; border: 1px solid var(--border); background: rgba(255,255,255,.5); padding: 8px 15px; font-size: 13px; font-weight: 600; color: rgba(17,24,39,.8); }

   .proposal-page .meta-grid {
    display: grid; gap: 16px; border-top: 1px solid var(--border); padding-top: 24px; margin-top: 30px;
    font-size: 14px; line-height: 1.6; color: rgba(17,24,39,.7);
  }
  @media (min-width: 640px) {  .proposal-page .meta-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (min-width: 1024px) {  .proposal-page .meta-grid { grid-template-columns: repeat(4, 1fr); } }
   .proposal-page .meta-grid .meta-label { display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .1em; color: rgba(17,24,39,.4); margin-bottom: 4px; }
   .proposal-page .meta-grid strong { font-weight: 700; color: var(--ink); }

  /* ---- sections ---- */
   .proposal-page .section { padding-block: 48px; border-top: 1px solid var(--border); scroll-margin-top: 90px; }
  @media (min-width: 640px) {  .proposal-page .section { padding-block: 64px; } }
   .proposal-page .section-head { display: flex; flex-direction: column; gap: 14px; margin-bottom: 30px; }
  @media (min-width: 640px) {  .proposal-page .section-head { flex-direction: row; align-items: flex-end; justify-content: space-between; } }
   .proposal-page .section-kicker { font-size: 12px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--brand-dark); }
   .proposal-page .section-title { font-size: clamp(1.7rem, 4vw, 2.75rem); font-weight: 700; line-height: 1.05; letter-spacing: -.01em; margin-top: 12px; max-width: 44rem; }
   .proposal-page .ghost-num { font-size: clamp(3rem, 8vw, 4.5rem); font-weight: 700; line-height: 1; color: rgba(17,24,39,.05); flex-shrink: 0; }

  /* ---- cards ---- */
   .proposal-page .grid { display: grid; gap: 18px; }
   .proposal-page .cols-2 { grid-template-columns: repeat(1, 1fr); }
   .proposal-page .cols-3 { grid-template-columns: repeat(1, 1fr); }
   .proposal-page .cols-4 { grid-template-columns: repeat(1, 1fr); }
   .proposal-page .cols-5 { grid-template-columns: repeat(1, 1fr); }
  @media (min-width: 640px) {  .proposal-page .cols-2, .proposal-page .cols-3, .proposal-page .cols-4, .proposal-page .cols-5 { grid-template-columns: repeat(2, 1fr); } }
  @media (min-width: 1024px) {  .proposal-page .cols-3 { grid-template-columns: repeat(3, 1fr); }  .proposal-page .cols-4 { grid-template-columns: repeat(4, 1fr); }  .proposal-page .cols-5 { grid-template-columns: repeat(5, 1fr); } }

   .proposal-page .card {
    border-radius: 1rem; border: 1px solid var(--border); background: var(--white-glass);
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    box-shadow: var(--shadow-soft); padding: 24px;
  }
   .proposal-page .card h3 { font-size: 19px; font-weight: 700; line-height: 1.3; }
   .proposal-page .card p.desc { margin-top: 14px; font-size: 14.5px; line-height: 1.6; color: rgba(17,24,39,.65); }

   .proposal-page .bullets { display: flex; flex-direction: column; gap: 11px; font-size: 14.5px; line-height: 1.5; color: rgba(17,24,39,.7); }
   .proposal-page .bullets.mt { margin-top: 18px; }
   .proposal-page .bullets li { display: flex; gap: 10px; }
   .proposal-page .bullets li::before { content: ''; flex: none; width: 15px; height: 15px; margin-top: 2px; border-radius: 50%; background: var(--brand); -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 6L9 17l-5-5'/%3E%3C/svg%3E") center/70% no-repeat; mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 6L9 17l-5-5'/%3E%3C/svg%3E") center/70% no-repeat; }
   .proposal-page .bullets.cols2 { columns: 1; column-gap: 24px; }
  @media (min-width: 640px) {  .proposal-page .bullets.cols2 { columns: 2; } }
   .proposal-page .bullets.cols2 li { break-inside: avoid; margin-bottom: 4px; }

   .proposal-page .callout { border-radius: 1rem; background: rgba(80,187,127,.1); padding: 18px 20px; font-size: 14px; font-weight: 700; line-height: 1.6; color: var(--ink); }
   .proposal-page .callout.card-style { border: 1px solid var(--border); background: var(--white-glass); box-shadow: var(--shadow-soft); font-weight: 400; color: rgba(17,24,39,.7); }
   .proposal-page .callout.dark { border-radius: 1rem; background: var(--ink); color: #fff; padding: 28px; box-shadow: var(--shadow-glass); }
   .proposal-page .callout.dark .big { font-size: clamp(1.4rem,3.4vw,2.2rem); font-weight: 700; line-height: 1.2; max-width: 50rem; }
   .proposal-page .callout.dark p.sub { margin-top: 16px; max-width: 50rem; font-size: 15px; line-height: 1.7; color: rgba(255,255,255,.75); }

  /* ---- flow diagram ---- */
   .proposal-page .flow { border-radius: 1rem; border: 1px solid var(--border); background: var(--white-glass); backdrop-filter: blur(20px); box-shadow: var(--shadow-soft); padding: 22px; }
  @media (min-width: 640px) {  .proposal-page .flow { padding: 30px; } }
   .proposal-page .flow h3 { font-size: 19px; font-weight: 700; }
   .proposal-page .flow-steps { display: grid; gap: 12px; margin-top: 24px; grid-template-columns: 1fr; }
  @media (min-width: 640px) {  .proposal-page .flow-steps { grid-template-columns: repeat(2, 1fr); } }
  @media (min-width: 1024px) {  .proposal-page .flow-steps { grid-template-columns: repeat(4, 1fr); } }
   .proposal-page .flow-step { position: relative; border-radius: 1rem; border: 1px solid var(--border); background: rgba(255,255,255,.45); padding: 16px; }
   .proposal-page .flow-step .n { font-size: 11px; font-weight: 800; letter-spacing: .1em; color: var(--brand); }
   .proposal-page .flow-step p { margin-top: 9px; font-size: 14px; font-weight: 700; line-height: 1.4; }
   .proposal-page .flow-arrow { display: none; position: absolute; right: -14px; top: 50%; transform: translateY(-50%); width: 22px; height: 22px; background: var(--brand); border-radius: 50%; color: #fff; padding: 4px; box-sizing: border-box; }
  @media (min-width: 1024px) {  .proposal-page .flow-arrow { display: block; } }
   .proposal-page .flow-branches { margin-top: 18px; border-radius: 1rem; background: rgba(80,187,127,.1); padding: 16px; }
   .proposal-page .flow-branches .lbl { font-size: 11px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--brand); }

  /* ---- tables ---- */
   .proposal-page .table-wrap { overflow-x: auto; border-radius: 1rem; border: 1px solid var(--border); background: var(--white-glass); box-shadow: var(--shadow-soft); }
   .proposal-page table.matrix { min-width: 640px; font-size: 13.5px; }
   .proposal-page table.matrix thead { background: var(--ink); color: #fff; }
   .proposal-page table.matrix th { padding: 14px 18px; font-weight: 700; text-align: left; white-space: nowrap; }
   .proposal-page table.matrix td { padding: 14px 18px; border-top: 1px solid var(--border); vertical-align: top; line-height: 1.6; color: rgba(17,24,39,.7); min-width: 150px; }
   .proposal-page table.matrix tbody tr:nth-child(even) { background: rgba(255,255,255,.55); }
   .proposal-page table.matrix tbody tr:nth-child(odd) { background: rgba(255,255,255,.3); }

   .proposal-page .module-table { border-radius: 1rem; overflow: hidden; border: 1px solid var(--border); background: var(--white-glass); box-shadow: var(--shadow-soft); }
   .proposal-page .module-table .mt-head { border-bottom: 1px solid var(--border); padding: 16px 20px; font-size: 16px; font-weight: 700; }
   .proposal-page .module-table table { font-size: 13.5px; }
   .proposal-page .module-table td { padding: 12px 20px; }
   .proposal-page .module-table tr:nth-child(even) td { background: rgba(255,255,255,.55); }
   .proposal-page .module-table tr:nth-child(odd) td { background: rgba(255,255,255,.3); }
   .proposal-page .module-table tr.total td { background: rgba(80,187,127,.12); font-weight: 800; border-top: 1px solid var(--border); }
   .proposal-page .module-table td:last-child { text-align: right; font-weight: 800; }

   .proposal-page .big-stat-block { border-radius: 1rem; background: var(--ink); color: #fff; padding: 26px 28px; box-shadow: var(--shadow-glass); }
   .proposal-page .big-stat-block .lbl { font-size: 12px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; color: var(--brand-light); }
   .proposal-page .big-stat-block .num { font-size: clamp(2.6rem,7vw,4rem); font-weight: 700; margin-top: 8px; }
   .proposal-page .big-stat-block p { margin-top: 12px; max-width: 46rem; line-height: 1.6; color: rgba(255,255,255,.75); font-size: 14.5px; }

   .proposal-page .mini-stats { display: grid; gap: 14px; grid-template-columns: repeat(2, 1fr); }
  @media (min-width: 1024px) {  .proposal-page .mini-stats { grid-template-columns: repeat(4, 1fr); } }
   .proposal-page .mini-stat { border-radius: 1rem; border: 1px solid var(--border); background: rgba(255,255,255,.5); padding: 18px; }
   .proposal-page .mini-stat .l { font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: rgba(17,24,39,.45); }
   .proposal-page .mini-stat .v { font-size: 30px; font-weight: 700; margin-top: 10px; }
   .proposal-page .mini-stat .d { font-size: 13px; font-weight: 600; color: rgba(17,24,39,.55); margin-top: 4px; }

  /* ---- timeline ---- */
   .proposal-page .timeline { display: grid; gap: 16px; grid-template-columns: 1fr; }
  @media (min-width: 768px) {  .proposal-page .timeline { grid-template-columns: repeat(2, 1fr); } }
   .proposal-page .week-card { border-radius: 1rem; border: 1px solid var(--border); background: var(--white-glass); box-shadow: var(--shadow-soft); padding: 22px; }
   .proposal-page .week-card .top { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
   .proposal-page .week-card .wk { font-size: 11px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: var(--brand); }
   .proposal-page .week-card h3 { font-size: 18px; font-weight: 700; margin-top: 8px; line-height: 1.3; }
   .proposal-page .week-card .hrs { flex-shrink: 0; border-radius: 999px; background: var(--ink); color: #fff; padding: 6px 12px; font-size: 11px; font-weight: 800; }
   .proposal-page .status-tag { display: inline-block; margin-top: 8px; border-radius: 999px; padding: 3px 10px; font-size: 10.5px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }
   .proposal-page .status-tag.done { background: rgba(16,163,74,.12); color: #0d8a3f; }
   .proposal-page .status-tag.progress { background: rgba(80,187,127,.14); color: var(--brand-dark); }
   .proposal-page .status-tag.planned { background: rgba(17,24,39,.08); color: var(--muted); }

  /* ---- pricing ---- */
   .proposal-page .pricing-grid { display: grid; gap: 18px; grid-template-columns: 1fr; }
  @media (min-width: 1024px) {  .proposal-page .pricing-grid { grid-template-columns: 1.2fr .8fr; } }
   .proposal-page .pricing-list { display: flex; flex-direction: column; gap: 10px; margin-top: 20px; }
   .proposal-page .pricing-row { display: flex; align-items: center; justify-content: space-between; gap: 14px; border-radius: 1rem; background: rgba(255,255,255,.5); padding: 16px 18px; }
   .proposal-page .pricing-row .p { font-size: 14.5px; font-weight: 600; color: rgba(17,24,39,.7); }
   .proposal-page .pricing-row .a { font-size: 14.5px; font-weight: 800; white-space: nowrap; }
   .proposal-page .total-card { border-radius: 1rem; background: var(--ink); color: #fff; padding: 26px; box-shadow: var(--shadow-glass); }
   .proposal-page .total-card .lbl { font-size: 13px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--brand-light); }
   .proposal-page .total-card .num { font-size: clamp(2.2rem,5vw,3rem); font-weight: 700; letter-spacing: -.01em; margin-top: 16px; }
   .proposal-page .total-card .lines { margin-top: 22px; display: flex; flex-direction: column; gap: 11px; font-size: 14px; line-height: 1.5; color: rgba(255,255,255,.8); }

  /* ---- signature ---- */
   .proposal-page .sig-grid { display: grid; gap: 18px; grid-template-columns: 1fr; }
  @media (min-width: 768px) {  .proposal-page .sig-grid { grid-template-columns: repeat(2, 1fr); } }
   .proposal-page .sig-card { border-radius: 1rem; border: 1px solid var(--border); background: var(--white-glass); box-shadow: var(--shadow-soft); padding: 30px; }
   .proposal-page .sig-card h3 { font-size: 18px; font-weight: 700; }
   .proposal-page .sig-lines { margin-top: 34px; display: flex; flex-direction: column; gap: 28px; font-size: 13px; color: rgba(17,24,39,.55); }
   .proposal-page .sig-lines div { border-bottom: 1px solid var(--border); padding-bottom: 8px; }

   .proposal-page footer { padding-block: 40px; text-align: center; font-size: 13px; color: rgba(17,24,39,.45); }

  /* ---- print ---- */
  @media print {
     .proposal-page .no-print { display: none !important; }
     .proposal-page { background: #fff !important; color: #111 !important; font-size: 9.5pt !important; }
     .proposal-page .card, .proposal-page .flow, .proposal-page .table-wrap, .proposal-page .module-table, .proposal-page .week-card, .proposal-page .sig-card, .proposal-page .callout.card-style { box-shadow: none !important; }
     .proposal-page .section { break-inside: auto; padding-block: 10mm !important; }
     .proposal-page .hero { box-shadow: none !important; }
  }
`;

const PROPOSAL_HTML = `

<div class="topbar no-print">
  <div class="topbar-inner">
    <a href="#top" class="topbar-brand">LoadMastr — Engagement Plan</a>
    <nav class="toc" id="toc">
      <a href="#summary">Summary</a>
      <a href="#product">Product</a>
      <a href="#ecosystem">Ecosystem</a>
      <a href="#architecture">Architecture</a>
      <a href="#flows">Flows</a>
      <a href="#screens">Screens</a>
      <a href="#redesign">Redesign</a>
      <a href="#system">System</a>
      <a href="#timeline">Timeline</a>
      <a href="#commercials">Commercials</a>
      <a href="#addendum">Addendum</a>
      <a href="#shadcn">Shadcn</a>
      <a href="#acceptance">Acceptance</a>
    </nav>
    <button class="btn-print" id="printBtn" type="button">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
      Print / Save PDF
    </button>
  </div>
</div>

<div id="top" class="wrap" style="padding-block:24px 8px;">

  <header class="hero">
    <div class="hero-top">
      <div style="max-width:46rem;">
        <span class="hero-badge">Product Design &amp; Engineering Engagement</span>
        <p class="kicker">/ Prepared for LoadMastr / September 2026</p>
        <h1 class="title">LoadMastr <span class="accent">V2</span></h1>
        <p class="lede">Trucking Marketplace — Design System, Three-Portal Build &amp; Home/Payments Redesign</p>
        <p class="lede-body">This plan covers the LoadMastr V2 engagement end to end: a Uganda-focused trucking marketplace connecting customers who need a truck with verified drivers, plus the admin console that runs it. It documents what has already been delivered, what the recent home-screen and payments redesign changed, and the remaining timeline and cost to take the product from working prototype to production launch.</p>
      </div>
      <div class="stat-col">
        <div class="stat-card">
          <p class="stat-label">Core engagement value</p>
          <p class="stat-value">UGX 7,300,000</p>
          <p class="stat-desc">Design system, 3-portal build, interactive prototype &amp; admin expansion</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Duration</p>
          <p class="stat-value">11 weeks</p>
          <p class="stat-desc">~23 hours per week</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Status</p>
          <p class="stat-value">Weeks 1–4 delivered</p>
          <p class="stat-desc">Week 5 in progress; Weeks 6–11 newly scoped (Sections 27–28)</p>
        </div>
      </div>
    </div>

    <div class="chip-row">
      <span class="chip">Product Discovery</span>
      <span class="chip">Design System</span>
      <span class="chip">Customer App</span>
      <span class="chip">Driver App</span>
      <span class="chip">Admin Portal</span>
      <span class="chip">Interactive Prototype</span>
      <span class="chip">Payments UI/UX</span>
      <span class="chip">Admin Roles &amp; Audit Trail</span>
      <span class="chip">Driver Tracking</span>
      <span class="chip">Shadcn/ui Migration</span>
    </div>

    <div class="meta-grid">
      <p><span class="meta-label">Prepared by</span><strong>Ignatius Musaazi</strong><br>Senior Product Designer / Product Design Strategist</p>
      <p><span class="meta-label">Prepared for</span><strong>LoadMastr</strong></p>
      <p><span class="meta-label">Document</span><strong>Engagement Plan &amp; Investment Summary</strong></p>
      <p><span class="meta-label">Format</span><strong>Browser, URL and PDF ready</strong></p>
    </div>
  </header>

  <!-- 01 -->
  <section class="section" id="summary">
    <div class="section-head">
      <div>
        <p class="section-kicker">/ Section 01</p>
        <h2 class="section-title">Executive Summary</h2>
      </div>
      <span class="ghost-num">01</span>
    </div>
    <div class="grid cols-2" style="grid-template-columns:1.1fr .9fr;">
      <div class="card">
        <p class="desc" style="font-size:16px;line-height:1.7;color:rgba(17,24,39,.75);margin-top:0;">LoadMastr V2 is a trucking and logistics marketplace for Uganda: customers request a truck or get matched with a nearby driver, drivers accept and fulfil the trip, and an admin console runs verification, trips, transactions and revenue across the platform.</p>
        <p class="desc">This engagement built the product from a locked design brief through to a working, interactively demoable prototype — a full design system, three complete portals (Customer, Driver, Admin), a real backend with persisted accounts and trips, and a full payments layer. It then carried out a deliberate redesign of the Customer home screen and payment experience based on direct product feedback.</p>
        <p class="callout" style="margin-top:20px;">This plan does not cover production infrastructure — live payment gateway contracts, real GPS/maps integration, hosting or native mobile apps. Those are scoped as an optional next phase in Section 25.</p>
      </div>
      <div class="grid" style="grid-template-columns:1fr;gap:14px;">
        <div class="card">
          <h3>Reduce Launch Risk</h3>
          <p class="desc">Every flow, edge case and screen state was resolved and clicked through in a working prototype before a single line of production infrastructure is committed to.</p>
        </div>
        <div class="card">
          <h3>Prove the Marketplace Loop</h3>
          <p class="desc">Customer request → driver accept → live tracking → completion → payment runs end to end against a real backend, not static mockups.</p>
        </div>
        <div class="card">
          <h3>Redesign From Real Feedback</h3>
          <p class="desc">The home screen and payments experience were rebuilt once real usage surfaced what the first pass got wrong — documented in Section 18.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- 02 -->
  <section class="section" id="product">
    <div class="section-head">
      <div><p class="section-kicker">/ Section 02</p><h2 class="section-title">Understanding The Product</h2></div>
      <span class="ghost-num">02</span>
    </div>
    <div class="grid cols-2" style="grid-template-columns:.9fr 1.1fr;">
      <div class="card">
        <h3>LoadMastr spans three coordinated surfaces</h3>
        <ul class="bullets mt">
          <li>Customer app — request a truck, track it live, pay</li>
          <li>Driver app — register, get verified, accept trips, earn</li>
          <li>Admin portal — approve drivers, monitor trips and revenue</li>
          <li>Five-tier truck taxonomy — Small to Extra Large</li>
          <li>Wallet-based payments — deposit, withdraw, pay per trip</li>
          <li>Real-time trip tracking (simulated GPS, real trip state)</li>
        </ul>
      </div>
      <div class="card">
        <p class="desc" style="margin-top:0;">The product has to serve both sides of a two-sided marketplace at once. A customer needs a fast, trustworthy way to book a truck and know what it costs before committing. A driver needs a reliable stream of trip requests and a clear, honest earnings picture. An admin needs to approve real drivers, watch real trips, and reconcile real money — none of it can be faked once the business is live.</p>
        <div class="grid cols-2" style="margin-top:20px;">
          <div class="mini-stat"><p class="l">Customer</p><p class="v" style="font-size:20px;">Requests &amp; pays</p></div>
          <div class="mini-stat"><p class="l">Driver</p><p class="v" style="font-size:20px;">Fulfils &amp; earns</p></div>
          <div class="mini-stat"><p class="l">Admin</p><p class="v" style="font-size:20px;">Approves &amp; monitors</p></div>
          <div class="mini-stat"><p class="l">Backend</p><p class="v" style="font-size:20px;">Keeps it real</p></div>
        </div>
      </div>
    </div>
  </section>

  <!-- 03 -->
  <section class="section">
    <div class="section-head">
      <div><p class="section-kicker">/ Section 03</p><h2 class="section-title">Product Vision</h2></div>
      <span class="ghost-num">03</span>
    </div>
    <div class="callout dark">
      <p class="big">LoadMastr should feel like a serious, dependable transportation product for Uganda — not a generic delivery app wearing a trucking skin.</p>
    </div>
    <div class="flow" style="margin-top:20px;">
      <h3>Trip Lifecycle</h3>
      <div class="flow-steps">
        <div class="flow-step"><span class="n">01</span><p>Request</p><svg class="flow-arrow" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M5 12h14M13 6l6 6-6 6"/></svg></div>
        <div class="flow-step"><span class="n">02</span><p>Match / Accept</p><svg class="flow-arrow" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M5 12h14M13 6l6 6-6 6"/></svg></div>
        <div class="flow-step"><span class="n">03</span><p>Track Live</p><svg class="flow-arrow" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M5 12h14M13 6l6 6-6 6"/></svg></div>
        <div class="flow-step"><span class="n">04</span><p>Complete &amp; Pay</p></div>
      </div>
    </div>
  </section>

  <!-- 04 -->
  <section class="section">
    <div class="section-head">
      <div><p class="section-kicker">/ Section 04</p><h2 class="section-title">Business Objectives</h2></div>
      <span class="ghost-num">04</span>
    </div>
    <div class="grid cols-3">
      <div class="card"><h3>Move Real Cargo</h3><p class="desc">Let customers book the right truck size for general goods, shifting, construction materials, agriculture and furniture — with fares shown upfront.</p></div>
      <div class="card"><h3>Build a Verified Driver Fleet</h3><p class="desc">Registration, document upload and admin approval keep unverified drivers off the road and out of the earnings loop.</p></div>
      <div class="card"><h3>Own the Payment Loop</h3><p class="desc">Wallet balance, deposits, withdrawals and per-trip payment across Mobile Money, card and bank — not a cash-only side business.</p></div>
      <div class="card"><h3>Give Admin Real Control</h3><p class="desc">Approve or reject drivers, watch trips and revenue, issue refunds — from one operations console, not a spreadsheet.</p></div>
      <div class="card"><h3>Launch Lean</h3><p class="desc">Ship the marketplace loop first; native apps, live GPS and a production payment gateway are a deliberate next phase, not day one.</p></div>
    </div>
  </section>

  <!-- 05 -->
  <section class="section" id="ecosystem">
    <div class="section-head">
      <div><p class="section-kicker">/ Section 05</p><h2 class="section-title">Product Ecosystem</h2></div>
      <span class="ghost-num">05</span>
    </div>
    <div class="card" style="padding:28px;">
      <div class="grid cols-3" style="align-items:stretch;">
        <div class="card" style="box-shadow:none;background:rgba(255,255,255,.5);">
          <span class="stat-label" style="color:var(--brand);">System 1</span>
          <h3 style="margin-top:10px;">Customer App</h3>
          <ul class="bullets mt"><li>Request</li><li>Track</li><li>Pay</li><li>Wallet</li><li>History</li></ul>
        </div>
        <div class="card" style="box-shadow:none;background:rgba(255,255,255,.5);">
          <span class="stat-label" style="color:var(--brand);">System 2</span>
          <h3 style="margin-top:10px;">Driver App</h3>
          <ul class="bullets mt"><li>Register</li><li>Get Verified</li><li>Accept Trips</li><li>Earn</li><li>Withdraw</li></ul>
        </div>
        <div class="card" style="box-shadow:none;background:rgba(255,255,255,.5);">
          <span class="stat-label" style="color:var(--brand);">System 3</span>
          <h3 style="margin-top:10px;">Admin Portal</h3>
          <ul class="bullets mt"><li>Approve Drivers</li><li>Monitor Trips</li><li>Track Revenue</li><li>Issue Refunds</li></ul>
        </div>
      </div>
      <div style="margin-top:18px;border-radius:1rem;background:var(--ink);padding:20px;">
        <p style="font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--brand-light);">External Services (Next Phase)</p>
        <div class="chip-row" style="margin-top:12px;">
          <span class="chip" style="background:rgba(255,255,255,.1);border-color:transparent;color:#fff;">Flutterwave / Mobile Money</span>
          <span class="chip" style="background:rgba(255,255,255,.1);border-color:transparent;color:#fff;">Live Maps &amp; GPS</span>
          <span class="chip" style="background:rgba(255,255,255,.1);border-color:transparent;color:#fff;">SMS</span>
          <span class="chip" style="background:rgba(255,255,255,.1);border-color:transparent;color:#fff;">Push Notifications</span>
        </div>
      </div>
      <p class="desc" style="margin-top:18px;">A trip placed on the Customer app has to appear on the Driver app, update the Admin portal, and generate a real transaction — all from one shared backend, not three disconnected surfaces.</p>
    </div>
  </section>

  <!-- 06 -->
  <section class="section">
    <div class="section-head">
      <div><p class="section-kicker">/ Section 06</p><h2 class="section-title">User Types and Actor Map</h2></div>
      <span class="ghost-num">06</span>
    </div>
    <div class="grid cols-3">
      <div class="card"><h3>Customer</h3><ul class="bullets mt"><li>Signs up</li><li>Requests a truck</li><li>Tracks the trip</li><li>Pays</li><li>Deposits / withdraws</li><li>Reviews history</li></ul></div>
      <div class="card"><h3>Driver</h3><ul class="bullets mt"><li>Registers vehicle</li><li>Uploads documents</li><li>Waits for approval</li><li>Goes online</li><li>Accepts &amp; runs trips</li><li>Earns &amp; withdraws</li></ul></div>
      <div class="card"><h3>Admin</h3><ul class="bullets mt"><li>Reviews submissions</li><li>Approves / rejects drivers</li><li>Monitors trips live</li><li>Tracks revenue</li><li>Issues refunds</li><li>Runs reports</li></ul></div>
    </div>
    <p class="callout" style="margin-top:18px;">Approval is real, not cosmetic: a driver stays locked out of trip requests until an admin genuinely approves their submitted documents — verified against the persisted backend, not a demo shortcut.</p>
  </section>

  <!-- 07 -->
  <section class="section">
    <div class="section-head">
      <div><p class="section-kicker">/ Section 07</p><h2 class="section-title">Build Phases &amp; Prioritisation</h2></div>
      <span class="ghost-num">07</span>
    </div>
    <div class="table-wrap" style="margin-bottom:18px;">
      <table class="matrix">
        <thead><tr><th>Phase</th><th>Scope</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td>Phase 1</td><td>Discovery, design tokens &amp; 52-component library</td><td>Delivered</td></tr>
          <tr><td>Phase 2</td><td>Customer app — 29 screens</td><td>Delivered</td></tr>
          <tr><td>Phase 3</td><td>Driver app — 19 screens</td><td>Delivered</td></tr>
          <tr><td>Phase 4</td><td>Admin portal — 10 screens &amp; interactive prototype wiring</td><td>Delivered</td></tr>
          <tr><td>Phase 5</td><td>Home &amp; payments redesign, design QA, responsive polish and handoff documentation</td><td>In progress</td></tr>
          <tr><td>Phase 6</td><td>Shadcn/ui foundation — 52-component library re-platformed on Radix UI</td><td>Planned</td></tr>
          <tr><td>Phase 7</td><td>Customer &amp; Driver App migration to shadcn/ui</td><td>Planned</td></tr>
          <tr><td>Phase 8</td><td>Admin Portal migration to shadcn/ui &amp; full regression pass</td><td>Planned</td></tr>
          <tr><td>Phase 9</td><td>Admin accounts, roles, OTP-based first login &amp; full audit trail (17 screens)</td><td>Planned</td></tr>
          <tr><td>Phase 10</td><td>Driver tracking map &amp; online drivers list</td><td>Planned</td></tr>
          <tr><td>Phase 11</td><td>Payments portal, driver referrals &amp; customer cashbacks</td><td>Planned</td></tr>
        </tbody>
      </table>
    </div>
    <p class="desc">Outside this engagement: live payment gateway contracts, real GPS/maps integration, native mobile apps and production hosting — scoped separately in Section 25 once the prototype has proven the product.</p>
  </section>

  <!-- 08 -->
  <section class="section" id="architecture">
    <div class="section-head">
      <div><p class="section-kicker">/ Section 08</p><h2 class="section-title">Platform Architecture</h2></div>
      <span class="ghost-num">08</span>
    </div>
    <div class="card" style="padding:26px;">
      <div style="display:flex;flex-direction:column;gap:20px;">
        <div class="card" style="box-shadow:none;background:rgba(255,255,255,.5);display:flex;flex-direction:column;gap:6px;">
          <span class="stat-label" style="color:var(--brand);">Layer 01</span>
          <h3>Client Layer</h3>
          <p class="desc" style="margin-top:2px;">React 19 + Vite, Tailwind CSS</p>
          <ul class="bullets cols2 mt">
            <li>Customer, Driver &amp; Admin single-page apps</li>
            <li>52-component shared design system</li>
            <li>Client-side session &amp; polling-based live state</li>
            <li>Responsive from 375px mobile to desktop admin</li>
          </ul>
        </div>
        <div class="card" style="box-shadow:none;background:rgba(255,255,255,.5);display:flex;flex-direction:column;gap:6px;">
          <span class="stat-label" style="color:var(--brand);">Layer 02</span>
          <h3>API Layer</h3>
          <p class="desc" style="margin-top:2px;">Node.js, Express</p>
          <ul class="bullets cols2 mt">
            <li>REST endpoints for auth, trips, drivers, payments</li>
            <li>Hashed-password authentication (scrypt)</li>
            <li>Trip lifecycle &amp; state-machine logic</li>
            <li>Admin approval &amp; refund endpoints</li>
          </ul>
        </div>
        <div class="card" style="box-shadow:none;background:rgba(255,255,255,.5);display:flex;flex-direction:column;gap:6px;">
          <span class="stat-label" style="color:var(--brand);">Layer 03</span>
          <h3>Data Layer</h3>
          <p class="desc" style="margin-top:2px;">SQLite (prototype) → PostgreSQL (production)</p>
          <ul class="bullets cols2 mt">
            <li>Users, drivers, trips, transactions, documents</li>
            <li>Every account, approval and payment genuinely persists</li>
            <li>Production migration path already identified</li>
          </ul>
        </div>
        <div class="card" style="box-shadow:none;background:rgba(255,255,255,.5);display:flex;flex-direction:column;gap:6px;">
          <span class="stat-label" style="color:var(--brand);">Layer 04</span>
          <h3>External Integrations — Next Phase</h3>
          <p class="desc" style="margin-top:2px;">Not yet wired</p>
          <ul class="bullets cols2 mt">
            <li>Flutterwave / MTN / Airtel live payment rails</li>
            <li>Live maps &amp; GPS tracking</li>
            <li>SMS &amp; push notification delivery</li>
          </ul>
        </div>
      </div>
      <p class="desc" style="margin-top:18px;text-align:center;">Money movement is currently simulated — no real payment gateway is wired — but every deposit, withdrawal and trip payment creates a real, persisted transaction row and a real wallet-balance change.</p>
    </div>
  </section>

  <!-- 09-11 -->
  <section class="section">
    <div class="section-head"><div><p class="section-kicker">/ Section 09</p><h2 class="section-title">Customer App Architecture</h2></div><span class="ghost-num">09</span></div>
    <div class="grid cols-4">
      <div class="card"><h3>Home</h3><p class="desc">Wallet balance, deposit/withdraw, service tabs, recent destinations.</p></div>
      <div class="card"><h3>Trips</h3><p class="desc">Active and past trips, receipts, driver details.</p></div>
      <div class="card"><h3>Wallet</h3><p class="desc">Balance, payment methods, deposit, withdraw, transaction history.</p></div>
      <div class="card"><h3>Profile</h3><p class="desc">Account details, settings, help &amp; support, account deletion.</p></div>
    </div>
  </section>

  <section class="section">
    <div class="section-head"><div><p class="section-kicker">/ Section 10</p><h2 class="section-title">Driver App Architecture</h2></div><span class="ghost-num">10</span></div>
    <div class="grid cols-4">
      <div class="card"><h3>Home</h3><p class="desc">Verification status, go online/offline, today's trips &amp; earnings.</p></div>
      <div class="card"><h3>Trips</h3><p class="desc">Incoming requests, active trip, history and per-trip earnings.</p></div>
      <div class="card"><h3>Wallet</h3><p class="desc">Earnings, cash-due tracker, withdrawals, payout method.</p></div>
      <div class="card"><h3>More</h3><p class="desc">Profile, vehicle details, payout method, support.</p></div>
    </div>
  </section>

  <section class="section">
    <div class="section-head"><div><p class="section-kicker">/ Section 11</p><h2 class="section-title">Admin Portal Architecture</h2></div><span class="ghost-num">11</span></div>
    <div class="grid cols-4">
      <div class="card"><h3>Dashboard</h3><p class="desc">Trips, revenue, active drivers and customers at a glance, with real charts.</p></div>
      <div class="card"><h3>Drivers &amp; Customers</h3><p class="desc">Full account lists, detail views, document review, approve / reject.</p></div>
      <div class="card"><h3>Trips &amp; Transactions</h3><p class="desc">Every trip and payment, filterable, with refund actions.</p></div>
      <div class="card"><h3>Reports &amp; Settings</h3><p class="desc">Truck-tier distribution, driver verification breakdown, team access.</p></div>
    </div>
  </section>

  <!-- 12 End to end flow -->
  <section class="section" id="flows">
    <div class="section-head"><div><p class="section-kicker">/ Section 12</p><h2 class="section-title">End-to-End Trip Flow</h2></div><span class="ghost-num">12</span></div>
    <div class="flow">
      <h3>Customer Request → Driver Fulfilment</h3>
      <div class="flow-steps" style="grid-template-columns:repeat(2,1fr);">
        <div class="flow-step"><span class="n">01</span><p>Customer requests a truck</p></div>
        <div class="flow-step"><span class="n">02</span><p>Online driver sees the real request</p></div>
        <div class="flow-step"><span class="n">03</span><p>Driver accepts</p></div>
        <div class="flow-step"><span class="n">04</span><p>Customer sees driver assigned live</p></div>
        <div class="flow-step"><span class="n">05</span><p>Driver drives phases: pickup → in transit → arrived</p></div>
        <div class="flow-step"><span class="n">06</span><p>Customer tracking updates in step, live</p></div>
        <div class="flow-step"><span class="n">07</span><p>Driver completes &amp; rates the trip</p></div>
        <div class="flow-step"><span class="n">08</span><p>Real debit + credit transactions post to both wallets</p></div>
      </div>
    </div>
    <div class="table-wrap" style="margin-top:18px;">
      <table class="matrix">
        <thead><tr><th>Step</th><th>Customer View</th><th>Driver View</th><th>Admin View</th></tr></thead>
        <tbody>
          <tr><td>Request</td><td>Searching for drivers</td><td>Not yet involved</td><td>New trip record</td></tr>
          <tr><td>Accept</td><td>Driver assigned, live map</td><td>Active trip screen</td><td>Trip status updated</td></tr>
          <tr><td>In transit</td><td>Live tracking states</td><td>Phase-by-phase actions</td><td>Trip visible in list</td></tr>
          <tr><td>Complete</td><td>Receipt available</td><td>Rating &amp; earnings credited</td><td>Transaction recorded</td></tr>
        </tbody>
      </table>
    </div>
  </section>

  <!-- 13 driver onboarding -->
  <section class="section">
    <div class="section-head"><div><p class="section-kicker">/ Section 13</p><h2 class="section-title">Driver Onboarding &amp; Admin Verification</h2></div><span class="ghost-num">13</span></div>
    <div class="flow">
      <h3>Registration to Approval</h3>
      <div class="flow-steps">
        <div class="flow-step"><span class="n">01</span><p>Vehicle details</p><svg class="flow-arrow" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M5 12h14M13 6l6 6-6 6"/></svg></div>
        <div class="flow-step"><span class="n">02</span><p>Document upload</p><svg class="flow-arrow" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M5 12h14M13 6l6 6-6 6"/></svg></div>
        <div class="flow-step"><span class="n">03</span><p>Submitted — pending review</p><svg class="flow-arrow" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M5 12h14M13 6l6 6-6 6"/></svg></div>
        <div class="flow-step"><span class="n">04</span><p>Admin approves or rejects</p></div>
      </div>
      <div class="flow-branches"><p class="lbl">What makes this real</p><ul class="bullets mt"><li>The driver dashboard genuinely stays locked until admin approves — no dev shortcut left in the product</li><li>Approval updates the driver's own screen automatically, without a refresh</li></ul></div>
    </div>
  </section>

  <!-- 14 payments -->
  <section class="section">
    <div class="section-head"><div><p class="section-kicker">/ Section 14</p><h2 class="section-title">Payment Architecture</h2></div><span class="ghost-num">14</span></div>
    <div class="grid cols-3">
      <div class="card"><h3>Supported Methods</h3><ul class="bullets mt"><li>MTN Mobile Money</li><li>Airtel Money</li><li>Visa / Mastercard</li><li>Bank transfer (5 Ugandan banks)</li><li>LoadMastr wallet</li></ul></div>
      <div class="card"><h3>Wallet Actions</h3><ul class="bullets mt"><li>Deposit — quick amounts or custom</li><li>Withdraw — Mobile Money or bank only</li><li>Pay per trip — wallet or on-file method</li><li>Every action is a real, persisted transaction</li></ul></div>
      <div class="card"><h3>Admin Controls</h3><ul class="bullets mt"><li>Full transaction ledger</li><li>Filter by status</li><li>Issue refunds</li><li>Real-time revenue on the dashboard</li></ul></div>
    </div>
    <div class="flow" style="margin-top:18px;">
      <h3>Trip Payment Flow</h3>
      <div class="flow-steps" style="grid-template-columns:repeat(3,1fr);">
        <div class="flow-step"><span class="n">01</span><p>Driver marks trip complete</p></div>
        <div class="flow-step"><span class="n">02</span><p>Server posts driver credit + customer debit atomically</p></div>
        <div class="flow-step"><span class="n">03</span><p>Both wallets and admin ledger update immediately</p></div>
      </div>
    </div>
  </section>

  <!-- 15 IA -->
  <section class="section">
    <div class="section-head"><div><p class="section-kicker">/ Section 15</p><h2 class="section-title">Information Architecture</h2></div><span class="ghost-num">15</span></div>
    <div class="grid cols-3">
      <div class="card"><h3>Customer Platform</h3><ul class="bullets mt"><li>Home: wallet, services, recent, refer &amp; earn</li><li>Request: truck size, fare, payment, tracking</li><li>Trips: history &amp; receipts</li><li>Wallet: balance, methods, transactions</li><li>Profile: account, settings, support</li></ul></div>
      <div class="card"><h3>Driver App</h3><ul class="bullets mt"><li>Registration: vehicle, documents, review</li><li>Home: status, online toggle, today's activity</li><li>Trips: requests, active trip, history</li><li>Wallet: earnings, cash due, withdraw</li><li>More: profile, vehicle, support</li></ul></div>
      <div class="card"><h3>Admin Portal</h3><ul class="bullets mt"><li>Dashboard: metrics &amp; charts</li><li>Drivers / Customers: lists &amp; detail</li><li>Trips / Transactions: full ledger</li><li>Reports: tier &amp; verification breakdown</li><li>Settings: team access</li></ul></div>
    </div>
  </section>

  <!-- 16 screens -->
  <section class="section" id="screens">
    <div class="section-head"><div><p class="section-kicker">/ Section 16</p><h2 class="section-title">Delivered Screen Inventory</h2></div><span class="ghost-num">16</span></div>
    <p class="desc" style="max-width:44rem;font-size:16px;line-height:1.7;margin-bottom:20px;">These are real, built screens — not estimates. Shared authentication (sign up, log in, forgot password, delete account) is counted once, inside the Customer total, and reused by the Driver app.</p>
    <div class="grid cols-3">
      <div class="module-table">
        <div class="mt-head">Customer App</div>
        <table>
          <tbody>
            <tr><td>Authentication</td><td>6</td></tr>
            <tr><td>Home &amp; request flow</td><td>9</td></tr>
            <tr><td>Tracking &amp; history</td><td>3</td></tr>
            <tr><td>Wallet &amp; payments</td><td>7</td></tr>
            <tr><td>Profile &amp; support</td><td>4</td></tr>
            <tr class="total"><td>Subtotal</td><td>29</td></tr>
          </tbody>
        </table>
      </div>
      <div class="module-table">
        <div class="mt-head">Driver App</div>
        <table>
          <tbody>
            <tr><td>Registration &amp; verification</td><td>3</td></tr>
            <tr><td>Dashboard &amp; trip flow</td><td>5</td></tr>
            <tr><td>Trip history &amp; detail</td><td>2</td></tr>
            <tr><td>Earnings &amp; payments</td><td>5</td></tr>
            <tr><td>Account &amp; support</td><td>4</td></tr>
            <tr class="total"><td>Subtotal</td><td>19</td></tr>
          </tbody>
        </table>
      </div>
      <div class="module-table">
        <div class="mt-head">Admin Portal</div>
        <table>
          <tbody>
            <tr><td>Dashboard</td><td>1</td></tr>
            <tr><td>Drivers (list + detail)</td><td>2</td></tr>
            <tr><td>Customers (list + detail)</td><td>2</td></tr>
            <tr><td>Trips &amp; transactions</td><td>3</td></tr>
            <tr><td>Reports &amp; settings</td><td>2</td></tr>
            <tr class="total"><td>Subtotal</td><td>10</td></tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="big-stat-block" style="margin-top:18px;">
      <p class="lbl">Total delivered screens</p>
      <p class="num">58</p>
      <p>Built on a shared library of 52 reusable components — buttons, forms, cards, navigation, logistics and payment components — across 8 foundational families, so new screens are assembled from proven parts, not built from scratch each time.</p>
    </div>
  </section>

  <!-- 17 responsive -->
  <section class="section">
    <div class="section-head"><div><p class="section-kicker">/ Section 17</p><h2 class="section-title">Responsive Strategy</h2></div><span class="ghost-num">17</span></div>
    <div class="card">
      <p class="desc" style="margin-top:0;font-size:16px;line-height:1.7;">Customer and Driver are mobile-first — the whole experience is designed inside a phone-width frame. The Admin portal is desktop-first and intentionally denser, using a smaller default type scale suited to an operations console rather than a consumer app.</p>
      <div class="grid cols-4" style="margin-top:20px;">
        <div class="mini-stat"><p class="l">Mobile</p><p class="v" style="font-size:18px;">375–430px</p></div>
        <div class="mini-stat"><p class="l">Tablet</p><p class="v" style="font-size:18px;">768–1024px</p></div>
        <div class="mini-stat"><p class="l">Admin desktop</p><p class="v" style="font-size:18px;">1280px+</p></div>
        <div class="mini-stat"><p class="l">Native apps</p><p class="v" style="font-size:18px;">Next phase</p></div>
      </div>
    </div>
  </section>

  <!-- 24 Redesign — key section -->
  <section class="section" id="redesign">
    <div class="section-head"><div><p class="section-kicker">/ Section 18</p><h2 class="section-title">The Redesign — Home Screen &amp; Payments</h2></div><span class="ghost-num">18</span></div>
    <p class="desc" style="max-width:46rem;font-size:16px;line-height:1.7;margin-bottom:20px;">Once the marketplace loop was working end to end, the Customer home screen was rebuilt around what real usage showed actually mattered: money and services on hand, not a map guessing where you want to go.</p>
    <div class="grid cols-2">
      <div class="card" style="border-color:rgba(17,24,39,.18);">
        <span class="stat-label">Before</span>
        <h3 style="margin-top:10px;">Map-first home screen</h3>
        <ul class="bullets mt">
          <li>Large map preview as the dominant visual</li>
          <li>"Where do you need a truck?" search bar led the page</li>
          <li>No wallet balance visible from Home</li>
          <li>No deposit or withdraw action from Home</li>
          <li>Only Mobile Money as a payment option</li>
        </ul>
      </div>
      <div class="card" style="border-color:var(--brand);box-shadow:var(--shadow-glow);">
        <span class="stat-label" style="color:var(--brand);">After</span>
        <h3 style="margin-top:10px;">Wallet-first home screen</h3>
        <ul class="bullets mt">
          <li>Wallet balance is the first thing shown</li>
          <li>Deposit and Withdraw as primary actions</li>
          <li>Services presented as tabs — Send a Truck / Match Driver</li>
          <li>Map reserved for actual live trip tracking only</li>
          <li>Mobile Money, Card and Bank all supported</li>
        </ul>
      </div>
    </div>
    <p class="callout" style="margin-top:18px;">Withdrawals were also added for customers for the first time — previously only drivers could cash out. Cards are deliberately excluded as a withdrawal destination; only Mobile Money and bank accounts can receive a payout.</p>
  </section>

  <!-- 19 system -->
  <section class="section" id="system">
    <div class="section-head"><div><p class="section-kicker">/ Section 19</p><h2 class="section-title">Design System Scope</h2></div><span class="ghost-num">19</span></div>
    <div class="grid cols-2">
      <div class="card">
        <h3>Foundations</h3>
        <ul class="bullets mt"><li>Colour tokens (green primary, meaning-only accents)</li><li>Typography scale (h1–small)</li><li>4px-based spacing system</li><li>Radius scale (button, input, card, pill)</li><li>Elevation &amp; motion tokens</li></ul>
      </div>
      <div class="card">
        <h3>Component Families (52 total)</h3>
        <ul class="bullets cols2 mt"><li>Navigation (5)</li><li>Forms (9)</li><li>Actions (3)</li><li>Feedback (7)</li><li>Logistics (11)</li><li>Payments (6)</li><li>Identity (5)</li><li>Admin (6)</li></ul>
      </div>
    </div>
    <p class="desc" style="margin-top:18px;">Every screen is assembled from this shared library — a truck-tier card, a status badge or a payment method row looks and behaves identically everywhere it appears, in either app.</p>
    <p class="callout" style="margin-top:18px;">As of Section 28, this library is being re-platformed on shadcn/ui — Radix UI primitives plus class-variance-authority — reskinned to these exact tokens. Same 52 components, same 8 families, different foundation underneath.</p>
  </section>

  <!-- 20 prototype -->
  <section class="section">
    <div class="section-head"><div><p class="section-kicker">/ Section 20</p><h2 class="section-title">Interactive Prototype &amp; Live Demo</h2></div><span class="ghost-num">20</span></div>
    <div class="grid cols-2">
      <div class="card">
        <h3>What it actually does</h3>
        <ul class="bullets mt">
          <li>Real sign-up and login, not fixed demo personas</li>
          <li>Customer and Driver apps side by side on one page, each signed in separately</li>
          <li>A trip placed on one side appears live on the other — same backend, not a simulation trick</li>
          <li>Admin approval reflects on the driver's own screen automatically</li>
        </ul>
      </div>
      <div class="card">
        <h3>Why it matters</h3>
        <p class="desc" style="margin-top:0;">Most design engagements hand over static screens or a click-through mockup. This one hands over a working product with a real database behind it — every account, approval, trip and payment survives a page refresh because it's genuinely persisted, not held in memory.</p>
      </div>
    </div>
  </section>

  <!-- 21 timeline -->
  <section class="section" id="timeline">
    <div class="section-head"><div><p class="section-kicker">/ Section 21</p><h2 class="section-title">Timeline and Estimated Effort</h2></div><span class="ghost-num">21</span></div>
    <div class="mini-stats" style="margin-bottom:20px;">
      <div class="mini-stat" style="background:var(--ink);border-color:transparent;"><p class="l" style="color:rgba(255,255,255,.6);">Pace</p><p class="v" style="color:#fff;font-size:18px;">4 hrs/day</p></div>
      <div class="mini-stat" style="background:var(--ink);border-color:transparent;"><p class="l" style="color:rgba(255,255,255,.6);">Schedule</p><p class="v" style="color:#fff;font-size:18px;">6 days/week</p></div>
      <div class="mini-stat" style="background:var(--ink);border-color:transparent;"><p class="l" style="color:rgba(255,255,255,.6);">Duration</p><p class="v" style="color:#fff;font-size:18px;">11 weeks</p></div>
      <div class="mini-stat" style="background:var(--ink);border-color:transparent;"><p class="l" style="color:rgba(255,255,255,.6);">Total</p><p class="v" style="color:#fff;font-size:18px;">256 hours</p></div>
    </div>
    <div class="timeline">
      <article class="week-card"><div class="top"><div><p class="wk">Week 1</p><h3>Discovery, Tokens &amp; Component Library</h3><span class="status-tag done">Delivered</span></div><span class="hrs">24 hrs</span></div><ul class="bullets mt"><li>Locked design brief, colour/type/spacing/radius tokens</li><li>52 components across 8 families</li><li>Truck illustrations, 5-tier config, /style-guide gallery</li></ul></article>
      <article class="week-card"><div class="top"><div><p class="wk">Week 2</p><h3>Customer App</h3><span class="status-tag done">Delivered</span></div><span class="hrs">24 hrs</span></div><ul class="bullets mt"><li>29 high-fidelity screens</li><li>Request, tracking, wallet, profile</li></ul></article>
      <article class="week-card"><div class="top"><div><p class="wk">Week 3</p><h3>Driver App</h3><span class="status-tag done">Delivered</span></div><span class="hrs">24 hrs</span></div><ul class="bullets mt"><li>19 high-fidelity screens</li><li>Registration, dashboard, trip flow, earnings</li></ul></article>
      <article class="week-card"><div class="top"><div><p class="wk">Week 4</p><h3>Admin Portal &amp; Prototype Wiring</h3><span class="status-tag done">Delivered</span></div><span class="hrs">24 hrs</span></div><ul class="bullets mt"><li>10 operations-console screens</li><li>Approvals, trips, transactions, reports</li><li>Cross-app state &amp; live dual-app demo</li></ul></article>
      <article class="week-card"><div class="top"><div><p class="wk">Week 5</p><h3>Home &amp; Payments Redesign, Design QA &amp; Handoff</h3><span class="status-tag progress">In progress</span></div><span class="hrs">24 hrs</span></div><ul class="bullets mt"><li>Wallet-first home screen, service tabs, card &amp; bank support UI</li><li>Cross-device design QA &amp; responsive polish</li><li>Documentation &amp; handoff package</li></ul></article>
      <article class="week-card"><div class="top"><div><p class="wk">Week 6</p><h3>Shadcn/ui Foundation</h3><span class="status-tag planned">Planned</span></div><span class="hrs">24 hrs</span></div><ul class="bullets mt"><li>Radix UI + class-variance-authority setup</li><li>52-component library re-platformed, reskinned to LoadMastr tokens</li></ul></article>
      <article class="week-card"><div class="top"><div><p class="wk">Week 7</p><h3>Customer &amp; Driver App Migration</h3><span class="status-tag planned">Planned</span></div><span class="hrs">24 hrs</span></div><ul class="bullets mt"><li>48 screens migrated to consume the new component library</li><li>Visual &amp; functional regression pass</li></ul></article>
      <article class="week-card"><div class="top"><div><p class="wk">Week 8</p><h3>Admin Portal Migration &amp; Regression</h3><span class="status-tag planned">Planned</span></div><span class="hrs">24 hrs</span></div><ul class="bullets mt"><li>10 admin screens migrated to the new component library</li><li>Full cross-app regression pass against the real backend</li></ul></article>
      <article class="week-card"><div class="top"><div><p class="wk">Week 9</p><h3>Admin Accounts, Roles &amp; Audit Trail</h3><span class="status-tag planned">Planned</span></div><span class="hrs">24 hrs</span></div><ul class="bullets mt"><li>Universal login, first-login reset, OTP &amp; forgot-password flows</li><li>Create/edit/deactivate admin users, role assignment</li><li>Self-service profile, staff list &amp; global/per-user audit log</li></ul></article>
      <article class="week-card"><div class="top"><div><p class="wk">Week 10</p><h3>Driver Tracking</h3><span class="status-tag planned">Planned</span></div><span class="hrs">16 hrs</span></div><ul class="bullets mt"><li>Live map of online drivers (simulated positions)</li><li>Online drivers list — companion table view</li></ul></article>
      <article class="week-card"><div class="top"><div><p class="wk">Week 11</p><h3>Payments Portal, Referrals &amp; Cashbacks</h3><span class="status-tag planned">Planned</span></div><span class="hrs">24 hrs</span></div><ul class="bullets mt"><li>Payments overview, withdrawal approvals, payment method oversight</li><li>Driver referrals — bonus tracking &amp; payment status</li><li>Customer cashbacks — payment tracking &amp; mark-as-paid</li></ul></article>
    </div>
    <p class="callout" style="margin-top:18px;">Timeline depends on timely feedback and availability of stakeholders. Weeks 1–4 above are complete; Week 5 is the current focus; Weeks 6–8 are the shadcn/ui migration (Section 28) and Weeks 9–11 are the admin expansion (Section 27) — none of Weeks 6–11 have started. Weeks 9–11 are sequenced after the migration so they get built shadcn-native, with no separate migration cost of their own.</p>
  </section>

  <!-- 22 commercials -->
  <section class="section" id="commercials">
    <div class="section-head"><div><p class="section-kicker">/ Section 22</p><h2 class="section-title">Commercial Breakdown</h2></div><span class="ghost-num">22</span></div>
    <div class="pricing-grid">
      <div class="card">
        <h3>Phase Breakdown</h3>
        <div class="pricing-list">
          <div class="pricing-row"><span class="p">Discovery, Tokens &amp; Component Library</span><span class="a">UGX 550,000</span></div>
          <div class="pricing-row"><span class="p">Customer App — UI/UX &amp; Prototype</span><span class="a">UGX 800,000</span></div>
          <div class="pricing-row"><span class="p">Driver App — UI/UX &amp; Prototype</span><span class="a">UGX 700,000</span></div>
          <div class="pricing-row"><span class="p">Admin Portal &amp; Interactive Prototype Wiring</span><span class="a">UGX 650,000</span></div>
          <div class="pricing-row"><span class="p">Home &amp; Payments Redesign</span><span class="a">UGX 500,000</span></div>
          <div class="pricing-row"><span class="p">Shadcn/ui Foundation</span><span class="a">UGX 700,000</span></div>
          <div class="pricing-row"><span class="p">Customer &amp; Driver App Migration</span><span class="a">UGX 700,000</span></div>
          <div class="pricing-row"><span class="p">Admin Portal Migration &amp; Regression</span><span class="a">UGX 650,000</span></div>
          <div class="pricing-row"><span class="p">Admin Accounts, Roles &amp; Audit Trail</span><span class="a">UGX 900,000</span></div>
          <div class="pricing-row"><span class="p">Driver Tracking</span><span class="a">UGX 450,000</span></div>
          <div class="pricing-row"><span class="p">Payments Portal, Referrals &amp; Cashbacks</span><span class="a">UGX 700,000</span></div>
        </div>
      </div>
      <div class="total-card">
        <p class="lbl">Total Engagement Value</p>
        <p class="num">UGX 7,300,000</p>
        <div class="lines">
          <p><strong style="color:#fff;">256</strong> total estimated hours</p>
          <p><strong style="color:#fff;">~UGX 28,516</strong> effective hourly rate</p>
          <p><strong style="color:#fff;">~UGX 114,063</strong> effective daily rate at 4 hrs/day</p>
          <p><strong style="color:#fff;">~UGX 663,636</strong> effective weekly rate</p>
        </div>
      </div>
    </div>
    <p class="callout card-style" style="margin-top:18px;">This rate covers senior UI/UX design and interactive prototyping — not visual production alone. It includes discovery, structure, interaction decisions, a functional clickable prototype, and redesign iteration based on real usage. Backend/server engineering, payment processing and QA/test engineering are outside this scope — see Section 25.</p>
  </section>

  <!-- 23 payment schedule -->
  <section class="section">
    <div class="section-head"><div><p class="section-kicker">/ Section 23</p><h2 class="section-title">Payment Schedule</h2></div><span class="ghost-num">23</span></div>
    <div class="grid cols-3">
      <div class="card"><h3>Milestone 1</h3><p class="desc">Kickoff — Design Foundations &amp; Component Library<br><br><strong>20% — UGX 1,460,000</strong><br>Due at kickoff</p></div>
      <div class="card"><h3>Milestone 2</h3><p class="desc">Customer &amp; Driver App UI/UX Approved<br><br><strong>20% — UGX 1,460,000</strong><br>Due once both mobile apps are demoable</p></div>
      <div class="card"><h3>Milestone 3</h3><p class="desc">Shadcn/ui Migration Complete &amp; Regression-Verified<br><br><strong>25% — UGX 1,825,000</strong><br>Due once all existing screens are re-verified on the new foundation</p></div>
      <div class="card"><h3>Milestone 4</h3><p class="desc">Admin Portal — Roles/Audit, Tracking, Payments, Referrals &amp; Cashbacks Approved<br><br><strong>25% — UGX 1,825,000</strong><br>Due once all admin screens are demoable</p></div>
      <div class="card"><h3>Milestone 5</h3><p class="desc">Redesign, QA &amp; Final Handoff<br><br><strong>10% — UGX 730,000</strong><br>Due at documented handoff</p></div>
    </div>
  </section>

  <!-- 24 risks -->
  <section class="section">
    <div class="section-head"><div><p class="section-kicker">/ Section 24</p><h2 class="section-title">Risks, Assumptions and Dependencies</h2></div><span class="ghost-num">24</span></div>
    <div class="grid cols-3">
      <div class="card"><h3>Risks</h3><ul class="bullets mt"><li>Scope creep from evolving redesign requests</li><li>Concurrent edits when multiple contributors work the same codebase</li><li>Truck tonnage bands still unresolved against real backend rules</li><li>Payment provider not yet contractually confirmed</li></ul></div>
      <div class="card"><h3>Assumptions</h3><ul class="bullets mt"><li>Timely feedback from stakeholders</li><li>SQLite prototype is sufficient for demo; production needs a hosted database</li><li>Truck taxonomy will be confirmed before production</li><li>Payment provider decision confirmed during next phase</li></ul></div>
      <div class="card"><h3>Dependencies</h3><ul class="bullets mt"><li>Confirmed truck tonnage taxonomy</li><li>Payment provider merchant credentials</li><li>Hosting / infrastructure decision</li><li>Admin access-control requirements</li></ul></div>
    </div>
  </section>

  <!-- 25 exclusions -->
  <section class="section">
    <div class="section-head"><div><p class="section-kicker">/ Section 25</p><h2 class="section-title">Exclusions</h2></div><span class="ghost-num">25</span></div>
    <div class="card">
      <p style="font-size:14.5px;font-weight:700;color:rgba(17,24,39,.8);">The following are not included in the UGX 7,300,000 engagement unless separately scoped:</p>
      <ul class="bullets cols2 mt" style="columns:1;">
        <li>Backend / server engineering beyond the interactive prototype</li>
        <li>Live payment gateway integration &amp; merchant account</li>
        <li>Software QA / test engineering</li>
        <li>Real GPS / live maps tracking</li>
        <li>Native mobile apps (iOS / Android)</li>
        <li>Production hosting &amp; DevOps</li>
        <li>SMS / push notification infrastructure</li>
        <li>Load testing &amp; penetration testing</li>
        <li>Ongoing maintenance &amp; support post-handoff</li>
        <li>Legal documents (Terms, Privacy Policy)</li>
      </ul>
      <p class="desc" style="margin-top:14px;">This is a UI/UX design and interactive-prototyping engagement. Where the prototype needs functional-feeling data (accounts, trips, a wallet balance) to demonstrate a flow convincingly, that plumbing is built as part of the prototype itself — it is not delivered or billed as production backend engineering. The Driver Tracking screen added in Section 27 is the same kind of prototype: a map showing simulated positions for online drivers, not a live GPS feed — real GPS integration remains excluded above.</p>
    </div>
    <div class="grid cols-3" style="margin-top:14px;">
      <div class="card"><h3>Live Payment Integration</h3><p class="desc">UGX 1,500,000 – 2,500,000</p></div>
      <div class="card"><h3>Live Maps &amp; GPS</h3><p class="desc">UGX 1,000,000 – 1,800,000</p></div>
      <div class="card"><h3>Native Mobile Apps</h3><p class="desc">UGX 3,000,000 – 4,500,000</p></div>
    </div>
  </section>

  <!-- 26 recommendation -->
  <section class="section">
    <div class="section-head"><div><p class="section-kicker">/ Section 26</p><h2 class="section-title">Final Recommendation</h2></div><span class="ghost-num">26</span></div>
    <div class="callout dark">
      <p class="big">LoadMastr V2 should move from prototype to a limited pilot before committing to full production infrastructure.</p>
      <p class="sub">The marketplace loop — request, accept, track, complete, pay — already works end to end against a real backend. The next honest step is a small real-world pilot with a handful of drivers and customers on the current build, using it to validate demand and surface what production hardening actually needs to prioritise, before spending on live payment gateways, GPS and native apps.</p>
    </div>
    <p class="callout card-style" style="margin-top:18px;font-size:19px;font-weight:800;color:var(--ink);">Great products are not built from screens alone. They are built from working flows, real data, and decisions tested against how people actually use them.</p>
  </section>

  <!-- 27 addendum -->
  <section class="section" id="addendum">
    <div class="section-head"><div><p class="section-kicker">/ Section 27</p><h2 class="section-title">Scope Addendum — Driver Tracking, Payments Portal &amp; Admin Roles</h2></div><span class="ghost-num">27</span></div>
    <p class="desc" style="max-width:46rem;font-size:16px;line-height:1.7;margin-bottom:20px;">Added to scope on 18 September 2026, after the original three-portal build was reviewed, and extended on 20 September 2026 with screenshots of the real, currently-live LoadMaster admin system. This replaces the Admin Portal's current shared-credential login with individual admin accounts across five roles, adds a full audit trail, and adds new admin surfaces: live driver tracking, an online drivers list, a payments portal, driver referrals and customer cashbacks. The figures in Sections 21–23 above already include this addendum.</p>
    <div class="grid cols-3">
      <div class="card">
        <h3>Driver Tracking</h3>
        <p class="desc">A map showing the live location of currently-online drivers, plus a companion table view (Online Drivers) — simulated positions on the existing prototype map, the same pattern used everywhere else in the app. Real GPS integration stays excluded (Section 25).</p>
      </div>
      <div class="card">
        <h3>Payments Portal, Referrals &amp; Cashbacks</h3>
        <p class="desc">Deposits, withdrawals and payment methods platform-wide, plus two new ledgers seen in the real system: driver referral bonuses and customer cashbacks, each with their own paid/pending tracking. Screen breakdown below reflects what the reference screenshots actually show.</p>
      </div>
      <div class="card">
        <h3>Admin Roles &amp; Audit Trail</h3>
        <p class="desc">Individual logins replacing shared credentials, an OTP-based first-login flow, and a full audit trail of admin actions with before/after diffs — five roles: Super Admin, Admin, Team Lead, Field Agent, Customer Care. Full permission matrix received 20 September 2026 and incorporated below.</p>
      </div>
    </div>

    <h3 style="margin-top:28px;">Driver Referrals &amp; Customer Cashbacks — field reference</h3>
    <p class="desc" style="margin-top:10px;">Neither concept exists in the current schema — both need a real ledger table, not just a screen. Fields below are transcribed from the live reference system's screenshots, not invented.</p>
    <div class="grid cols-2" style="margin-top:14px;">
      <div class="module-table">
        <div class="mt-head">Driver Referrals — fields</div>
        <table>
          <tbody>
            <tr><td>Driver Name</td><td>text</td></tr>
            <tr><td>Customer Name (who they referred)</td><td>text</td></tr>
            <tr><td>Referral Code</td><td>text</td></tr>
            <tr><td>First Trip ID</td><td>link</td></tr>
            <tr><td>Trip Cost</td><td>currency</td></tr>
            <tr><td>Referral Bonus</td><td>currency</td></tr>
            <tr><td>Bonus Payment Status</td><td>Pending / Paid</td></tr>
            <tr><td>Actions</td><td>Mark as Paid</td></tr>
          </tbody>
        </table>
      </div>
      <div class="module-table">
        <div class="mt-head">Customer Cashbacks — fields</div>
        <table>
          <tbody>
            <tr><td>Customer Name</td><td>text</td></tr>
            <tr><td>Trip ID</td><td>link</td></tr>
            <tr><td>Trip Date</td><td>date</td></tr>
            <tr><td>Trip Cost</td><td>currency</td></tr>
            <tr><td>Cashback Amount</td><td>currency</td></tr>
            <tr><td>Cashback Payment Status</td><td>Pending / Paid</td></tr>
            <tr><td>Actions</td><td>Mark as Paid</td></tr>
          </tbody>
        </table>
      </div>
    </div>
    <p class="callout card-style" style="margin-top:14px;">Two things worth naming: (1) "Mark as Paid" is modelled the same way as the rest of this prototype's payments — it updates a real record in the database, it does not move real money, consistent with the live-payment-gateway exclusion in Section 25. (2) The reference system's Driver Referrals table has many rows with blank Trip Cost, Referral Bonus and Status — that looks like a data quality gap in the real system, not a design spec, so it isn't being replicated as a "blank state" requirement here.</p>

    <h3 style="margin-top:28px;">Admin Roles — Definitions</h3>
    <div class="table-wrap" style="margin-top:14px;">
      <table class="matrix">
        <thead><tr><th>Role</th><th>Definition</th></tr></thead>
        <tbody>
          <tr><td>Super Admin</td><td>Overall admin. Only role that can create other admin accounts and assign their rights. Capped at 2 active accounts, each with its own session. Full access to the entire admin portal.</td></tr>
          <tr><td>Admin</td><td>Access to the entire admin portal besides creating admin accounts.</td></tr>
          <tr><td>Team Lead</td><td>Function-based lead role (e.g. marketing). Broad operational access; no account creation rights.</td></tr>
          <tr><td>Field Agent</td><td>Field-facing role. Uploads and verifies driver documents; can view customer and driver details but not trip details or financial figures (daily earnings, orders, spend).</td></tr>
          <tr><td>Customer Care</td><td>Customer-facing support role. Full customer management access; limited driver edit rights; no staff management access.</td></tr>
        </tbody>
      </table>
    </div>

    <h3 style="margin-top:28px;">Permission Matrix</h3>
    <p class="desc" style="margin-top:10px;">Received as a functional specification on 20 September 2026. Reproduced in full below — cells marked <em>Pending</em> are open items the source document itself left unresolved (see the callout at the end of this section).</p>

    <p style="margin-top:22px;font-size:15px;font-weight:800;">3.1 Drivers Section</p>
    <div class="table-wrap" style="margin-top:10px;">
      <table class="matrix">
        <thead><tr><th>Action</th><th>Super Admin</th><th>Admin</th><th>Team Lead</th><th>Field Agent</th><th>Customer Care</th></tr></thead>
        <tbody>
          <tr><td>View driver list screen</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes (excl. daily earnings)</td><td>Yes</td></tr>
          <tr><td>View action buttons on driver list</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes (verify + change to customer only)</td><td>Yes</td></tr>
          <tr><td>View driver profile</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td></tr>
          <tr><td>Edit driver profile (name, email, phone)</td><td>Yes</td><td>Yes</td><td>Yes</td><td>No</td><td>No</td></tr>
          <tr><td>Verify driver</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td><td>No</td></tr>
          <tr><td>Suspend driver</td><td>Yes</td><td>Yes</td><td>Yes</td><td>No</td><td>No</td></tr>
          <tr><td>Deactivate driver</td><td>Yes</td><td>Yes</td><td>Yes</td><td>No</td><td>No</td></tr>
          <tr><td>Change driver → customer role</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td></tr>
          <tr><td>View driver documents</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td></tr>
          <tr><td>Upload driver documents</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td></tr>
          <tr><td>Delete driver documents</td><td>Yes</td><td><em>Pending</em></td><td><em>Pending</em></td><td><em>Pending</em></td><td><em>Pending</em></td></tr>
          <tr><td>View trip history</td><td>Yes</td><td>Yes</td><td>Yes</td><td>No</td><td>Yes</td></tr>
          <tr><td>Update driver bonus payments</td><td><em>Pending</em></td><td><em>Pending</em></td><td><em>Pending</em></td><td><em>Pending</em></td><td><em>Pending</em></td></tr>
          <tr><td>Update customer rewards payments</td><td><em>Pending</em></td><td><em>Pending</em></td><td><em>Pending</em></td><td><em>Pending</em></td><td><em>Pending</em></td></tr>
        </tbody>
      </table>
    </div>

    <p style="margin-top:22px;font-size:15px;font-weight:800;">3.2 Customers Section</p>
    <div class="table-wrap" style="margin-top:10px;">
      <table class="matrix">
        <thead><tr><th>Action</th><th>Super Admin</th><th>Admin</th><th>Team Lead</th><th>Field Agent</th><th>Customer Care</th></tr></thead>
        <tbody>
          <tr><td>View customer list</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td></tr>
          <tr><td>View customer profile</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td></tr>
          <tr><td>Edit customer profile</td><td>Yes</td><td>Yes</td><td>Yes</td><td>No</td><td>No</td></tr>
          <tr><td>View customer orders</td><td>Yes</td><td>Yes</td><td>Yes</td><td>No</td><td>Yes</td></tr>
          <tr><td>Change customer → driver role</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td></tr>
        </tbody>
      </table>
    </div>

    <p style="margin-top:22px;font-size:15px;font-weight:800;">3.3 Dashboard Section</p>
    <div class="table-wrap" style="margin-top:10px;">
      <table class="matrix">
        <thead><tr><th>Action</th><th>Super Admin</th><th>Admin</th><th>Team Lead</th><th>Field Agent</th><th>Customer Care</th></tr></thead>
        <tbody>
          <tr><td>Access to Admin Dashboard</td><td>Yes</td><td>Yes</td><td>Yes</td><td>No</td><td>Yes</td></tr>
        </tbody>
      </table>
    </div>

    <p style="margin-top:22px;font-size:15px;font-weight:800;">3.4 Staff Management Section</p>
    <div class="table-wrap" style="margin-top:10px;">
      <table class="matrix">
        <thead><tr><th>Action</th><th>Super Admin</th><th>Admin</th><th>Team Lead</th><th>Field Agent</th><th>Customer Care</th></tr></thead>
        <tbody>
          <tr><td>Access to admin accounts section</td><td>Yes</td><td>No</td><td>No</td><td>No</td><td>No</td></tr>
          <tr><td>Create new staff account</td><td>Yes</td><td>No</td><td>No</td><td>No</td><td>No</td></tr>
          <tr><td>Edit staff profile (name, email, phone)</td><td>Yes</td><td>No</td><td>No</td><td>No</td><td>No</td></tr>
          <tr><td>Change staff role</td><td>Yes</td><td>No</td><td>No</td><td>No</td><td>No</td></tr>
          <tr><td>Deactivate staff account</td><td>Yes</td><td>No</td><td>No</td><td>No</td><td>No</td></tr>
          <tr><td>Reactivate staff account</td><td>Yes</td><td>No</td><td>No</td><td>No</td><td>No</td></tr>
          <tr><td>Reset staff password</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td></tr>
          <tr><td>Viewing admin actions (audit trail)</td><td>Yes</td><td>Yes</td><td>Yes</td><td>No</td><td>No</td></tr>
        </tbody>
      </table>
    </div>

    <p style="margin-top:22px;font-size:15px;font-weight:800;">3.5 Own Account (All Roles)</p>
    <div class="table-wrap" style="margin-top:10px;">
      <table class="matrix">
        <thead><tr><th>Action</th><th>Super Admin</th><th>Admin</th><th>Team Lead</th><th>Field Agent</th><th>Customer Care</th></tr></thead>
        <tbody>
          <tr><td>View own profile</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td></tr>
          <tr><td>Edit own name and phone</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td></tr>
          <tr><td>Change own password</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td></tr>
          <tr><td>Change own role</td><td>No</td><td>No</td><td>No</td><td>No</td><td>No</td></tr>
          <tr><td>Deactivate own account</td><td>No</td><td>No</td><td>No</td><td>No</td><td>No</td></tr>
        </tbody>
      </table>
    </div>

    <div class="grid cols-2" style="margin-top:24px;">
      <div class="card">
        <h3>Cross-Cutting Requirements</h3>
        <ul class="bullets mt">
          <li>Every admin action is attributed to the individual who performed it and traceable back to that account, visible only to roles permitted per the matrix above</li>
          <li>Each admin account holds its own independent session — sessions are never shared across users</li>
          <li>Super Admin is capped at 2 active accounts</li>
        </ul>
      </div>
      <div class="card">
        <h3>UI/UX Requirements</h3>
        <ul class="bullets mt">
          <li>Sections or actions a role cannot access are not rendered at all, rather than shown disabled — a Field Agent never sees a visibly-blocked "daily earnings" field, for example</li>
          <li>Mobile view respects the same visibility rules as desktop — no restricted data or action is exposed on mobile just because it's hidden on desktop</li>
        </ul>
      </div>
    </div>
    <p class="callout" style="margin-top:18px;background:rgba(245,158,11,.12);color:#92400e;">Open items pending your confirmation before this scope is locked: (1) who besides Super Admin can delete driver documents — Admin, Team Lead, Field Agent and Customer Care are all marked "??" in the source spec; (2) which roles, if any, can update driver bonus payments and customer rewards payments — neither row has any values filled in yet. These two gaps sit inside the 900,000 already priced for this module in Section 22, but the actual design effort depends on the answers — e.g. a bonus-payment flow with its own approval step is more than a single permission toggle.</p>

    <div class="grid cols-2" style="margin-top:18px;">
      <div class="module-table">
        <div class="mt-head">Admin Roles &amp; Audit Trail — confirmed</div>
        <table>
          <tbody>
            <tr><td>Universal login &amp; auth (login, first-login reset, OTP, forgot password)</td><td>4</td></tr>
            <tr><td>Account creation &amp; management (Super Admin only)</td><td>5</td></tr>
            <tr><td>Self-service profile (own phone, own password)</td><td>3</td></tr>
            <tr><td>Staff listing &amp; oversight</td><td>2</td></tr>
            <tr><td>Audit trail (global, per-user, detail/diff)</td><td>3</td></tr>
            <tr class="total"><td>Subtotal</td><td>17</td></tr>
          </tbody>
        </table>
      </div>
      <div class="module-table">
        <div class="mt-head">Driver Tracking — confirmed</div>
        <table>
          <tbody>
            <tr><td>Live driver map</td><td>1</td></tr>
            <tr><td>Online drivers list</td><td>1</td></tr>
            <tr class="total"><td>Subtotal</td><td>2</td></tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="grid cols-2" style="margin-top:18px;">
      <div class="module-table">
        <div class="mt-head">Payments Portal — indicative</div>
        <table>
          <tbody>
            <tr><td>Payments overview</td><td>1</td></tr>
            <tr><td>Withdrawal approval queue</td><td>1</td></tr>
            <tr><td>Payment method oversight</td><td>1</td></tr>
            <tr><td>Transaction reconciliation</td><td>1</td></tr>
            <tr class="total"><td>Subtotal (indicative)</td><td>4</td></tr>
          </tbody>
        </table>
      </div>
      <div class="module-table">
        <div class="mt-head">Referrals &amp; Cashbacks — confirmed</div>
        <table>
          <tbody>
            <tr><td>Driver referrals list</td><td>1</td></tr>
            <tr><td>Customer cashbacks list</td><td>1</td></tr>
            <tr class="total"><td>Subtotal</td><td>2</td></tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="big-stat-block" style="margin-top:18px;">
      <p class="lbl">New screens in this addendum</p>
      <p class="num">25</p>
      <p>17 confirmed from the admin roles &amp; audit trail brief, plus 4 confirmed from the driver-tracking/referrals/cashbacks reference screenshots, plus 4 indicative for the wider payments portal — brings the total screen inventory from 58 (Section 16) to roughly 83 once built.</p>
    </div>
    <p class="callout" style="margin-top:18px;">OTP codes are shown on-screen for this prototype rather than sent by SMS, consistent with the SMS/push-notification exclusion in Section 25 — the same "real data, simulated delivery" pattern already used for payments elsewhere in the app.</p>
    <p class="callout card-style" style="margin-top:18px;">One scope note worth flagging: the "hide, don't disable" UI/UX requirement above applies to every role-aware screen, not just the 17 new ones. The Drivers, Customers and Dashboard screens already delivered in Week 4 were built for a single generic admin role — showing or hiding fields per role (e.g. a Field Agent's driver list without daily earnings) means those existing screens need role-aware variants too. That work isn't yet counted in the Section 22 pricing and would sit on top of the current UGX 7,300,000 total.</p>
  </section>

  <!-- 28 shadcn migration -->
  <section class="section" id="shadcn">
    <div class="section-head"><div><p class="section-kicker">/ Section 28</p><h2 class="section-title">Scope Addendum — Shadcn/ui Migration</h2></div><span class="ghost-num">28</span></div>
    <p class="desc" style="max-width:46rem;font-size:16px;line-height:1.7;margin-bottom:20px;">Added to scope on 19 September 2026: standardise the whole app on shadcn/ui rather than the hand-rolled Tailwind components built in Weeks 1–5. This re-platforms the 52-component library on Radix UI primitives and class-variance-authority, reskinned to LoadMastr's exact tokens, then migrates every already-delivered screen to consume it. The admin expansion in Section 27 is sequenced after this migration and gets built shadcn-native from the start, so it isn't billed twice.</p>
    <div class="grid cols-2">
      <div class="card">
        <h3>What actually changes</h3>
        <ul class="bullets mt">
          <li>Component internals — Button, TextField, Tabs, Checkbox, Dialog and the rest rebuilt on Radix UI primitives</li>
          <li>Accessibility that used to be hand-written — keyboard navigation, focus management, ARIA attributes — now comes from Radix by default</li>
          <li>Component code lives in the repo (shadcn's copy-in model), not an opaque npm dependency</li>
        </ul>
      </div>
      <div class="card">
        <h3>What doesn't change</h3>
        <ul class="bullets mt">
          <li>Screen layouts, copy, and user flows — untouched</li>
          <li>The real backend, its API contracts and the database — untouched</li>
          <li>LoadMastr's own tokens — green, Inter, 16px/12px/pill radius scale — carried over exactly</li>
        </ul>
      </div>
    </div>
    <p class="callout" style="margin-top:18px;background:rgba(245,158,11,.12);color:#92400e;">Worth stating plainly: this phase adds no new user-facing functionality. It's a foundation swap under 58 screens that already work and have already been tested against the real backend — that carries genuine regression risk (a working Button behaving differently after rebuild, a form losing a validation state) for a maintainability benefit, not a feature. Going in with that tradeoff explicit is the point of this section.</p>
    <div class="module-table" style="margin-top:18px;">
      <div class="mt-head">Migration coverage by component family</div>
      <table>
        <tbody>
          <tr><td>Navigation (5 components)</td><td>Migrate</td></tr>
          <tr><td>Forms (9 components)</td><td>Migrate</td></tr>
          <tr><td>Actions (3 components)</td><td>Migrate</td></tr>
          <tr><td>Feedback (7 components)</td><td>Migrate</td></tr>
          <tr><td>Logistics (11 components)</td><td>Migrate (domain-specific — no direct shadcn equivalent, built on shadcn primitives)</td></tr>
          <tr><td>Payments (6 components)</td><td>Migrate</td></tr>
          <tr><td>Identity (5 components)</td><td>Migrate</td></tr>
          <tr><td>Admin (6 components)</td><td>Migrate</td></tr>
          <tr class="total"><td>Total</td><td>52 components, 58 screens</td></tr>
        </tbody>
      </table>
    </div>
  </section>

  <!-- 29 acceptance -->
  <section class="section" id="acceptance">
    <div class="section-head"><div><p class="section-kicker">/ Section 29</p><h2 class="section-title">Acceptance</h2></div><span class="ghost-num">29</span></div>
    <div class="sig-grid">
      <div class="sig-card">
        <h3>Prepared by: Ignatius Musaazi, Senior Product Designer</h3>
        <div class="sig-lines"><div>Name / Title</div><div>Signature</div><div>Date</div></div>
      </div>
      <div class="sig-card">
        <h3>Accepted by: LoadMastr Representative</h3>
        <div class="sig-lines"><div>Name / Title</div><div>Signature</div><div>Date</div></div>
      </div>
    </div>
  </section>

  <footer class="no-print">LoadMastr Engagement Plan — Prepared September 2026</footer>
</div>

`;

export default function Proposal() {
  const containerRef = useRef(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const printBtn = root.querySelector('#printBtn');
    const handlePrint = () => window.print();
    printBtn?.addEventListener('click', handlePrint);

    const links = Array.from(root.querySelectorAll('#toc a'));
    const sections = links.map((a) => root.querySelector(a.getAttribute('href')));
    function setActive(id) {
      links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const closest = visible.reduce((prev, cur) =>
          Math.abs(cur.boundingClientRect.top) < Math.abs(prev.boundingClientRect.top) ? cur : prev
        );
        setActive(closest.target.id);
      },
      { root: null, rootMargin: '-15% 0px -65% 0px', threshold: 0 }
    );
    sections.forEach((el) => el && observer.observe(el));
    if (sections[0]) setActive(sections[0].id);

    return () => {
      printBtn?.removeEventListener('click', handlePrint);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="proposal-page">
      <style dangerouslySetInnerHTML={{ __html: PROPOSAL_STYLES }} />
      <div dangerouslySetInnerHTML={{ __html: PROPOSAL_HTML }} />
    </div>
  );
}
