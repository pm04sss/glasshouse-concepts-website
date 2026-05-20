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

let activeRole = 'USER'

const roleButtons = document.querySelectorAll('.role-btn')
const activeRoleLabel = document.getElementById('active-role')
const featuresList = document.getElementById('role-features')

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
}

roleButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    activeRole = btn.dataset.role
    renderAccessMatrix()
  })
})

renderAccessMatrix()
