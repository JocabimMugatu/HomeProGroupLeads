const https = require('https');

exports.handler = async function(event) {
  console.log('=== SUBSCRIBE CALLED ===', event.httpMethod);

  const key = process.env.Rsend_API_Key;
  console.log('Key found:', !!key);

  let name = 'Friend', email = '';
  try {
    const b = JSON.parse(event.body || '{}');
    name = b.name || 'Friend';
    email = b.email || '';
  } catch(e) { console.log('Parse error:', e.message); }

  console.log('name:', name, '| email:', email);

  if (!email || !key) {
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  }

  const send = (to, subject, html) => new Promise((resolve) => {
    const payload = JSON.stringify({
      from: 'Kevin Newman <kevin@homeprogroupleads.com>',
      to: [to],
      reply_to: 'kevin@homeprogroupleads.com',
      subject,
      html
    });
    const req = https.request({
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => { console.log('Resend', to, res.statusCode, b); resolve(); });
    });
    req.on('error', e => { console.log('Request error:', e.message); resolve(); });
    req.write(payload);
    req.end();
  });

  // Email to subscriber
  await send(
    email,
    'Your First Coast Lead Gen Playbook is inside',
    `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:32px 16px">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">

      <!-- Header -->
      <tr><td style="background:#0B1F3A;border-radius:10px 10px 0 0;padding:28px 36px">
        <p style="margin:0;font-size:19px;font-weight:800;color:#ffffff">
          Home Pro <span style="color:#E8A020">· Group Leads</span>
        </p>
      </td></tr>

      <!-- Body -->
      <tr><td style="background:#ffffff;padding:36px;border-radius:0 0 10px 10px;color:#1a2a3a">
        <p style="font-size:17px;margin:0 0 20px;color:#1a2a3a">Hey ${name}!</p>

        <p style="font-size:15px;line-height:1.75;color:#4a5568;margin:0 0 20px">
          Thanks so much for requesting the playbook — I'm genuinely excited to get your feedback on it and hear what you think about the Facebook group opportunity in your market.
        </p>

        <p style="font-size:15px;line-height:1.75;color:#4a5568;margin:0 0 28px">
          Once you've had a chance to look it over, I'd love to connect and show you exactly how this could work for your business specifically — which groups in your area are most active, what kinds of posts perform best in your trade, and what realistic lead volume looks like. No pitch, just a real conversation.
        </p>

        <!-- CTA Button -->
        <table cellpadding="0" cellspacing="0" style="margin:0 0 32px">
          <tr><td style="background:#E8A020;border-radius:6px">
            <a href="https://effervescent-fudge-47f076.netlify.app/playbook-download"
               style="display:inline-block;padding:15px 32px;font-size:15px;font-weight:700;color:#0B1F3A;text-decoration:none">
              View &amp; Download the Playbook →
            </a>
          </td></tr>
        </table>

        <p style="font-size:14px;line-height:1.7;color:#64748b;margin:0 0 8px">
          Inside you'll find the full First Coast Facebook group map (70+ groups, 200,000+ homeowners), the exact posting strategy we use, and the 15-minute lead response system.
        </p>

        <p style="font-size:14px;color:#64748b;margin:0 0 32px">
          Just reply to this email anytime — I read every one personally.
        </p>

        <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 24px">

        <p style="font-size:13px;color:#94a3b8;margin:0;line-height:1.6">
          Kevin Newman<br>
          Home Pro Group Leads<br>
          (850) 778-3389 · homeprogroupleads.com
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
  );

  // Notification to Kevin
  await send(
    'kevin@homeprogroupleads.com',
    '🎯 New playbook lead: ' + name,
    `<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:28px;color:#1a2a3a">
  <div style="background:#0B1F3A;border-radius:8px;padding:20px 24px;margin-bottom:24px">
    <p style="margin:0;font-size:16px;font-weight:700;color:#E8A020">New Playbook Signup</p>
  </div>
  <table cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
    <tr style="background:#f8f7f4">
      <td style="padding:14px 18px;font-weight:600;font-size:14px;width:80px;border-bottom:1px solid #e2e8f0">Name</td>
      <td style="padding:14px 18px;font-size:14px;border-bottom:1px solid #e2e8f0">${name}</td>
    </tr>
    <tr>
      <td style="padding:14px 18px;font-weight:600;font-size:14px;background:#f8f7f4">Email</td>
      <td style="padding:14px 18px;font-size:14px"><a href="mailto:${email}" style="color:#E8A020">${email}</a></td>
    </tr>
  </table>
  <p style="color:#94a3b8;font-size:12px;margin-top:16px">
    ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'full', timeStyle: 'short' })} ET
  </p>
</body>
</html>`
  );

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ ok: true })
  };
};
