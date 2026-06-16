const https = require('https');

function post(hostname, path, data, headers) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = https.request({
      hostname,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...headers
      }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        console.log(`POST https://${hostname}${path} => ${res.statusCode}: ${body}`);
        resolve({ status: res.statusCode, body });
      });
    });
    req.on('error', (e) => {
      console.error(`Request error for ${hostname}${path}:`, e.message);
      reject(e);
    });
    req.write(payload);
    req.end();
  });
}

exports.handler = async function(event) {
  console.log('Function invoked. Method:', event.httpMethod);

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let name, email;
  try {
    const body = JSON.parse(event.body);
    name = (body.name || '').trim();
    email = (body.email || '').trim();
    console.log('name:', name, '| email:', email);
  } catch (e) {
    console.error('Parse error:', e.message);
    return { statusCode: 400, body: JSON.stringify({ error: 'Bad request' }) };
  }

  if (!name || !email) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing fields' }) };
  }

  // Check all possible env var names
  const key = process.env.Rsend_API_Key
           || process.env.RESEND_API_KEY
           || process.env.RESEND_API_key;

  console.log('Resend key found:', !!key, '| first 8 chars:', key ? key.slice(0,8) : 'NONE');

  if (!key) {
    console.error('FATAL: No Resend API key in environment. Available vars:', Object.keys(process.env).filter(k => k.toLowerCase().includes('resend') || k.toLowerCase().includes('rsend')));
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, warn: 'no_api_key' })
    };
  }

  const authHeader = { 'Authorization': `Bearer ${key}` };

  // Email to subscriber
  try {
    const r1 = await post('api.resend.com', '/emails', {
      from: 'Kevin at Home Pro Group Leads <kevin@homeprogroupleads.com>',
      to: [email],
      reply_to: 'kevin@homeprogroupleads.com',
      subject: 'Your First Coast Lead Gen Playbook',
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
        <div style="background:#0B1F3A;padding:28px 32px;border-radius:8px 8px 0 0">
          <p style="font-size:18px;font-weight:800;color:#fff;margin:0">Home Pro <span style="color:#E8A020">· Group Leads</span></p>
        </div>
        <div style="background:#F8F7F4;padding:32px;border-radius:0 0 8px 8px;color:#1a2a3a">
          <p style="font-size:16px;margin:0 0 16px">Hey ${name} 👋</p>
          <p style="font-size:15px;color:#64748B;line-height:1.7;margin:0 0 24px">
            Your copy of the First Coast Lead Gen Playbook is ready. Click below to view and download it:
          </p>
          <a href="https://effervescent-fudge-47f076.netlify.app/playbook-download"
             style="display:inline-block;background:#E8A020;color:#0B1F3A;font-weight:700;font-size:15px;padding:14px 28px;border-radius:6px;text-decoration:none;margin-bottom:24px">
            View &amp; Download the Playbook →
          </a>
          <p style="font-size:14px;color:#64748B;line-height:1.7;margin:0 0 16px">
            Inside: the full First Coast Facebook group map (70+ groups, 200K+ homeowners), the posting strategy, and the 15-minute lead response system.
          </p>
          <p style="font-size:14px;color:#64748B;margin:0 0 24px">Questions? Just reply to this email.</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 16px">
          <p style="font-size:12px;color:#94a3b8;margin:0">Home Pro Group Leads · (850) 778-3389 · homeprogroupleads.com</p>
        </div>
      </div>`
    }, authHeader);
    console.log('Subscriber email status:', r1.status);
  } catch(e) {
    console.error('Subscriber email failed:', e.message);
  }

  // Notification to Kevin
  try {
    const r2 = await post('api.resend.com', '/emails', {
      from: 'Home Pro Group Leads <kevin@homeprogroupleads.com>',
      to: ['kevin@homeprogroupleads.com'],
      subject: `New playbook lead: ${name}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#0B1F3A;margin:0 0 20px">New playbook signup</h2>
        <p style="margin:0 0 10px;font-size:15px"><strong>Name:</strong> ${name}</p>
        <p style="margin:0 0 10px;font-size:15px"><strong>Email:</strong> ${email}</p>
        <p style="color:#64748b;font-size:13px;margin-top:16px">
          ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'full', timeStyle: 'short' })} ET
        </p>
      </div>`
    }, authHeader);
    console.log('Kevin notification status:', r2.status);
  } catch(e) {
    console.error('Kevin notification failed:', e.message);
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ ok: true })
  };
};
