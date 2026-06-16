exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let name, email;
  try {
    const body = JSON.parse(event.body);
    name = body.name;
    email = body.email;
  } catch {
    return { statusCode: 400, body: 'Bad request' };
  }

  if (!name || !email) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing fields' }) };
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  const sendEmail = async (to, subject, html) => {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Home Pro Group Leads <kevin@homeprogroupleads.com>',
        to: [to],
        subject,
        html
      })
    });
    return res;
  };

  try {
    // Email to subscriber
    await sendEmail(
      email,
      'Your First Coast Lead Gen Playbook is here',
      `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a2a3a">
        <div style="background:#0B1F3A;padding:32px 36px;border-radius:10px 10px 0 0">
          <p style="font-weight:800;font-size:18px;color:#fff;margin:0">
            Home Pro <span style="color:#E8A020">· Group Leads</span>
          </p>
        </div>
        <div style="background:#F8F7F4;padding:36px;border-radius:0 0 10px 10px">
          <p style="font-size:16px;margin:0 0 12px">Hey ${name} 👋</p>
          <p style="font-size:15px;color:#64748B;line-height:1.7;margin:0 0 24px">
            Thanks for grabbing the First Coast Lead Gen Playbook. Click below to download your copy:
          </p>
          <a href="https://homeprogroupleads.com/playbook.pdf"
             style="display:inline-block;background:#E8A020;color:#0B1F3A;font-weight:700;font-size:15px;padding:14px 28px;border-radius:6px;text-decoration:none;margin-bottom:28px">
            ↓ Download the Playbook PDF
          </a>
          <p style="font-size:14px;color:#64748B;line-height:1.7;margin:0 0 24px">
            Inside you'll find the full First Coast Facebook group map (70+ groups, 200K+ homeowners),
            the posting strategy that generates exclusive leads, and the 15-minute lead response system.
          </p>
          <p style="font-size:14px;color:#64748B;margin:0 0 28px">
            Any questions — just reply to this email.
          </p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 20px">
          <p style="font-size:12px;color:#94a3b8;margin:0">
            Home Pro Group Leads · (850) 778-3389 · homeprogroupleads.com
          </p>
        </div>
      </div>`
    );

    // Notification to Kevin
    await sendEmail(
      'kevin@homeprogroupleads.com',
      `🎯 New playbook lead: ${name}`,
      `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#0B1F3A;margin:0 0 16px">New playbook signup</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p style="color:#64748b;font-size:13px;margin-top:16px">
          Submitted ${new Date().toLocaleString('en-US',{timeZone:'America/New_York'})} ET
        </p>
      </div>`
    );

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true })
    };

  } catch (err) {
    console.error('Subscribe error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error' })
    };
  }
};
