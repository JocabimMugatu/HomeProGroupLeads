const https = require('https');

function resendEmail(apiKey, to, subject, html) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      from: 'Kevin at Home Pro Group Leads <kevin@homeprogroupleads.com>',
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
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

exports.handler = async function(event, context) {
  // Log EVERYTHING so we can see what's happening
  console.log('=== SUBSCRIBE FUNCTION CALLED ===');
  console.log('Method:', event.httpMethod);
  console.log('Path:', event.path);
  console.log('Body:', event.body);

  // Accept any method for debugging — we'll tighten this later
  const method = (event.httpMethod || '').toUpperCase();

  if (method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' },
      body: ''
    };
  }

  // Parse body
  let name = 'Friend';
  let email = '';
  try {
    if (event.body) {
      const b = JSON.parse(event.body);
      name = b.name || 'Friend';
      email = b.email || '';
    }
  } catch(e) {
    console.log('Body parse error:', e.message);
  }

  console.log('Parsed name:', name, '| email:', email);

  if (!email) {
    console.log('No email provided, returning 400');
    return { statusCode: 400, body: JSON.stringify({ error: 'Email required' }) };
  }

  // Find the API key
  const key = process.env.Rsend_API_Key
           || process.env.RESEND_API_KEY
           || process.env.RESEND_API_key
           || process.env.rsend_api_key;

  console.log('API key found:', !!key);
  if (key) console.log('Key starts with:', key.substring(0, 10));

  if (!key) {
    console.log('No API key — available env keys:', Object.keys(process.env).join(', '));
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'no_key' })
    };
  }

  // Send to subscriber
  try {
    const r1 = await resendEmail(key, email,
      'Your First Coast Lead Gen Playbook',
      '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">' +
      '<div style="background:#0B1F3A;padding:28px 32px;border-radius:8px 8px 0 0">' +
      '<p style="font-size:18px;font-weight:800;color:#fff;margin:0">Home Pro <span style="color:#E8A020">· Group Leads</span></p>' +
      '</div>' +
      '<div style="background:#F8F7F4;padding:32px;border-radius:0 0 8px 8px;color:#1a2a3a">' +
      '<p style="font-size:16px;margin:0 0 16px">Hey ' + name + ' 👋</p>' +
      '<p style="font-size:15px;color:#64748B;line-height:1.7;margin:0 0 24px">Your First Coast Lead Gen Playbook is ready. Click below to view and download it:</p>' +
      '<a href="https://effervescent-fudge-47f076.netlify.app/playbook-download" style="display:inline-block;background:#E8A020;color:#0B1F3A;font-weight:700;font-size:15px;padding:14px 28px;border-radius:6px;text-decoration:none;margin-bottom:24px">View &amp; Download the Playbook →</a>' +
      '<p style="font-size:14px;color:#64748B;line-height:1.7;margin:0 0 16px">Inside: 70+ local Facebook groups, 200K+ homeowners, the full posting strategy, and the 15-minute lead response system.</p>' +
      '<p style="font-size:14px;color:#64748B;margin:0 0 24px">Questions? Just reply to this email.</p>' +
      '<hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 16px">' +
      '<p style="font-size:12px;color:#94a3b8;margin:0">Home Pro Group Leads · (850) 778-3389 · homeprogroupleads.com</p>' +
      '</div></div>'
    );
    console.log('Subscriber email result:', r1.status, r1.body);
  } catch(e) {
    console.log('Subscriber email error:', e.message);
  }

  // Notify Kevin
  try {
    const r2 = await resendEmail(key, 'kevin@homeprogroupleads.com',
      'New playbook lead: ' + name,
      '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:28px">' +
      '<h2 style="color:#0B1F3A;margin:0 0 20px">New playbook signup</h2>' +
      '<p style="margin:0 0 10px;font-size:15px"><strong>Name:</strong> ' + name + '</p>' +
      '<p style="margin:0 0 10px;font-size:15px"><strong>Email:</strong> ' + email + '</p>' +
      '<p style="color:#64748b;font-size:13px;margin-top:16px">' + new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }) + ' ET</p>' +
      '</div>'
    );
    console.log('Kevin notification result:', r2.status, r2.body);
  } catch(e) {
    console.log('Kevin notification error:', e.message);
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ ok: true })
  };
};
