import nodemailer from 'nodemailer'

let transport

function getTransport() {
  if (transport) {
    return transport
  }

  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    const error = new Error('Email service is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS.')
    error.statusCode = 500
    throw error
  }

  transport = nodemailer.createTransport({
    host,
    port,
    secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    auth: {
      user,
      pass,
    },
  })

  return transport
}

export async function sendRegistrationOtpEmail({ to, code, expiryMinutes }) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER
  const subject = "Chef's Bud verification code"
  const text = `Your Chef's Bud verification code is ${code}. This code expires in ${expiryMinutes} minutes.`
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
      <h2 style="margin-bottom: 8px;">Verify your email</h2>
      <p style="margin: 0 0 12px;">Use this code to verify your Chef's Bud account:</p>
      <p style="font-size: 24px; font-weight: 700; letter-spacing: 4px; margin: 8px 0 16px;">${code}</p>
      <p style="margin: 0;">This code expires in ${expiryMinutes} minutes.</p>
      <p style="margin-top: 12px; font-size: 12px; color: #475569;">If you did not request this, you can ignore this email.</p>
    </div>
  `

  await getTransport().sendMail({
    from,
    to,
    subject,
    text,
    html,
  })
}

export async function sendBillingStatusEmail({ to, name, status, planType, graceEndsAt, currentPeriodEnd }) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER

  const statusLabels = {
    active: 'Active',
    grace_period: 'Grace Period',
    past_due: 'Payment Pending',
    cancelled: 'Cancelled',
  }

  const displayStatus = statusLabels[status] || String(status || 'Updated')
  const expiryDate = graceEndsAt || currentPeriodEnd
  const expiryText = expiryDate ? new Date(expiryDate).toLocaleString('en-IN', { hour12: true }) : 'N/A'
  const planText = planType === 'hybrid' ? 'Hybrid (Auto-Pay)' : 'Lifetime'
  const subject = `Chef's Bud billing update: ${displayStatus}`

  const text = [
    `Hi ${name || 'there'},`,
    '',
    `Your billing status is now: ${displayStatus}`,
    `Plan: ${planText}`,
    `Access valid until: ${expiryText}`,
    '',
    'If this change was unexpected, please contact support immediately.',
  ].join('\n')

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
      <h2 style="margin-bottom: 8px;">Billing status updated</h2>
      <p style="margin: 0 0 10px;">Hi ${name || 'there'},</p>
      <p style="margin: 0 0 8px;">Your Chef's Bud billing status is now:</p>
      <p style="margin: 0 0 12px; font-size: 20px; font-weight: 700;">${displayStatus}</p>
      <p style="margin: 0 0 6px;">Plan: <strong>${planText}</strong></p>
      <p style="margin: 0 0 6px;">Access valid until: <strong>${expiryText}</strong></p>
      <p style="margin-top: 12px; font-size: 12px; color: #475569;">
        If this change was unexpected, contact support and update your payment method.
      </p>
    </div>
  `

  await getTransport().sendMail({
    from,
    to,
    subject,
    text,
    html,
  })
}
