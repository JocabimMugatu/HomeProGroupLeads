const https = require('https');

exports.handler = async function(event) {
  console.log('=== CALLED ===', event.httpMethod, event.body);
  
  const key = process.env.Rsend_API_Key;
  console.log('Key:', key ? key.slice(0,15) : 'NOT FOUND');
  
  let name = 'Friend', email = '';
  try { const b = JSON.parse(event.body||'{}'); name=b.name||'Friend'; email=b.email||''; } catch(e) {}
  
  if (!email || !key) {
    console.log('Missing email or key — email:', email, 'key:', !!key);
    return { statusCode: 200, body: JSON.stringify({ok:true}) };
  }

  const send = (to, subject, html) => new Promise((resolve, reject) => {
    const payload = JSON.stringify({ from:'Kevin at Home Pro Group Leads <kevin@homeprogroupleads.com>', to:[to], subject, html });
    const req = https.request({ hostname:'api.resend.com', path:'/emails', method:'POST',
      headers:{ 'Authorization':'Bearer '+key, 'Content-Type':'application/json', 'Content-Length':Buffer.byteLength(payload) }
    }, res => { let b=''; res.on('data',c=>b+=c); res.on('end',()=>{ console.log('Resend',to,res.statusCode,b); resolve(); }); });
    req.on('error', e => { console.log('Error:', e.message); resolve(); });
    req.write(payload); req.end();
  });

  await send(email, 'Your First Coast Lead Gen Playbook',
    '<p>Hey '+name+'! <a href="https://effervescent-fudge-47f076.netlify.app/playbook-download">Click here</a> to view your playbook.</p><p>— Kevin</p>'
  );
  await send('kevin@homeprogroupleads.com', 'New lead: '+name,
    '<p><b>Name:</b> '+name+'<br><b>Email:</b> '+email+'</p>'
  );

  return { statusCode: 200, headers: {'Content-Type':'application/json'}, body: JSON.stringify({ok:true}) };
};
