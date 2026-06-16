// Nodemailer / SMS stub
// In production: replace sendSMSAlert with Twilio/MSG91 API call

export async function sendSMSAlert(phone: string, message: string): Promise<void> {
  const provider = process.env.SMS_PROVIDER ?? 'stub';
  const apiKey = process.env.SMS_API_KEY;
  const senderId = process.env.SMS_SENDER_ID ?? 'DELHGOV';

  if (!apiKey || provider === 'stub') {
    // Development stub — just log it
    console.log(`[SMS STUB] To: ${phone}\nMessage: ${message}`);
    return;
  }

  if (provider === 'msg91') {
    try {
      await fetch('https://api.msg91.com/api/v5/otp', {
        method: 'POST',
        headers: {
          'authkey': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: process.env.MSG91_TEMPLATE_ID ?? '',
          mobile: phone.replace('+', ''),
          sender: senderId,
          message,
        }),
        signal: AbortSignal.timeout(8000),
      });
    } catch (err) {
      console.error('[SMS] MSG91 send failed:', err);
    }
    return;
  }

  if (provider === 'twilio') {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM_NUMBER;

    if (!accountSid || !authToken || !from) {
      console.warn('[SMS] Twilio credentials incomplete.');
      return;
    }

    try {
      const body = new URLSearchParams({ To: phone, From: from, Body: message });
      await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
        signal: AbortSignal.timeout(8000),
      });
    } catch (err) {
      console.error('[SMS] Twilio send failed:', err);
    }
  }
}

export async function sendEmailAlert(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  // Stub — wire up nodemailer in production
  console.log(`[EMAIL STUB] To: ${to}\nSubject: ${subject}\n${html}`);
}
