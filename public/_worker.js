import { Resend } from 'resend';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Wenn die Anfrage an unsere API geht
    if (url.pathname === '/api/send-stl' && request.method === 'POST') {
      const resend = new Resend(env.RESEND_API_KEY);
      const RECIPIENT_EMAIL = env.RECIPIENT_EMAIL || 'vrifleveo3@gmail.com';

      try {
        const { filename, base64Data, text1, text2 } = await request.json();

        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const { data, error } = await resend.emails.send({
          from: 'STL Export <onboarding@resend.dev>',
          to: [RECIPIENT_EMAIL],
          subject: `Neuer STL Export: ${text1} / ${text2}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #4f46e5;">Neuer 3D-Druck Auftrag (via _worker.js)</h2>
              <p>Ein neues Modell wurde generiert:</p>
              <ul style="list-style: none; padding: 0;">
                <li><strong>Ebene 1:</strong> ${text1}</li>
                <li><strong>Ebene 2:</strong> ${text2}</li>
                <li><strong>Dateiname:</strong> ${filename}</li>
              </ul>
            </div>
          `,
          attachments: [{ filename, content: bytes }],
        });

        if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
        return new Response(JSON.stringify({ success: true, data }), { status: 200 });

      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
      }
    }

    // Ansonsten: Die normale Website ausliefern (Static Assets)
    return env.ASSETS.fetch(request);
  },
};
