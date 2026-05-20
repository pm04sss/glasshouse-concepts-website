import './style.css'

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
