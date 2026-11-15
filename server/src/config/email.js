const nodemailer = require('nodemailer');
require('dotenv').config();
const isSmtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
const transporter = isSmtpConfigured ? nodemailer.createTransport({
  host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT || 587) === 465,
  requireTLS: Number(process.env.SMTP_PORT || 587) !== 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000,
}) : null;
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function sendEmail({to, subject, text}) {
  if (!transporter) return {success:false, code:'SMTP_NOT_CONFIGURED'};
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, text,
      html: '<div style="font-family:Arial,sans-serif;max-width:600px;line-height:1.6"><h2>Faculty Resource Reservation</h2><p>' + String(text).split('\n').map(line => {
        const safe = escapeHtml(line);
        return /^https?:\/\/\S+$/.test(line) ? '<a href="' + safe + '">' + safe + '</a>' : safe;
      }).join('<br>') + '</p></div>',
    });
    return {success: Boolean(info.accepted?.length), messageId:info.messageId, code:info.accepted?.length ? undefined : 'RECIPIENT_REJECTED'};
  } catch (error) { return {success:false, code: error.code || 'SMTP_ERROR'}; }
}
async function verifyEmailConnection() {
  if (!transporter) throw new Error('Set SMTP_HOST, SMTP_USER and SMTP_PASS in server/.env');
  await transporter.verify();
}
// Kept for diagnostic callers; application messages use the persistent outbox.
const sendPasswordResetEmail = (to, url) => sendEmail({to,subject:'Reset your password',text:'Choose a new password using this link (valid for one hour):\n'+url+'\nIf you did not request this, ignore this email.'});
module.exports = {sendEmail, sendPasswordResetEmail, verifyEmailConnection, isSmtpConfigured, escapeHtml};
