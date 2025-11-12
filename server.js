import express from 'express';
import session from 'express-session';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5173;

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'change-me';
// Read-only viewer (e.g., recruiter) credentials
const VIEW_USER = process.env.VIEW_USER || 'recruiter';
const VIEW_PASS = process.env.VIEW_PASS || 'request-pass';
const SESSION_SECRET = process.env.SESSION_SECRET || 'please-change-this-secret';

const DATA_DIR = path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const PUBLIC_DIR = path.join(__dirname, 'public');
const STATIC_DIR = path.join(PUBLIC_DIR, 'static');
const ASSETS_DIR = path.join(__dirname, 'Bilder');

await fs.ensureDir(DATA_DIR);
await fs.ensureDir(UPLOAD_DIR);
await fs.ensureDir(STATIC_DIR);
// Optional folder for user-provided images
await fs.ensureDir(ASSETS_DIR).catch(() => {});

const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
if (!(await fs.pathExists(PROJECTS_FILE))) {
  await fs.writeJson(PROJECTS_FILE, []);
}

app.set('trust proxy', 1);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    name: 'msb_session',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 8, // 8 hours
    },
  })
);

// Multer storage for uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .slice(0, 40);
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});
const upload = multer({ storage });

// --------- Auth helpers ---------
const isAuthenticated = (req) => !!(req.session && req.session.authenticated);
const isOwner = (req) => isAuthenticated(req) && req.session.role === 'owner';

const authGate = (req, res, next) => {
  if (isAuthenticated(req)) return next();
  // Allow unauthenticated for login endpoints and favicon
  const openPaths = ['/login', '/api/login', '/favicon.ico'];
  if (openPaths.includes(req.path)) return next();
  return res.redirect('/login');
};

// --------- Open routes (login) ---------
app.get('/login', (req, res) => {
  if (isAuthenticated(req)) return res.redirect('/');
  res.sendFile(path.join(PUBLIC_DIR, 'login.html'));
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.authenticated = true;
    req.session.username = username;
    req.session.role = 'owner';
    return res.json({ ok: true, user: { username, role: 'owner' } });
  }
  if (username === VIEW_USER && password === VIEW_PASS) {
    req.session.authenticated = true;
    req.session.username = username;
    req.session.role = 'viewer';
    return res.json({ ok: true, user: { username, role: 'viewer' } });
  }
  return res.status(401).json({ ok: false, error: 'Ungültige Anmeldedaten' });
});

// --------- Protected routes below ---------
app.use(authGate);

// Static protected assets (only when logged in)
app.use('/static', express.static(STATIC_DIR, { maxAge: '1h' }));
app.use('/uploads', express.static(UPLOAD_DIR));
app.use('/assets', express.static(ASSETS_DIR));
// Serve built client bundle under /dist (Vite output)
app.use('/dist', express.static(path.join(PUBLIC_DIR, 'dist'), { maxAge: '1h' }));

// Session info & logout
app.get('/api/session', (req, res) => {
  res.json({ ok: true, authenticated: isAuthenticated(req), user: { username: req.session.username, role: req.session.role || null } });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// Projects storage helpers
async function readProjects() {
  const data = await fs.readJson(PROJECTS_FILE);
  return Array.isArray(data) ? data : [];
}
async function writeProjects(items) {
  await fs.writeJson(PROJECTS_FILE, items, { spaces: 2 });
}

// List projects
app.get('/api/projects', async (req, res) => {
  const items = await readProjects();
  // Helper to present a human‑friendly title to clients
  const pretty = (i) => {
    try {
      let s = (i.title || '').trim();
      if (!s) {
        const base = (i.url ? String(i.url).split('/').pop() : '') || '';
        s = base.replace(/\.[^.]+$/, '');
      }
      // Remove leading timestamps or numeric prefixes like 1762008184566-
      s = s.replace(/^\s*\d{6,}[\s_\-]*/, '');
      // Replace separators and split camelCase: "ArbeitszeugnisMarcelSpahr" -> "Arbeitszeugnis Marcel Spahr"
      s = s.replace(/[._-]+/g, ' ');
      s = s.replace(/([a-zäöüß])([A-ZÄÖÜ])/g, '$1 $2');
      s = s.replace(/([A-Za-zÄÖÜäöüß])(\d)/g, '$1 $2');
      s = s.replace(/\s{2,}/g, ' ').trim();
      return s || (i.type || 'Dokument');
    } catch {
      return i.title || i.type || 'Dokument';
    }
  };

  // Newest first and map titles to pretty variant
  items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const presented = items.map((it) => ({ ...it, title: pretty(it) }));
  res.json({ ok: true, items: presented });
});

// Create project
// Owner-only gate for write operations
const ownerGate = (req, res, next) => {
  if (isOwner(req)) return next();
  return res.status(403).json({ ok: false, error: 'Keine Berechtigung' });
};

app.post('/api/projects', ownerGate, async (req, res) => {
  let { title, type, description, url, code } = req.body || {};
  if (!type) return res.status(400).json({ ok: false, error: 'type ist erforderlich' });
  // Fallback-Titel ableiten, damit Nutzer nicht zwingend einen Titel tippen müssen
  if (!title || !String(title).trim()) {
    if (url) {
      const base = path.basename(String(url)).replace(/\.[^.]+$/, '');
      // Entferne führende Zeitstempel/IDs und hübsche auf
      let s = base;
      s = s.replace(/^\s*\d{6,}[\s_\-]*/, '');
      s = s.replace(/[._-]+/g, ' ');
      s = s.replace(/([a-zäöüß])([A-ZÄÖÜ])/g, '$1 $2');
      s = s.replace(/([A-Za-zÄÖÜäöüß])(\d)/g, '$1 $2');
      title = s.trim();
    } else {
      title = String(type).trim();
    }
  }
  const newItem = {
    id: uuidv4(),
    title,
    type, // e.g. 'cv' | 'certificate' | 'photo' | 'project' | 'link' | 'pdf' | 'code'
    description: description || '',
    url: url || '',
    code: code || '',
    createdAt: Date.now(),
  };
  const items = await readProjects();
  items.push(newItem);
  await writeProjects(items);
  res.json({ ok: true, item: newItem });
});

// Delete project
app.delete('/api/projects/:id', ownerGate, async (req, res) => {
  const { id } = req.params;
  const items = await readProjects();
  const idx = items.findIndex((x) => x.id === id);
  if (idx === -1) return res.status(404).json({ ok: false, error: 'Nicht gefunden' });
  const [removed] = items.splice(idx, 1);
  await writeProjects(items);
  res.json({ ok: true, item: removed });
});

// Upload endpoint
app.post('/api/upload', ownerGate, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, error: 'Datei fehlt' });
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ ok: true, file: { url: fileUrl, original: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size } });
});

// Helper endpoint to auto-detect an avatar from /Bilder
app.get('/api/assets/avatar', async (req, res) => {
  try {
    const exists = await fs.pathExists(ASSETS_DIR);
    if (!exists) return res.json({ ok: true, url: null });
    const files = await fs.readdir(ASSETS_DIR);
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
    const images = files.filter((f) => allowed.includes(path.extname(f).toLowerCase()));
    if (!images.length) return res.json({ ok: true, url: null });
    const score = (name) => {
      const n = name.toLowerCase();
      let s = 0;
      if (/(portrait|porträt|profil|profile)/.test(n)) s += 5;
      if (/(marcel|spahr)/.test(n)) s += 3;
      if (/(foto|photo|img|bild)/.test(n)) s += 2;
      if (/(\.jpg|\.jpeg)$/.test(n)) s += 1; // prefer jpg
      return s;
    };
    images.sort((a, b) => score(b) - score(a));
    const pick = images[0];
    return res.json({ ok: true, url: `/assets/${encodeURIComponent(pick)}` });
  } catch (err) {
    return res.json({ ok: true, url: null });
  }
});

// Helper to serve built app (Vite) if present, else fallback to public/index.html
function serveApp(req, res) {
  const distIndex = path.join(PUBLIC_DIR, 'dist', 'index.html');
  fs.pathExists(distIndex)
    .then((exists) => {
      res.sendFile(exists ? distIndex : path.join(PUBLIC_DIR, 'index.html'));
    })
    .catch(() => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));
}

// Main app
app.get('/', serveApp);

// SPA fallback for client-side routes (keep APIs and login separate)
// Express 5 uses path-to-regexp v6, so '*' is not allowed. Use a regex.
app.get(/^(?!\/api|\/login).*/, (req, res, next) => {
  return serveApp(req, res);
});

app.listen(PORT, () => {
  console.log(`MS Bewerbung läuft auf http://localhost:${PORT}`);
});
