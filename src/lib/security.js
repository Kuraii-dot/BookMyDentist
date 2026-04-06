// ── Rate Limiter (client-side, per action) ────────────────────────────────────
// Stores attempt timestamps in sessionStorage per key
const RATE_LIMITS = {
  contact_form:    { max: 3,  windowMs: 15 * 60 * 1000 }, // 3 per 15 min
  login:           { max: 5,  windowMs: 10 * 60 * 1000 }, // 5 per 10 min
  register:        { max: 3,  windowMs: 60 * 60 * 1000 }, // 3 per hour
  booking:         { max: 5,  windowMs: 10 * 60 * 1000 }, // 5 per 10 min
  review:          { max: 5,  windowMs: 60 * 60 * 1000 }, // 5 per hour
  resend_email:    { max: 3,  windowMs: 15 * 60 * 1000 }, // 3 per 15 min
  image_upload:    { max: 10, windowMs: 10 * 60 * 1000 }, // 10 per 10 min
}

export function checkRateLimit(action) {
  const config = RATE_LIMITS[action]
  if (!config) return { allowed: true }

  const key = `rl_${action}`
  const now = Date.now()
  let attempts = []

  try {
    attempts = JSON.parse(sessionStorage.getItem(key) || '[]')
  } catch {
    attempts = []
  }

  // Filter out old attempts outside the window
  attempts = attempts.filter(ts => now - ts < config.windowMs)

  if (attempts.length >= config.max) {
    const oldestAttempt = attempts[0]
    const resetIn = Math.ceil((oldestAttempt + config.windowMs - now) / 1000 / 60)
    return {
      allowed: false,
      message: `Too many attempts. Please wait ${resetIn} minute${resetIn !== 1 ? 's' : ''} before trying again.`,
      resetIn,
    }
  }

  attempts.push(now)
  try {
    sessionStorage.setItem(key, JSON.stringify(attempts))
  } catch {
    // sessionStorage full — ignore silently
  }

  return { allowed: true, remaining: config.max - attempts.length }
}

export function resetRateLimit(action) {
  try {
    sessionStorage.removeItem(`rl_${action}`)
  } catch {
    // ignore
  }
}

// ── Input Sanitization ────────────────────────────────────────────────────────
// Strip HTML tags and dangerous characters
export function sanitizeText(input, maxLength = 1000) {
  if (!input || typeof input !== 'string') return ''
  return input
    .replace(/<[^>]*>/g, '')           // strip HTML tags
    .replace(/javascript:/gi, '')      // strip JS protocol
    .replace(/on\w+\s*=/gi, '')        // strip event handlers
    .replace(/[<>'"]/g, c => ({        // HTML-encode remaining specials
      '<': '&lt;', '>': '&gt;',
      "'": '&#39;', '"': '&quot;',
    }[c]))
    .trim()
    .slice(0, maxLength)
}

// Sanitize but allow basic punctuation (for names, addresses)
export function sanitizeName(input, maxLength = 100) {
  if (!input || typeof input !== 'string') return ''
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/[<>'"\\]/g, '')
    .trim()
    .slice(0, maxLength)
}

// Email validation
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/
  return emailRegex.test(email.trim()) && email.length <= 254
}

// Philippine phone number validation
export function isValidPHPhone(phone) {
  if (!phone) return true // optional
  const cleaned = phone.replace(/[\s\-()]/g, '')
  return /^(\+63|0)(9\d{9})$/.test(cleaned)
}

// URL validation (for image URLs)
export function isValidImageUrl(url) {
  if (!url) return true
  try {
    const u = new URL(url)
    return ['https:', 'http:'].includes(u.protocol)
  } catch {
    return false
  }
}

// Validate file upload (images)
export function validateImageFile(file) {
  if (!file) return { valid: false, error: 'No file selected' }

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  const MAX_SIZE_MB = 5

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, WebP, or GIF images are allowed' }
  }

  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return { valid: false, error: `Image must be under ${MAX_SIZE_MB}MB` }
  }

  // Check for double extensions (e.g. shell.php.jpg)
  const name = file.name.toLowerCase()
  const dangerousExtensions = ['.php', '.js', '.sh', '.exe', '.bat', '.cmd', '.py', '.rb']
  for (const ext of dangerousExtensions) {
    if (name.includes(ext)) {
      return { valid: false, error: 'Invalid file type' }
    }
  }

  return { valid: true }
}

// Validate contact form fields
export function validateContactForm(form) {
  const errors = {}

  if (!form.name?.trim()) {
    errors.name = 'Name is required'
  } else if (form.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters'
  } else if (form.name.trim().length > 100) {
    errors.name = 'Name is too long'
  }

  if (!form.email?.trim()) {
    errors.email = 'Email is required'
  } else if (!isValidEmail(form.email)) {
    errors.email = 'Please enter a valid email address'
  }

  if (!form.message?.trim()) {
    errors.message = 'Message is required'
  } else if (form.message.trim().length < 10) {
    errors.message = 'Message must be at least 10 characters'
  } else if (form.message.trim().length > 2000) {
    errors.message = 'Message is too long (max 2000 characters)'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

// Honeypot check — bots fill hidden fields, humans don't
export function isHoneypotTriggered(honeypotValue) {
  return honeypotValue !== ''
}

// Detect suspicious patterns in text (basic spam/injection detection)
export function containsSuspiciousContent(text) {
  if (!text) return false
  const suspicious = [
    /\bSELECT\b.*\bFROM\b/i,           // SQL injection
    /\bINSERT\b.*\bINTO\b/i,
    /\bDROP\b.*\bTABLE\b/i,
    /\bUNION\b.*\bSELECT\b/i,
    /<script/i,                          // XSS
    /javascript:/i,
    /vbscript:/i,
    /on(load|error|click|mouseover)\s*=/i,
    /\.\.\//,                            // Path traversal
    /\x00/,                              // Null bytes
  ]
  return suspicious.some(pattern => pattern.test(text))
}

// Throttle function for rapid repeated calls
export function throttle(fn, limitMs) {
  let lastCall = 0
  return function (...args) {
    const now = Date.now()
    if (now - lastCall < limitMs) return
    lastCall = now
    return fn.apply(this, args)
  }
}