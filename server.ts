import express from "express";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

console.log("Server starting with NODE_ENV:", process.env.NODE_ENV);

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Request logging for API
app.use("/api", (req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", env: process.env.NODE_ENV });
});

// Google OAuth Helper
const getOAuth2Client = (config: { clientId?: string, clientSecret?: string, redirectUri?: string }) => {
  return new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUri
  );
};

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

// API Routes
app.get("/api/auth/url", (req, res) => {
  const { clientId, clientSecret, redirectUri } = req.query;
  
  try {
    if (!clientId || !clientSecret || !redirectUri) {
      return res.status(400).json({ 
        error: "Konfigurasi Google API belum lengkap di aplikasi. Silakan atur di menu Profil." 
      });
    }

    const client = getOAuth2Client({ 
      clientId: clientId as string, 
      clientSecret: clientSecret as string, 
      redirectUri: redirectUri as string 
    });

    const url = client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
      // Pass config back in state so we can use it in callback
      state: Buffer.from(JSON.stringify({ clientId, clientSecret, redirectUri })).toString('base64')
    });
    res.json({ url });
  } catch (error: any) {
    console.error("Error generating auth URL:", error);
    res.status(500).json({ error: error.message || "Gagal membuat URL autentikasi" });
  }
});

app.get("/api/auth/callback", async (req, res) => {
  const { code, state } = req.query;
  try {
    const config = JSON.parse(Buffer.from(state as string, 'base64').toString());
    const client = getOAuth2Client(config);

    const { tokens } = await client.getToken(code as string);
    // In a real app, you'd store this in a session or database
    // For this demo, we'll send it back to the client via postMessage
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', tokens: ${JSON.stringify(tokens)} }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. You can close this window.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Error exchanging code for tokens:", error);
    res.status(500).send("Authentication failed");
  }
});

app.post("/api/drive/upload", async (req, res) => {
  const { tokens, fileName, fileData, mimeType, config } = req.body;
  
  if (!tokens) return res.status(401).json({ error: "No tokens provided" });
  if (!config || !config.clientId || !config.clientSecret) {
    return res.status(400).json({ error: "Google API configuration missing" });
  }

  try {
    const client = getOAuth2Client(config);
    client.setCredentials(tokens);
    const drive = google.drive({ version: 'v3', auth: client });

    // Convert base64 to stream or buffer
    const buffer = Buffer.from(fileData.split(',')[1], 'base64');
    const { Readable } = await import('stream');
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    const folderId = config.folderId || 'root';

    const fileMetadata = {
      name: fileName,
      parents: [folderId]
    };

    const media = {
      mimeType: mimeType,
      body: stream
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink, webContentLink'
    });

    // Make file readable by anyone with the link (optional, based on user request "shortcut")
    await drive.permissions.create({
      fileId: response.data.id!,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });

    res.json(response.data);
  } catch (error: any) {
    console.error("Error uploading to Google Drive:", error);
    res.status(500).json({ error: error.message });
  }
});

// API 404 handler
app.all("/api/*", (req, res) => {
  console.log(`API 404: ${req.method} ${req.url}`);
  res.status(404).json({ error: `API route not found: ${req.url}` });
});

// Vite middleware for development
async function setupVite() {
  try {
    console.log("Setting up Vite middleware...");
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("Vite middleware attached.");
    } else {
      console.log("Serving static files from dist...");
      app.use(express.static(path.join(__dirname, "dist")));
      app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "dist", "index.html"));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error("CRITICAL ERROR DURING SERVER STARTUP:", error);
    // Still try to listen so the platform doesn't think we're dead
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running in ERROR MODE on http://0.0.0.0:${PORT}`);
    });
  }
}

setupVite();
