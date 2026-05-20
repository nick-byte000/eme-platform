/**
 * Send OTP via Fast2SMS.
 * Returns { sent: true } on success, { sent: false, error } on failure.
 * If FAST2SMS_API_KEY is not set, silently skips (dev mode).
 */
async function sendOtp(phone, otp) {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) {
    // No key configured — dev mode, caller will expose otp directly
    return { sent: false, reason: 'no_key' };
  }

  try {
    const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route: 'otp',
        variables_values: String(otp),
        flash: 0,
        numbers: String(phone),
      }),
    });

    const data = await res.json();

    if (data.return === true) {
      return { sent: true };
    } else {
      console.error('[Fast2SMS] Send failed:', data);
      return { sent: false, error: data.message?.[0] || 'SMS send failed' };
    }
  } catch (err) {
    console.error('[Fast2SMS] Request error:', err.message);
    return { sent: false, error: err.message };
  }
}

module.exports = { sendOtp };
