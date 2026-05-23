import './style.css'
import { SITE_CONTENT } from './constants/siteContent.js'

function hydrateContent() {
  const heroEyebrow = document.getElementById('hero-eyebrow')
  const heroPrefix = document.getElementById('hero-headline-prefix')
  const heroAccent = document.getElementById('hero-headline-accent')
  const heroSub = document.getElementById('hero-subheadline')

  if (heroEyebrow) heroEyebrow.textContent = SITE_CONTENT.hero.eyebrow
  if (heroPrefix) heroPrefix.textContent = SITE_CONTENT.hero.headlinePrefix
  if (heroAccent) heroAccent.textContent = SITE_CONTENT.hero.headlineAccent
  if (heroSub) heroSub.textContent = SITE_CONTENT.hero.subheadline

  const numberSlots = document.querySelectorAll('[data-capability-number]')
  const titleSlots = document.querySelectorAll('[data-capability-title]')
  const bodySlots = document.querySelectorAll('[data-capability-body]')
  const specSlots = document.querySelectorAll('[data-capability-specs]')
  SITE_CONTENT.capabilities.forEach((cap, i) => {
    if (numberSlots[i]) numberSlots[i].textContent = cap.number
    if (titleSlots[i]) titleSlots[i].textContent = cap.title
    if (bodySlots[i]) bodySlots[i].textContent = cap.body
    if (specSlots[i] && Array.isArray(cap.specs)) {
      specSlots[i].innerHTML = ''
      cap.specs.forEach((line) => {
        const li = document.createElement('li')
        li.textContent = line
        specSlots[i].appendChild(li)
      })
    }
  })
}

hydrateContent()
setupMagneticGrid()

function setupMagneticGrid() {
  const grid = document.querySelector('.access-grid-bg')
  if (!grid) return
  // Touch / no-hover devices: skip listener, leave base 0.05 grid visible.
  if (window.matchMedia && window.matchMedia('(hover: none)').matches) return

  let rafId = 0
  let pendingX = -300
  let pendingY = -300

  const flush = () => {
    rafId = 0
    grid.style.setProperty('--mx', pendingX + 'px')
    grid.style.setProperty('--my', pendingY + 'px')
  }

  grid.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch') return
    const rect = grid.getBoundingClientRect()
    pendingX = event.clientX - rect.left
    pendingY = event.clientY - rect.top
    if (!rafId) rafId = requestAnimationFrame(flush)
  })

  grid.addEventListener('pointerleave', () => {
    pendingX = -300
    pendingY = -300
    if (!rafId) rafId = requestAnimationFrame(flush)
  })
}

function generateIntegrityHash() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  let hex = '0x'
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0')
  }
  return hex
}

function startIntegritySeal() {
  const el = document.getElementById('integrity-hash')
  if (!el) return
  const tick = () => {
    el.style.opacity = '0.15'
    setTimeout(() => {
      el.textContent = generateIntegrityHash()
      el.style.opacity = '1'
    }, 120)
  }
  tick()
  setInterval(tick, 3000)
}

startIntegritySeal()

function startMetricCounters() {
  const counters = document.querySelectorAll('.metric-counter')
  if (!counters.length) return
  if (typeof IntersectionObserver === 'undefined') {
    counters.forEach((el) => {
      const target = parseFloat(el.dataset.target)
      const decimals = parseInt(el.dataset.decimals || '0', 10)
      el.textContent = target.toFixed(decimals)
    })
    return
  }

  const animate = (el) => {
    const target = parseFloat(el.dataset.target)
    const decimals = parseInt(el.dataset.decimals || '0', 10)
    const duration = 1600
    const start = performance.now()
    const step = (now) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 4)
      el.textContent = (target * eased).toFixed(decimals)
      if (t < 1) requestAnimationFrame(step)
      else el.textContent = target.toFixed(decimals)
    }
    requestAnimationFrame(step)
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !entry.target.dataset.counted) {
          entry.target.dataset.counted = '1'
          animate(entry.target)
          io.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.5 }
  )

  counters.forEach((c) => io.observe(c))
}

startMetricCounters()


const latencyHistory = []
const HISTORY_MAX = 10
const MIN_MS = 18
const MAX_MS = 45
const TICK_INTERVAL_MS = 1500

const latencyEl = document.getElementById('vitals-latency')
const latencyLargeEl = document.getElementById('vitals-latency-large')
const throughputEl = document.getElementById('vitals-throughput')
const handshakesEl = document.getElementById('vitals-handshakes')
const integrityEl = document.getElementById('vitals-integrity')

// Simulated metric base values + drift bounds.
let throughputGBs = 1.20
let activeHandshakes = 4102
let integrityScore = 100.0

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function tickTelemetry() {
  const latency = Math.floor(Math.random() * (MAX_MS - MIN_MS + 1)) + MIN_MS
  latencyHistory.push(latency)
  if (latencyHistory.length > HISTORY_MAX) {
    latencyHistory.shift()
  }
  const formatted = `${latency}ms`
  if (latencyEl) latencyEl.textContent = formatted
  if (latencyLargeEl) latencyLargeEl.textContent = formatted

  // Throughput: random walk around 1.20 GB/s, bounded 1.05–1.40.
  throughputGBs = clamp(throughputGBs + (Math.random() - 0.5) * 0.08, 1.05, 1.40)
  if (throughputEl) throughputEl.textContent = throughputGBs.toFixed(2)

  // Active handshakes: integer random walk around 4,100, bounded 3,900–4,300.
  activeHandshakes = clamp(activeHandshakes + Math.floor((Math.random() - 0.5) * 60), 3900, 4300)
  if (handshakesEl) handshakesEl.textContent = activeHandshakes.toLocaleString('en-US')

  // Integrity score: holds at 100, ~5% chance of a 99.9 micro-dip for credibility.
  integrityScore = Math.random() < 0.05 ? 99.9 : 100.0
  if (integrityEl) integrityEl.textContent = integrityScore === 100 ? '100' : integrityScore.toFixed(1)
}

tickTelemetry()
setInterval(tickTelemetry, TICK_INTERVAL_MS)

const ROLE_FEATURES = {
  USER: [
    'Read-only dashboard access',
    'Personal profile management',
    'Two-factor authentication',
    'Activity log viewing',
  ],
  CREATOR: [
    'Content publishing & moderation',
    'Audience analytics dashboard',
    'Custom branding controls',
    'Revenue & payout reporting',
    'API key generation (scoped)',
  ],
  DEVELOPER: [
    'Full API access (all scopes)',
    'Webhook configuration',
    'Infrastructure telemetry feeds',
    'Audit log export',
    'Production deploy permissions',
    'Service account provisioning',
  ],
}

const MODULES = [
  { id: 'financials', label: 'Financials' },
  { id: 'user_data', label: 'User Data' },
  { id: 'source_code', label: 'Source Code' },
  { id: 'infrastructure', label: 'Infrastructure' },
  { id: 'content', label: 'Content' },
  { id: 'analytics', label: 'Analytics' },
]

const ROLE_MODULES = {
  USER: ['user_data'],
  CREATOR: ['user_data', 'content', 'analytics', 'financials'],
  DEVELOPER: ['user_data', 'content', 'analytics', 'financials', 'source_code', 'infrastructure'],
}

const LOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`
const UNLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>`

const ROLE_ORDER = ['USER', 'CREATOR', 'DEVELOPER']
const ROLE_CYCLE_MS = 4500
let activeRole = 'USER'

const roleButtons = document.querySelectorAll('.role-btn')
const activeRoleLabel = document.getElementById('active-role')
const featuresList = document.getElementById('role-features')
const moduleGrid = document.getElementById('module-grid')

// Build module cells once so class toggles can animate instead of re-mounting nodes.
const moduleCellRefs = new Map()
if (moduleGrid) {
  moduleGrid.innerHTML = MODULES.map(
    (mod) =>
      `<div class="module-cell" data-module-id="${mod.id}"><span class="module-label">${mod.label}</span><span class="module-status flex items-center gap-1.5"></span></div>`
  ).join('')
  moduleGrid.querySelectorAll('[data-module-id]').forEach((el) => {
    moduleCellRefs.set(el.dataset.moduleId, {
      cell: el,
      status: el.querySelector('.module-status'),
    })
  })
}

function renderAccessMatrix() {
  if (activeRoleLabel) {
    activeRoleLabel.textContent = activeRole
  }
  roleButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.role === activeRole)
  })
  if (featuresList) {
    featuresList.innerHTML = ROLE_FEATURES[activeRole]
      .map(
        (feature) =>
          `<li class="flex items-start gap-2"><span class="text-sky-400 font-mono text-xs mt-1">▸</span><span>${feature}</span></li>`
      )
      .join('')
  }
  const unlockedSet = new Set(ROLE_MODULES[activeRole])
  moduleCellRefs.forEach((refs, modId) => {
    const isUnlocked = unlockedSet.has(modId)
    refs.cell.classList.toggle('unlocked', isUnlocked)
    refs.status.innerHTML = `${isUnlocked ? UNLOCK_ICON : LOCK_ICON}${isUnlocked ? 'Unlocked' : 'Locked'}`
  })
}

const MANUAL_PAUSE_MS = 20000
let roleCycleTimer = null
let pauseTimer = null
let isPaused = false

function startRoleCycle() {
  stopRoleCycle()
  roleCycleTimer = setInterval(() => {
    if (isPaused) return
    const nextIndex = (ROLE_ORDER.indexOf(activeRole) + 1) % ROLE_ORDER.length
    activeRole = ROLE_ORDER[nextIndex]
    renderAccessMatrix()
  }, ROLE_CYCLE_MS)
}
function stopRoleCycle() {
  if (roleCycleTimer !== null) {
    clearInterval(roleCycleTimer)
    roleCycleTimer = null
  }
}
function clearPauseTimer() {
  if (pauseTimer !== null) {
    clearTimeout(pauseTimer)
    pauseTimer = null
  }
}

roleButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    activeRole = btn.dataset.role
    renderAccessMatrix()
    // Manual selection holds for 20s before the autonomous cycle resumes.
    isPaused = true
    clearPauseTimer()
    pauseTimer = setTimeout(() => {
      isPaused = false
      pauseTimer = null
    }, MANUAL_PAUSE_MS)
  })
})

renderAccessMatrix()
startRoleCycle()

const LOG_LINES = [
  '> INITIALIZING_SECURE_TUNNEL...',
  '> VERIFYING_INTEGRITY_PROTOCOLS...',
  '> SYSTEM_STATUS: OPERATIONAL',
]
const TYPE_MS = 45
const HOLD_MS = 1800
const ERASE_MS = 25

const logTextEl = document.getElementById('system-log-text')

if (logTextEl) {
  let lineIndex = 0
  let charIndex = 0
  let phase = 'typing'

  function stepLog() {
    const line = LOG_LINES[lineIndex]
    if (phase === 'typing') {
      charIndex += 1
      logTextEl.textContent = line.slice(0, charIndex)
      if (charIndex >= line.length) {
        phase = 'holding'
        setTimeout(stepLog, HOLD_MS)
        return
      }
      setTimeout(stepLog, TYPE_MS)
    } else if (phase === 'holding') {
      phase = 'erasing'
      setTimeout(stepLog, ERASE_MS)
    } else if (phase === 'erasing') {
      charIndex -= 1
      logTextEl.textContent = line.slice(0, Math.max(0, charIndex))
      if (charIndex <= 0) {
        lineIndex = (lineIndex + 1) % LOG_LINES.length
        charIndex = 0
        phase = 'typing'
      }
      setTimeout(stepLog, ERASE_MS)
    }
  }

  stepLog()
}

// App Showcase: 20 distinct modular prototypes.
// Each module has a unique technical identity (waveforms, shields, networks,
// databases, terminals, etc.) tinted by its category accent color. Tiles are
// rendered into .app-showcase-track and then duplicated for the seamless
// marquee loop (-50% translate lands on the start of the second copy).
const SHOWCASE_MODULES = [
  // Clinical
  { name: 'VitalsOS',       category: 'Clinical',    accent: '#38bdf8', stat: 'v3.2',    metric: 'NOMINAL',     visual: 'pulse',      techDetail: 'RT telemetry · 1ms tick',          laymanBenefit: 'See your audience, live.' },
  { name: 'BioSync',        category: 'Clinical',    accent: '#10b981', stat: 'v2.1',    metric: 'SYNC',        visual: 'dualWave',   techDetail: 'Bidirectional state mesh',         laymanBenefit: 'One source of truth, instantly.' },
  { name: 'NeuralMap',      category: 'Clinical',    accent: '#8b5cf6', stat: 'v1.7',    metric: 'MAPPING',     visual: 'neural',     techDetail: 'Unsupervised clustering',          laymanBenefit: 'See patterns you would miss.' },
  { name: 'MedCheck',       category: 'Clinical',    accent: '#14b8a6', stat: 'v4.0',    metric: 'VERIFIED',    visual: 'checklist',  techDetail: 'HIPAA + SOC2 audit chain',         laymanBenefit: 'Compliant. No bottleneck.' },
  // Security
  { name: 'AegisVault',     category: 'Security',    accent: '#6366f1', stat: 'AES-256', metric: 'SECURED',     visual: 'lockShield', techDetail: 'AES-256 + HSM-backed keys',        laymanBenefit: 'Hacker-proof IP.' },
  { name: 'SentinelRBAC',   category: 'Security',    accent: '#94a3b8', stat: 'v2.8',    metric: 'ENFORCING',   visual: 'shieldCheck',techDetail: 'ABAC policy graph',                laymanBenefit: 'Right access, every teammate.' },
  { name: 'QuantumKey',     category: 'Security',    accent: '#fbbf24', stat: 'PQC',     metric: 'ROTATED',     visual: 'key',        techDetail: 'CRYSTALS-Kyber rotation',          laymanBenefit: 'Future-proof encryption.' },
  { name: 'ZeroShield',     category: 'Security',    accent: '#22d3ee', stat: 'v3.0',    metric: 'ACTIVE',      visual: 'shield',     techDetail: 'mTLS + JWT introspection',         laymanBenefit: 'Verified at the door.' },
  // Performance
  { name: 'ApexThroughput', category: 'Performance', accent: '#ef4444', stat: '1.2GB/s', metric: 'PEAK',        visual: 'bars',       techDetail: 'Adaptive backpressure',            laymanBenefit: 'Survives launch day.' },
  { name: 'FluxPipeline',   category: 'Performance', accent: '#f97316', stat: 'v5.4',    metric: 'FLOWING',     visual: 'pipeline',   techDetail: 'Event-driven CDC',                 laymanBenefit: 'Publish → live, instantly.' },
  { name: 'ChronosLogs',    category: 'Performance', accent: '#f59e0b', stat: '4.1k/s',  metric: 'STREAMING',   visual: 'terminal',   techDetail: 'Append-only WAL',                  laymanBenefit: 'Replay any moment.' },
  { name: 'EdgeNode',       category: 'Performance', accent: '#0ea5e9', stat: '23 PoP',  metric: 'ROUTING',     visual: 'edgeMap',    techDetail: '23-PoP anycast mesh',              laymanBenefit: 'Feels local, everywhere.' },
  // Creator
  { name: 'LuminaIP',       category: 'Creator',     accent: '#ec4899', stat: 'v1.9',    metric: 'CREATIVE',    visual: 'gallery',    techDetail: 'Webhook-driven entitlements',      laymanBenefit: 'Pay → unlock, instantly.' },
  { name: 'PrismStream',    category: 'Creator',     accent: '#fb7185', stat: '60fps',   metric: 'BROADCAST',   visual: 'spectrum',   techDetail: 'WebRTC + HLS fanout',              laymanBenefit: 'Studio-grade live, no rig.' },
  { name: 'ZenithUI',       category: 'Creator',     accent: '#f1f5f9', stat: 'v6.0',    metric: 'RENDERED',    visual: 'uiMock',     techDetail: 'Tokenized design system',          laymanBenefit: 'Beautiful UI in days.' },
  { name: 'EchoWave',       category: 'Creator',     accent: '#facc15', stat: '48kHz',   metric: 'TRANSMITTING',visual: 'waveform',   techDetail: '48kHz lossless DSP',               laymanBenefit: 'Professional-studio sound.' },
  // Logic
  { name: 'Pathfinder',     category: 'Logic',       accent: '#6ee7b7', stat: 'MAP_v1',  metric: 'COMPUTING',   visual: 'tree',       techDetail: 'DAG-based curriculum',             laymanBenefit: 'The perfect next step.' },
  { name: 'CerebroAI',      category: 'Logic',       accent: '#cbd5e1', stat: 'v0.9',    metric: 'INFERRING',   visual: 'mesh',       techDetail: 'Quantized on-device inference',    laymanBenefit: 'AI features, no AI bill.' },
  { name: 'TitanDB',        category: 'Logic',       accent: '#a855f7', stat: '12TB',    metric: 'INDEXED',     visual: 'database',   techDetail: 'Distributed cold + hot tiers',     laymanBenefit: 'Never lose a file.' },
  { name: 'NexusHub',       category: 'Logic',       accent: '#84cc16', stat: 'v3.1',    metric: 'CONNECTED',   visual: 'hub',        techDetail: 'OAuth + webhook fabric',           laymanBenefit: 'Plugs into your stack.' },
]

const SHOWCASE_VISUALS = {
  pulse: (c) => `<svg viewBox="0 0 100 60" class="w-full h-full" preserveAspectRatio="none">
    <polyline points="0,30 12,30 18,12 24,48 30,18 36,30 50,30 58,30 64,8 70,52 76,18 82,30 100,30"
      fill="none" stroke="${c}" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"
      style="filter: drop-shadow(0 0 3px ${c}b3);"/>
  </svg>`,
  dualWave: (c) => {
    const wave = (offset, opacity) => {
      const pts = []
      for (let x = 0; x <= 100; x += 4) {
        const y = 30 + Math.sin((x + offset) * 0.18) * 14
        pts.push(`${x},${y.toFixed(1)}`)
      }
      return `<polyline points="${pts.join(' ')}" fill="none" stroke="${c}" stroke-width="1.2" opacity="${opacity}" style="filter:drop-shadow(0 0 2px ${c}80);"/>`
    }
    return `<svg viewBox="0 0 100 60" class="w-full h-full" preserveAspectRatio="none">${wave(0, 0.95)}${wave(28, 0.45)}</svg>`
  },
  neural: (c) => {
    const L = [12, 50, 88]
    const rows = [[15, 30, 45], [10, 25, 40, 50], [20, 40]]
    let lines = '', nodes = ''
    for (let i = 0; i < L.length; i++) {
      rows[i].forEach((y) => {
        nodes += `<circle cx="${L[i]}" cy="${y}" r="2.2" fill="${c}" style="filter:drop-shadow(0 0 2px ${c});"/>`
        if (i < L.length - 1) {
          rows[i + 1].forEach((y2) => {
            lines += `<line x1="${L[i]}" y1="${y}" x2="${L[i + 1]}" y2="${y2}" stroke="${c}" stroke-width="0.35" opacity="0.3"/>`
          })
        }
      })
    }
    return `<svg viewBox="0 0 100 60" class="w-full h-full">${lines}${nodes}</svg>`
  },
  checklist: (c) => {
    return `<div class="w-full h-full flex flex-col justify-center gap-2 px-1">
      ${[0, 1, 2, 3].map((idx) => {
        const done = idx < 3
        return `<div class="flex items-center gap-2">
          <div class="w-3.5 h-3.5 rounded-sm border flex items-center justify-center" style="border-color:${c}99; ${done ? `background:${c}33;` : ''}">
            ${done ? `<svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="${c}" stroke-width="2"><polyline points="2,5 4,7 8,3"/></svg>` : ''}
          </div>
          <div class="h-1 rounded-full flex-1" style="background:${done ? c + '88' : '#1e293b'};"></div>
        </div>`
      }).join('')}
    </div>`
  },
  lockShield: (c) => `<svg viewBox="0 0 60 60" class="h-full" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 0 6px ${c}aa);">
    <path d="M30 5 L50 14 L50 32 Q50 48 30 55 Q10 48 10 32 L10 14 Z"/>
    <rect x="22" y="28" width="16" height="14" rx="1.5"/>
    <path d="M25 28 V22 a5 5 0 0 1 10 0 V28"/>
  </svg>`,
  shieldCheck: (c) => `<svg viewBox="0 0 60 60" class="h-full" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 0 6px ${c}aa);">
    <path d="M30 5 L50 14 L50 32 Q50 48 30 55 Q10 48 10 32 L10 14 Z"/>
    <polyline points="20,30 27,38 42,22"/>
  </svg>`,
  shield: (c) => `<svg viewBox="0 0 60 60" class="h-full" fill="none" stroke="${c}" stroke-width="1.6" style="filter:drop-shadow(0 0 6px ${c}aa);">
    <path d="M30 5 L50 14 L50 32 Q50 48 30 55 Q10 48 10 32 L10 14 Z"/>
    <circle cx="30" cy="30" r="7" fill="${c}" fill-opacity="0.35"/>
    <circle cx="30" cy="30" r="3" fill="${c}"/>
  </svg>`,
  key: (c) => `<svg viewBox="0 0 80 30" class="w-full" fill="none" stroke="${c}" stroke-width="1.6" style="filter:drop-shadow(0 0 5px ${c}aa);">
    <circle cx="14" cy="15" r="9"/>
    <circle cx="14" cy="15" r="3" fill="${c}"/>
    <line x1="23" y1="15" x2="72" y2="15"/>
    <line x1="55" y1="15" x2="55" y2="22"/>
    <line x1="63" y1="15" x2="63" y2="20"/>
    <line x1="72" y1="15" x2="72" y2="24"/>
  </svg>`,
  bars: (c) => {
    const heights = [42, 68, 30, 84, 56, 92, 48, 72]
    return `<svg viewBox="0 0 100 60" class="w-full h-full" preserveAspectRatio="none">
      ${heights.map((h, i) => {
        const x = i * 12 + 3
        const barH = h * 0.55
        const y = 58 - barH
        return `<rect x="${x}" y="${y}" width="8" height="${barH}" rx="0.5" fill="${c}" opacity="${(0.45 + h / 220).toFixed(2)}" style="filter:drop-shadow(0 0 2px ${c}99);"/>`
      }).join('')}
    </svg>`
  },
  pipeline: (c) => `<svg viewBox="0 0 100 60" class="w-full h-full">
    <line x1="5" y1="30" x2="95" y2="30" stroke="${c}" stroke-width="2" opacity="0.25"/>
    <line x1="5" y1="30" x2="95" y2="30" stroke="${c}" stroke-width="2" stroke-dasharray="9 6" style="filter:drop-shadow(0 0 4px ${c});"/>
    <circle cx="15" cy="30" r="3.5" fill="${c}" style="filter:drop-shadow(0 0 3px ${c});"/>
    <circle cx="50" cy="30" r="3.5" fill="${c}" style="filter:drop-shadow(0 0 3px ${c});"/>
    <circle cx="82" cy="30" r="3.5" fill="${c}" style="filter:drop-shadow(0 0 3px ${c});"/>
    <polygon points="95,30 88,25 88,35" fill="${c}"/>
  </svg>`,
  terminal: (c) => {
    const lines = ['> SYS.BOOT_OK', '> LOG.0x4A82', '> EVENT.WRITE', '> CHRONO.SYNC']
    return `<div class="w-full h-full flex flex-col justify-center gap-1.5 font-mono text-[8px] px-1">
      ${lines.map((l, i) => `<div style="color:${c}; opacity:${(0.4 + i * 0.18).toFixed(2)};">${l}</div>`).join('')}
      <div class="flex items-center gap-1" style="color:${c};"><span>&gt;</span><span class="inline-block w-1.5 h-2 animate-pulse" style="background:${c};"></span></div>
    </div>`
  },
  edgeMap: (c) => `<svg viewBox="0 0 100 60" class="w-full h-full">
    <g stroke="${c}" stroke-width="0.5" opacity="0.4" fill="none">
      <path d="M15,42 Q30,10 50,25"/>
      <path d="M50,25 Q70,40 85,15"/>
      <path d="M15,42 Q40,52 75,46"/>
      <path d="M30,15 Q45,22 50,25"/>
    </g>
    <g fill="${c}" style="filter:drop-shadow(0 0 3px ${c});">
      <circle cx="15" cy="42" r="2.5"/>
      <circle cx="50" cy="25" r="3"/>
      <circle cx="85" cy="15" r="2.5"/>
      <circle cx="75" cy="46" r="2.5"/>
      <circle cx="30" cy="15" r="2"/>
    </g>
  </svg>`,
  gallery: (c) => {
    const ops = [0.65, 0.35, 0.5, 0.3, 0.7, 0.45, 0.55, 0.4, 0.6]
    return `<div class="grid grid-cols-3 gap-1 w-full h-full">
      ${ops.map((op) => `<div class="rounded-sm" style="background:${c}; opacity:${op};"></div>`).join('')}
    </div>`
  },
  spectrum: (c) => {
    const heights = [22, 50, 36, 70, 46, 60, 30, 56, 40, 66, 26, 50]
    return `<svg viewBox="0 0 100 60" class="w-full h-full" preserveAspectRatio="none">
      ${heights.map((h, i) => {
        const x = i * 8 + 2
        const y = 30 - h / 3
        return `<rect x="${x}" y="${y}" width="5" height="${(h * 0.66).toFixed(1)}" rx="1" fill="${c}" style="filter:drop-shadow(0 0 2px ${c}aa);"/>`
      }).join('')}
    </svg>`
  },
  uiMock: (c) => `<div class="w-full h-full flex flex-col gap-1.5">
    <div class="h-2 rounded-sm" style="background:${c}; opacity:0.75;"></div>
    <div class="flex gap-1.5 flex-1">
      <div class="w-1/3 rounded-sm border" style="border-color:${c}66;"></div>
      <div class="flex-1 flex flex-col gap-1">
        <div class="h-1.5 rounded-sm" style="background:${c}; opacity:0.5;"></div>
        <div class="h-1.5 rounded-sm w-3/4" style="background:${c}; opacity:0.35;"></div>
        <div class="h-1.5 rounded-sm w-1/2" style="background:${c}; opacity:0.35;"></div>
        <div class="flex-1"></div>
        <div class="h-3 rounded-sm" style="background:${c}; opacity:0.7;"></div>
      </div>
    </div>
  </div>`,
  waveform: (c) => {
    const heights = [8, 14, 24, 18, 30, 12, 26, 32, 20, 16, 28, 10, 24, 14, 8]
    return `<svg viewBox="0 0 100 60" class="w-full h-full" preserveAspectRatio="none">
      ${heights.map((h, i) => {
        const x = i * 6.5 + 2
        return `<rect x="${x}" y="${30 - h / 2}" width="3" height="${h}" rx="1" fill="${c}" style="filter:drop-shadow(0 0 2px ${c}aa);"/>`
      }).join('')}
    </svg>`
  },
  tree: (c) => `<svg viewBox="0 0 100 60" class="w-full h-full">
    <g stroke="${c}" stroke-width="0.7" opacity="0.5">
      <line x1="50" y1="10" x2="25" y2="30"/>
      <line x1="50" y1="10" x2="75" y2="30"/>
      <line x1="25" y1="30" x2="15" y2="50"/>
      <line x1="25" y1="30" x2="35" y2="50"/>
      <line x1="75" y1="30" x2="65" y2="50"/>
      <line x1="75" y1="30" x2="85" y2="50"/>
    </g>
    <g fill="${c}" style="filter:drop-shadow(0 0 3px ${c});">
      <circle cx="50" cy="10" r="3.5"/>
      <circle cx="25" cy="30" r="2.8"/>
      <circle cx="75" cy="30" r="2.8"/>
      <circle cx="15" cy="50" r="2.2"/>
      <circle cx="35" cy="50" r="2.2"/>
      <circle cx="65" cy="50" r="2.2"/>
      <circle cx="85" cy="50" r="2.2"/>
    </g>
  </svg>`,
  mesh: (c) => {
    // Dense fully-connected mesh suggestive of inference
    const pts = [[18, 15], [50, 10], [82, 15], [12, 38], [50, 32], [88, 38], [25, 52], [75, 52]]
    let lines = ''
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const [x1, y1] = pts[i], [x2, y2] = pts[j]
        const dist = Math.hypot(x2 - x1, y2 - y1)
        if (dist < 45) {
          lines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="0.3" opacity="0.28"/>`
        }
      }
    }
    const nodes = pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="${c}" style="filter:drop-shadow(0 0 2px ${c});"/>`).join('')
    return `<svg viewBox="0 0 100 60" class="w-full h-full">${lines}${nodes}</svg>`
  },
  database: (c) => `<svg viewBox="0 0 60 60" class="h-full" fill="none" stroke="${c}" stroke-width="1.3" style="filter:drop-shadow(0 0 5px ${c}aa);">
    <ellipse cx="30" cy="13" rx="18" ry="4.5" fill="${c}" fill-opacity="0.35"/>
    <path d="M12 13 V25 Q12 30 30 30 Q48 30 48 25 V13"/>
    <ellipse cx="30" cy="25" rx="18" ry="4.5" fill="${c}" fill-opacity="0.2"/>
    <path d="M12 25 V37 Q12 42 30 42 Q48 42 48 37 V25"/>
    <ellipse cx="30" cy="37" rx="18" ry="4.5" fill="${c}" fill-opacity="0.15"/>
    <path d="M12 37 V49 Q12 54 30 54 Q48 54 48 49 V37"/>
  </svg>`,
  hub: (c) => `<svg viewBox="0 0 100 60" class="w-full h-full">
    <g stroke="${c}" stroke-width="0.5" opacity="0.4">
      <line x1="50" y1="30" x2="15" y2="10"/>
      <line x1="50" y1="30" x2="50" y2="5"/>
      <line x1="50" y1="30" x2="85" y2="10"/>
      <line x1="50" y1="30" x2="92" y2="30"/>
      <line x1="50" y1="30" x2="85" y2="50"/>
      <line x1="50" y1="30" x2="50" y2="55"/>
      <line x1="50" y1="30" x2="15" y2="50"/>
      <line x1="50" y1="30" x2="8" y2="30"/>
    </g>
    <g fill="${c}" style="filter:drop-shadow(0 0 2px ${c});">
      <circle cx="15" cy="10" r="2"/><circle cx="50" cy="5" r="2"/><circle cx="85" cy="10" r="2"/>
      <circle cx="92" cy="30" r="2"/><circle cx="85" cy="50" r="2"/><circle cx="50" cy="55" r="2"/>
      <circle cx="15" cy="50" r="2"/><circle cx="8" cy="30" r="2"/>
    </g>
    <circle cx="50" cy="30" r="5.5" fill="${c}" style="filter:drop-shadow(0 0 7px ${c});"/>
  </svg>`,
}

function renderShowcaseTile(mod) {
  const visualFn = SHOWCASE_VISUALS[mod.visual]
  const visual = visualFn ? visualFn(mod.accent) : ''
  return `<div class="app-tile snap-center shrink-0 w-64 h-96 bg-slate-900/80 rounded-xl border shadow-2xl relative transition-transform duration-300 ease-out hover:scale-105 hover:z-10 overflow-hidden" style="border-color:${mod.accent}33;">
    <div class="w-full h-full bg-slate-950/40 p-4 flex flex-col">
      <!-- ID strip — tiny module name + category pill, kept as chrome only -->
      <div class="flex items-center justify-between gap-2 mb-2">
        <span class="font-mono text-[9px] tracking-[0.25em] uppercase truncate opacity-70" style="color:${mod.accent};">${mod.name}</span>
        <span class="flex items-center gap-1 text-[8px] font-mono text-slate-400 uppercase tracking-wider shrink-0">
          <span class="w-1.5 h-1.5 rounded-full animate-pulse" style="background:${mod.accent}; box-shadow:0 0 4px ${mod.accent};"></span>${mod.category}
        </span>
      </div>
      <!-- TOP: Hook — layman benefit leads with sky-400 bold text-sm -->
      <div class="text-sky-400 font-bold text-sm mb-3 leading-snug">${mod.laymanBenefit}</div>
      <!-- CENTER: Theoretical UI — the visual icon fills the remaining height -->
      <div class="flex-1 rounded-md border bg-slate-950/60 p-3 flex items-center justify-center overflow-hidden" style="border-color:${mod.accent}22;">
        ${visual}
      </div>
      <!-- BOTTOM: Proof — technical subtitle in subtle secondary white/60 -->
      <div class="text-white/60 text-[10px] font-normal mt-3 font-mono uppercase tracking-wider leading-snug">${mod.techDetail}</div>
      <div class="flex items-center justify-between text-[8px] font-mono pt-2 mt-2 border-t border-white/5">
        <span class="text-slate-500 tracking-wider">${mod.stat}</span>
        <span style="color:${mod.accent}cc;">${mod.metric}</span>
      </div>
    </div>
  </div>`
}

// Systems Inquiry form — modern fetch-based submission to Formspree.
// Replace FORMSPREE_ENDPOINT with the real form ID from formspree.io once
// the account is set up. Formspree accepts a POST of FormData and, when the
// Accept header asks for JSON, returns a JSON envelope instead of redirecting
// — so we get a clean SPA-style success/error without leaving the page.
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/meedzooy'
const inquiryForm = document.getElementById('inquiry-form')
const inquiryStatus = document.getElementById('inquiry-status')
const inquirySubmit = document.getElementById('inquiry-submit')
const inquirySubmitLabel = document.getElementById('inquiry-submit-label')
const inquirySuccess = document.getElementById('inquiry-success')
const setInquiryStatus = (text, tone = 'slate') => {
  if (!inquiryStatus) return
  inquiryStatus.textContent = text
  inquiryStatus.classList.remove('text-slate-500', 'text-sky-400', 'text-emerald-400', 'text-rose-400')
  inquiryStatus.classList.add({ slate: 'text-slate-500', sky: 'text-sky-400', emerald: 'text-emerald-400', rose: 'text-rose-400' }[tone])
}
const onInquirySubmit = async (e) => {
  e.preventDefault() // Zero-reload: never let the browser navigate.
  if (!inquiryForm.checkValidity()) {
    setInquiryStatus('STATUS: Invalid input — check required fields.', 'rose')
    inquiryForm.reportValidity()
    return
  }
  // Hide any prior success receipt before kicking off a new transmission.
  if (inquirySuccess) {
    inquirySuccess.classList.add('hidden')
    inquirySuccess.classList.remove('flex')
  }
  // Lock the button and swap its label to UPLOADING… while the fetch is in
  // flight. The disabled state also blocks double-submits.
  inquirySubmit.disabled = true
  if (inquirySubmitLabel) inquirySubmitLabel.textContent = 'UPLOADING...'
  setInquiryStatus('STATUS: Transmitting…', 'sky')

  try {
    // Pull values from the form and map them into Formspree's expected shape:
    // name / email / message. The textarea is internally called "scope" for
    // UX clarity, but Formspree (and most inbox previews) expect `message`.
    const userName = document.getElementById('inquiry-name').value.trim()
    const userEmail = document.getElementById('inquiry-email').value.trim()
    const userMessage = document.getElementById('inquiry-scope').value.trim()
    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: userName,
        email: userEmail,
        message: userMessage,
      }),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    // Success path — reveal the neon receipt, clear the form, return the
    // button to its resting state ready for another submission.
    if (inquirySuccess) {
      inquirySuccess.classList.remove('hidden')
      inquirySuccess.classList.add('flex')
    }
    setInquiryStatus('STATUS: Channel acknowledged.', 'emerald')
    inquiryForm.reset()
  } catch (err) {
    setInquiryStatus(`STATUS: Transmission failed — ${err.message}.`, 'rose')
  } finally {
    inquirySubmit.disabled = false
    if (inquirySubmitLabel) inquirySubmitLabel.textContent = 'SUBMIT_DATA'
  }
}
if (inquiryForm) inquiryForm.addEventListener('submit', onInquirySubmit)

// Dynamic shrinking header — toggle .is-scrolled past 50px scroll.
// Uses a passive scroll listener and an internal flag so we only touch
// classList when the scrolled state actually flips, not on every frame.
const siteNav = document.getElementById('site-nav')
if (siteNav) {
  let isScrolled = false
  const updateNavScrollState = () => {
    const scrolled = window.scrollY > 50
    if (scrolled !== isScrolled) {
      isScrolled = scrolled
      siteNav.classList.toggle('is-scrolled', scrolled)
    }
  }
  window.addEventListener('scroll', updateNavScrollState, { passive: true })
  updateNavScrollState()
}

// Interactive module showcase — converts the CSS marquee into a JS-driven
// scroll container so the user can grab/flick/wheel through the 20 modules,
// with native scroll-snap centering each card when interaction settles.
// Auto-scroll resumes whenever the pointer leaves the strip.
const showcase = document.querySelector('.app-showcase')
const showcaseTrack = document.querySelector('.app-showcase-track')
if (showcase && showcaseTrack) {
  showcaseTrack.innerHTML = SHOWCASE_MODULES.map(renderShowcaseTile).join('')
  // Triple-buffer: render 3 identical copies of the tile set. The user always
  // lives in the middle copy; when scrollLeft crosses into copy A (left) or
  // copy C (right) we silently teleport them back into copy B. This makes the
  // gallery infinite in BOTH directions — no dead-end on a hard left flick.
  const originals = Array.from(showcaseTrack.children)
  const secondSetFirstTile = originals[0].cloneNode(true)
  secondSetFirstTile.setAttribute('aria-hidden', 'true')
  showcaseTrack.appendChild(secondSetFirstTile)
  for (let i = 1; i < originals.length; i++) {
    const c = originals[i].cloneNode(true)
    c.setAttribute('aria-hidden', 'true')
    showcaseTrack.appendChild(c)
  }
  originals.forEach((node) => {
    const c = node.cloneNode(true)
    c.setAttribute('aria-hidden', 'true')
    showcaseTrack.appendChild(c)
  })

  const AUTO_SPEED_PX_PER_SEC = 40
  const KEY_STEP_PX = 280 // tile width (256) + gap (24) — one card per arrow press
  let isHovering = false
  let isDragging = false
  let dragStartX = 0
  let dragStartScroll = 0
  let lastTs = 0
  let rafId = 0
  // Stride = distance from the first tile of copy B to the first tile of copy C.
  // Measuring the live DOM avoids math errors from flex `gap` (which sits both
  // inside each copy and between copies). scrollWidth/3 would be off by ~16px
  // on a 60-tile track and the wrap would visibly jump.
  const singleSetWidth = secondSetFirstTile.offsetLeft - originals[0].offsetLeft
  // Center the viewport in copy B so the user has equal infinite headroom in
  // either direction. Runs synchronously before paint (equivalent of React's
  // useLayoutEffect — no visible "from-zero" flash).
  showcase.scrollLeft = singleSetWidth
  let isWrapping = false // re-entry guard for the scroll-triggered wrap

  // Snap fights per-frame scrollLeft writes, so we disable it during the
  // autonomous loop and re-engage it the moment the user takes over.
  const engageSnap = () => { showcase.style.scrollSnapType = 'x mandatory' }
  const disengageSnap = () => { showcase.style.scrollSnapType = 'none' }
  disengageSnap()

  const onEnter = () => { isHovering = true; engageSnap() }
  const onLeave = () => { isHovering = false; if (!isDragging) disengageSnap() }
  const onDown = (e) => {
    isDragging = true
    dragStartX = e.pageX
    dragStartScroll = showcase.scrollLeft
    showcase.style.scrollSnapType = 'none'
    e.preventDefault()
  }
  const onMove = (e) => {
    if (!isDragging) return
    showcase.scrollLeft = dragStartScroll - (e.pageX - dragStartX)
  }
  const onUp = () => {
    if (!isDragging) return
    isDragging = false
    if (isHovering) engageSnap()
    else disengageSnap()
  }
  const onWheel = (e) => {
    if (!isHovering) return
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault()
      showcase.scrollLeft += e.deltaY
    }
  }
  // Keyboard navigation — arrow keys step one card; Home/End jump to ends.
  // Engaging snap before scrollBy lets the browser snap to the nearest card.
  const onKey = (e) => {
    let handled = true
    engageSnap()
    if (e.key === 'ArrowRight') showcase.scrollBy({ left: KEY_STEP_PX, behavior: 'smooth' })
    else if (e.key === 'ArrowLeft') showcase.scrollBy({ left: -KEY_STEP_PX, behavior: 'smooth' })
    // Home/End jump within the current (center) copy so the user can quickly
    // reach the first / last module without leaving the middle buffer.
    else if (e.key === 'Home') showcase.scrollTo({ left: singleSetWidth, behavior: 'smooth' })
    else if (e.key === 'End') showcase.scrollTo({ left: singleSetWidth * 2 - KEY_STEP_PX, behavior: 'smooth' })
    else handled = false
    if (handled) {
      e.preventDefault()
      // Treat keyboard interaction like hover — pause autonomous drift until blur.
      isHovering = true
    }
  }
  const onBlur = () => { isHovering = false; disengageSnap() }
  const onFocus = () => { isHovering = true; engageSnap() }
  // Bi-directional infinite wrap. scrollLeft writes inside this handler must
  // not re-trigger the wrap path, hence the isWrapping guard. We also force
  // snap OFF for the assignment frame so scroll-snap doesn't fight the
  // teleport, and restore it afterwards if the user was interacting.
  const onScroll = () => {
    if (isWrapping) return
    if (showcase.scrollLeft <= 0) {
      isWrapping = true
      const prevSnap = showcase.style.scrollSnapType
      showcase.style.scrollSnapType = 'none'
      showcase.scrollLeft = showcase.scrollLeft + singleSetWidth
      showcase.style.scrollSnapType = prevSnap
      isWrapping = false
    } else if (showcase.scrollLeft >= singleSetWidth * 2) {
      isWrapping = true
      const prevSnap = showcase.style.scrollSnapType
      showcase.style.scrollSnapType = 'none'
      showcase.scrollLeft = showcase.scrollLeft - singleSetWidth
      showcase.style.scrollSnapType = prevSnap
      isWrapping = false
    }
  }

  showcase.addEventListener('mouseenter', onEnter)
  showcase.addEventListener('mouseleave', onLeave)
  showcase.addEventListener('mousedown', onDown)
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
  showcase.addEventListener('wheel', onWheel, { passive: false })
  showcase.addEventListener('keydown', onKey)
  showcase.addEventListener('focus', onFocus)
  showcase.addEventListener('blur', onBlur)
  showcase.addEventListener('scroll', onScroll, { passive: true })

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  // Auto-scroll loop. Wrap logic lives in onScroll, so we just advance
  // scrollLeft and let the boundary handler teleport when we cross.
  const step = (ts) => {
    if (!lastTs) lastTs = ts
    const dt = ts - lastTs
    lastTs = ts
    if (!isHovering && !isDragging && !prefersReducedMotion) {
      showcase.scrollLeft += (AUTO_SPEED_PX_PER_SEC * dt) / 1000
    }
    rafId = requestAnimationFrame(step)
  }
  rafId = requestAnimationFrame(step)

  // Vite HMR cleanup — without this the rAF loop and all listeners stack on
  // every hot reload during development, causing CPU drift and duplicate
  // handlers. No-op in production builds.
  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      cancelAnimationFrame(rafId)
      showcase.removeEventListener('mouseenter', onEnter)
      showcase.removeEventListener('mouseleave', onLeave)
      showcase.removeEventListener('mousedown', onDown)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      showcase.removeEventListener('wheel', onWheel)
      showcase.removeEventListener('keydown', onKey)
      showcase.removeEventListener('focus', onFocus)
      showcase.removeEventListener('blur', onBlur)
      showcase.removeEventListener('scroll', onScroll)
      if (inquiryForm) inquiryForm.removeEventListener('submit', onInquirySubmit)
    })
  }
}
