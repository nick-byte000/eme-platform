const axios = require('axios');

async function sendOtp(phone, otp) {
  // 2Factor (primary)
  if (process.env.TWOFACTOR_API_KEY) {
    return sendVia2Factor(phone, otp);
  }
  // MSG91 fallback
  if (process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID) {
    return sendViaMSG91(phone, otp);
  }
  // Fast2SMS fallback
  if (process.env.FAST2SMS_API_KEY) {
    return sendViaFast2SMS(phone, otp);
  }
  console.log('[SMS] No SMS provider configured — dev mode');
  return { sent: false, reason: 'no_key' };
}

async function sendVia2Factor(phone, otp) {
  console.log(`[SMS] Sending OTP to ${phone} via 2Factor...`);
  try {
    const { data } = await axios.get(
      `https://2factor.in/API/V1/${process.env.TWOFACTOR_API_KEY}/SMS/${phone}/${otp}`
    );
    console.log('[SMS] 2Factor response:', JSON.stringify(data));
    if (data.Status === 'Success') return { sent: true };
    console.error('[SMS] 2Factor failed:', data);
    return { sent: false, error: data.Details || '2Factor send failed' };
  } catch (err) {
    console.error('[SMS] 2Factor error:', err.response?.data || err.message);
    return { sent: false, error: err.message };
  }
}

async function sendViaMSG91(phone, otp) {
  console.log(`[SMS] Sending OTP to ${phone} via MSG91...`);
  try {
    const { data } = await axios.post(
      'https://api.msg91.com/api/v5/otp',
      {
        template_id: process.env.MSG91_TEMPLATE_ID,
        mobile: `91${phone}`,
        otp: String(otp),
      },
      {
        headers: {
          authkey: process.env.MSG91_AUTH_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('[SMS] MSG91 response:', JSON.stringify(data));
    if (data.type === 'success') return { sent: true };
    console.error('[SMS] MSG91 failed:', data);
    return { sent: false, error: data.message || 'MSG91 send failed' };
  } catch (err) {
    console.error('[SMS] MSG91 error:', err.response?.data || err.message);
    return { sent: false, error: err.message };
  }
}

async function sendViaFast2SMS(phone, otp) {
  console.log(`[SMS] Sending OTP to ${phone} via Fast2SMS...`);
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
          authorization: process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('[SMS] Fast2SMS response:', JSON.stringify(data));
    if (data.return === true) return { sent: true };
    console.error('[SMS] Fast2SMS failed:', data);
    return { sent: false, error: data.message?.[0] || 'SMS send failed' };
  } catch (err) {
    console.error('[SMS] Fast2SMS error:', err.response?.data || err.message);
    return { sent: false, error: err.message };
  }
}

module.exports = { sendOtp };
