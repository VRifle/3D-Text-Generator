import { Resend } from 'resend';

export const onRequestPost = async (context) => {
  const { request, env } = context;

  // 1. API Key aus den Bindings (env) holen
  const resend = new Resend(env.RESEND_API_KEY);
  const RECIPIENT_EMAIL = env.RECIPIENT_EMAIL || 'vrifleveo3@gmail.com';

  try {
    const { filename, base64Data, text1, text2 } = await request.json();

    if (!base64Data) {
      return new Response(JSON.stringify({ error: 'Keine Daten empfangen' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // STL-Daten in Buffer umwandeln (Cloudflare kompatibel)
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Email senden via Resend
    const { data, error } = await resend.emails.send({
      from: 'STL Export <onboarding@resend.dev>',
      to: [RECIPIENT_EMAIL],
      subject: `Neuer STL Export: ${text1} / ${text2}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #4f46e5;">Neuer 3D-Druck Auftrag (via Cloudflare)</h2>
          <p>Ein neues Modell wurde generiert:</p>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Ebene 1:</strong> ${text1}</li>
            <li><strong>Ebene 2:</strong> ${text2}</li>
            <li><strong>Dateiname:</strong> ${filename}</li>
          </ul>
        </div>
      `,
      attachments: [
        {
          filename: filename,
          content: bytes,
        },
      ],
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Server Fehler' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
