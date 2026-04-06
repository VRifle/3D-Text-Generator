export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // API-Endpunkt abfangen
    if (url.pathname === '/api/send-stl' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { filename, base64Data, text1, text2 } = body;

        if (!env.RESEND_API_KEY) {
          return new Response(JSON.stringify({ error: 'API Key fehlt in Cloudflare (RESEND_API_KEY)' }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Direkter API-Aufruf an Resend ohne SDK
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'STL Export <onboarding@resend.dev>',
            to: ['sk.vrifle@gmail.com'],
            subject: `Neuer STL Export (ZIP): ${text1} / ${text2}`,
            html: `<h2>Neuer 3D-Druck Auftrag (Komprimiert)</h2><p>Ebene 1: ${text1}<br>Ebene 2: ${text2}</p><p>Die STL-Datei befindet sich im angehängten ZIP-Archiv.</p>`,
            attachments: [
              {
                filename: filename,
                content: base64Data, // Resend akzeptiert Base64 direkt als String
              },
            ],
          }),
        });

        const result = await resendResponse.json();
        
        if (!resendResponse.ok) {
          return new Response(JSON.stringify({ error: result.message || 'Resend API Fehler' }), { 
            status: resendResponse.status,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({ success: true }), { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      } catch (err) {
        return new Response(JSON.stringify({ error: 'Server Fehler: ' + err.message }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Alles andere: Normale Website ausliefern
    return env.ASSETS.fetch(request);
  },
};
