import express from 'express';
import { createServer as createViteServer } from 'vite';
import { Resend } from 'resend';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resend = new Resend(process.env.RESEND_API_KEY);
const RECIPIENT_EMAIL = process.env.RECIPIENT_EMAIL || 'vrifleveo3@gmail.com';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for base64 STL files (STL can be large)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API route to send STL via Resend
  app.post('/api/send-stl', async (req, res) => {
    const { filename, base64Data, text1, text2 } = req.body;

    if (!base64Data) {
      return res.status(400).json({ error: 'No STL data provided' });
    }

    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({ error: 'Resend API Key is missing in environment' });
    }

    try {
      // The base64Data should be just the base64 string, not the data URI prefix
      const buffer = Buffer.from(base64Data, 'base64');

      const { data, error } = await resend.emails.send({
        from: 'STL Export <onboarding@resend.dev>', // Resend default for testing
        to: [RECIPIENT_EMAIL],
        subject: `Neuer STL Export: ${text1} / ${text2}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #4f46e5;">Neuer 3D-Druck Auftrag</h2>
            <p>Ein neues Modell wurde generiert:</p>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Ebene 1:</strong> ${text1}</li>
              <li><strong>Ebene 2:</strong> ${text2}</li>
              <li><strong>Dateiname:</strong> ${filename}</li>
            </ul>
            <p style="margin-top: 20px; font-size: 12px; color: #666;">Die STL-Datei befindet sich im Anhang.</p>
          </div>
        `,
        attachments: [
          {
            filename: filename,
            content: buffer,
          },
        ],
      });

      if (error) {
        console.error('Resend Error:', error);
        return res.status(400).json({ error: error.message });
      }

      res.json({ success: true, data });
    } catch (err: any) {
      console.error('Server Error:', err);
      res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
