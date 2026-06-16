export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  const { name, email } = body;
  if (!name || !email) {
    return new Response(JSON.stringify({ error: 'Missing name or email' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  try {
    // 1. Send the playbook to the subscriber
    const toSubscriber = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Home Pro Group Leads <kevin@homeprogroupleads.com>',
        to: [email],
        subject: 'Your First Coast Lead Gen Playbook is here',
        html: `
          <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;color:#1a2a3a">
            <div style="background:#0B1F3A;padding:32px 36px;border-radius:10px 10px 0 0">
              <p style="font-family:sans-serif;font-weight:800;font-size:18px;color:#fff;margin:0">
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
              <p style="font-size:14px;color:#64748B;line-height:1.7;margin:0 0 8px">
                Inside you'll find the full First Coast Facebook group map (70+ groups, 200K+ homeowners), the posting strategy that generates exclusive leads, and the 15-minute lead response system.
              </p>
              <p style="font-size:14px;color:#64748B;margin:0 0 28px">
                Any questions — just reply to this email.
              </p>
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 20px">
              <p style="font-size:12px;color:#94a3b8;margin:0">
                Home Pro Group Leads · (850) 778-3389 · homeprogroupleads.com<br>
                Exclusive lead generation for First Coast home service businesses.
              </p>
            </div>
          </div>
        `
      })
    });

    // 2. Notify Kevin
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Home Pro Group Leads <kevin@homeprogroupleads.com>',
        to: ['kevin@homeprogroupleads.com'],
        subject: `🎯 New playbook lead: ${name}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
            <h2 style="color:#0B1F3A;margin:0 0 16px">New playbook signup</h2>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:10px;background:#f8f7f4;font-weight:600;width:80px">Name</td><td style="padding:10px;border-bottom:1px solid #e2e8f0">${name}</td></tr>
              <tr><td style="padding:10px;background:#f8f7f4;font-weight:600">Email</td><td style="padding:10px">${email}</td></tr>
            </table>
            <p style="margin:16px 0 0;color:#64748b;font-size:13px">Submitted at ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET</p>
          </div>
        `
      })
    });

    if (!toSubscriber.ok) {
      const err = await toSubscriber.json();
      console.error('Resend error:', err);
      return new Response(JSON.stringify({ error: 'Email send failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Function error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config = { path: '/api/subscribe' };
