const https = require('https');

function httpsPost(url, data, headers) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const options = {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };
    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

exports.handler = async function(event) {
  console.log('subscribe function called, method:', event.httpMethod);

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let name, email;
  try {
    const body = JSON.parse(event.body);
    name = body.name;
    email = body.email;
    console.log('Parsed body - name:', name, 'email:', email);
  } catch (e) {
    console.error('JSON parse error:', e.message);
    return { statusCode: 400, body: 'Bad request' };
  }

  if (!name || !email) {
    console.error('Missing name or email');
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing fields' }) };
  }

  // Try both possible env var names
  const RESEND_API_KEY = process.env.Rsend_API_Key || process.env.RESEND_API_KEY || process.env.rsend_api_key;
  console.log('API key present:', !!RESEND_API_KEY, 'length:', RESEND_API_KEY ? RESEND_API_KEY.length : 0);

  if (!RESEND_API_KEY) {
    console.error('No Resend API key found in environment');
    // Still return 200 so user gets redirected — we just log the failure
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true, warn: 'no_key' }) };
  }

  const sendEmail = async (to, subject, html) => {
    console.log('Sending email to:', to);
    const result = await httpsPost(
      'https://api.resend.com/emails',
      { from: 'Home Pro Group Leads <kevin@homeprogroupleads.com>', to: [to], subject, html },
      { 'Authorization': `Bearer ${RESEND_API_KEY}` }
    );
    console.log('Resend response for', to, '- status:', result.status, 'body:', result.body);
    return result;
  };

  try {
    const r1 = await sendEmail(
      email,
      'Your First Coast Lead Gen Playbook is here',
      `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a2a3a">
        <div style="background:#0B1F3A;padding:32px 36px;border-radius:10px 10px 0 0">
          <p style="font-weight:800;font-size:18px;color:#fff;margin:0">Home Pro <span style="color:#E8A020">· Group Leads</span></p>
        </div>
        <div style="background:#F8F7F4;padding:36px;border-radius:0 0 10px 10px">
          <p style="font-size:16px;margin:0 0 12px">Hey ${name} 👋</p>
          <p style="font-size:15px;color:#64748B;line-height:1.7;margin:0 0 24px">
            Thanks for grabbing the First Coast Lead Gen Playbook. Click below to view your copy:
          </p>
          <a href="https://effervescent-fudge-47f076.netlify.app/playbook-download"
             style="display:inline-block;background:#E8A020;color:#0B1F3A;font-weight:700;font-size:15px;padding:14px 28px;border-radius:6px;text-decoration:none;margin-bottom:28px">
            View &amp; Download the Playbook →
          </a>
          <p style="font-size:14px;color:#64748B;line-height:1.7;margin:0 0 24px">
            Inside you'll find the full First Coast Facebook group map (70+ groups, 200K+ homeowners),
            the posting strategy that generates exclusive leads, and the 15-minute lead response system.
          </p>
          <p style="font-size:14px;color:#64748B;margin:0 0 28px">Any questions — just reply to this email.</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 20px">
          <p style="font-size:12px;color:#94a3b8;margin:0">Home Pro Group Leads · (850) 778-3389 · homeprogroupleads.com</p>
        </div>
      </div>`
    );

    const r2 = await sendEmail(
      'kevin@homeprogroupleads.com',
      `New playbook lead: ${name}`,
      `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#0B1F3A;margin:0 0 16px">New playbook signup</h2>
        <p style="margin:0 0 8px"><strong>Name:</strong> ${name}</p>
        <p style="margin:0 0 8px"><strong>Email:</strong> ${email}</p>
        <p style="color:#64748b;font-size:13px;margin-top:16px">
          Submitted ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET
        </p>
      </div>`
    );

    console.log('Both emails attempted. r1 status:', r1.status, 'r2 status:', r2.status);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true })
    };

  } catch (err) {
    console.error('Subscribe error:', err.message, err.stack);
    return {
      statusCode: 200, // still 200 so user gets redirected
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, warn: 'email_error' })
    };
  }
};
