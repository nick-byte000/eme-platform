const axios = require('axios');

async function sendOtp(phone, otp) {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) {
    console.log('[SMS] No FAST2SMS_API_KEY set — dev mode');
    return { sent: false, reason: 'no_key' };
  }

  console.log(`[SMS] Sending OTP to ${phone}...`);
  try {
    const { data } = await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      {
        route: 'otp',
        variables_values: String(otp),
        flash: 0,
        numbers: String(phone),
      },
      {
        headers: {
          authorization: apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('[SMS] Fast2SMS response:', JSON.stringify(data));

    if (data.return === true) {
      return { sent: true };
    } else {
      console.error('[SMS] Send failed:', data);
      return { sent: false, error: data.message?.[0] || 'SMS send failed' };
    }
  } catch (err) {
    console.error('[SMS] Request error:', err.response?.data || err.message);
    return { sent: false, error: err.message };
  }
}

module.exports = { sendOtp };
