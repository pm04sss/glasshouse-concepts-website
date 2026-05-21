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
  SITE_CONTENT.capabilities.forEach((cap, i) => {
    if (numberSlots[i]) numberSlots[i].textContent = cap.number
    if (titleSlots[i]) titleSlots[i].textContent = cap.title
    if (bodySlots[i]) bodySlots[i].textContent = cap.body
  })
}

hydrateContent()

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

function tickTelemetry() {
  const latency = Math.floor(Math.random() * (MAX_MS - MIN_MS + 1)) + MIN_MS
  latencyHistory.push(latency)
  if (latencyHistory.length > HISTORY_MAX) {
    latencyHistory.shift()
  }
  const formatted = `${latency}ms`
  if (latencyEl) {
    latencyEl.textContent = formatted
  }
  if (latencyLargeEl) {
    latencyLargeEl.textContent = formatted
  }
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

let activeRole = 'USER'

const roleButtons = document.querySelectorAll('.role-btn')
const activeRoleLabel = document.getElementById('active-role')
const featuresList = document.getElementById('role-features')
const moduleGrid = document.getElementById('module-grid')

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
  if (moduleGrid) {
    const unlockedSet = new Set(ROLE_MODULES[activeRole])
    moduleGrid.innerHTML = MODULES.map((mod) => {
      const isUnlocked = unlockedSet.has(mod.id)
      const cls = isUnlocked ? 'module-cell unlocked' : 'module-cell'
      const status = isUnlocked ? 'Unlocked' : 'Locked'
      const icon = isUnlocked ? UNLOCK_ICON : LOCK_ICON
      return `<div class="${cls}"><span class="module-label">${mod.label}</span><span class="module-status flex items-center gap-1.5">${icon}${status}</span></div>`
    }).join('')
  }
}

roleButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    activeRole = btn.dataset.role
    renderAccessMatrix()
  })
})

renderAccessMatrix()

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
