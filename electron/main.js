import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { exec, spawn } from 'child_process';
import express from 'express';
import cors from 'cors';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0D0D11',
      symbolColor: '#9ca3af',
      height: 36,
    },
    backgroundColor: '#0D0D11',
    show: false,
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.webContents.session.clearCache().catch(() => {});
    });
    // mainWindow.webContents.openDevTools(); // Uncomment to debug
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ─── IPC: SERVER ──────────────────────────────────────────────────────────────

let previewServer = null;
let previewServerApp = null;

ipcMain.handle('start-preview-server', async (_, projectPath) => {
  return new Promise((resolve) => {
    if (previewServer) {
      previewServer.close(() => {
        previewServer = null;
        startNewServer();
      });
    } else {
      startNewServer();
    }

    function startNewServer() {
      previewServerApp = express();
      previewServerApp.use(cors());
      previewServerApp.use(express.static(projectPath));
      
      // Attempt to listen on port 3001, or automatically find an open one
      previewServer = previewServerApp.listen(3001, () => {
        const port = previewServer.address().port;
        resolve(`http://localhost:${port}`);
      }).on('error', (e) => {
        if (e.code === 'EADDRINUSE') {
          // If 3001 is in use, listen on a random port
          previewServer = previewServerApp.listen(0, () => {
            const port = previewServer.address().port;
            resolve(`http://localhost:${port}`);
          });
        } else {
          resolve(null);
        }
      });
    }
  });
});

// ─── IPC: FILE SYSTEM ─────────────────────────────────────────────────────────

ipcMain.handle('dialog-open-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('fs-read-dir', async (_, dirPath) => {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    return entries.map(e => ({
      name: e.name,
      kind: e.isDirectory() ? 'directory' : 'file',
      path: path.join(dirPath, e.name),
    }));
  } catch (e) {
    return [];
  }
});

ipcMain.handle('fs-read-file', async (_, filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (e) {
    return null;
  }
});

ipcMain.handle('fs-write-file', async (_, { filePath, content }) => {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('fs-create-file', async (_, { dirPath, name }) => {
  try {
    const filePath = path.join(dirPath, name);
    fs.writeFileSync(filePath, '', 'utf-8');
    return { success: true, filePath };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('fs-delete', async (_, filePath) => {
  try {
    fs.rmSync(filePath, { recursive: true });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('get-app-data-path', () => app.getPath('userData'));

// ─── IPC: NOVA BRAIN (.nova/brain) ───────────────────────────────────────────

function getNovaBrainDir(projectPath) {
  const brainDir = path.join(projectPath, '.nova', 'brain');
  fs.mkdirSync(brainDir, { recursive: true });
  return brainDir;
}

ipcMain.handle('brain-read-json', async (_, { projectPath, filename }) => {
  try {
    const filePath = path.join(getNovaBrainDir(projectPath), filename);
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf-8');
    if (!content.trim()) return null;
    return JSON.parse(content);
  } catch (e) {
    return null;
  }
});

ipcMain.handle('brain-write-json', async (_, { projectPath, filename, data }) => {
  try {
    const filePath = path.join(getNovaBrainDir(projectPath), filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// ─── IPC: NOVA DESIGN (.nova/design) ─────────────────────────────────────────

function getNovaDesignDir(projectPath) {
  const designDir = path.join(projectPath, '.nova', 'design');
  fs.mkdirSync(designDir, { recursive: true });
  return designDir;
}

ipcMain.handle('design-read-json', async (_, { projectPath, filename }) => {
  try {
    const filePath = path.join(getNovaDesignDir(projectPath), filename);
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf-8');
    if (!content.trim()) return null;
    return JSON.parse(content);
  } catch (e) {
    return null;
  }
});

ipcMain.handle('design-write-json', async (_, { projectPath, filename, data }) => {
  try {
    const filePath = path.join(getNovaDesignDir(projectPath), filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// ─── IPC: OLLAMA (proxy para evitar CORS en renderer) ───────────────────────

ipcMain.handle('ollama-health', async (_, { url }) => {
  const base = url || 'http://127.0.0.1:11434';
  try {
    const res = await fetch(`${base}/api/tags`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const data = await res.json();
    const models = (data.models || []).map((m) => m.name);
    return { ok: true, models };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('ollama-chat', async (_, { url, model, messages }) => {
  const base = url || 'http://127.0.0.1:11434';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 180000);
  try {
    const res = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, stream: false }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `Ollama HTTP ${res.status}: ${errText.slice(0, 200)}` };
    }
    const data = await res.json();
    return { success: true, content: data.message?.content || '(sin contenido)' };
  } catch (e) {
    clearTimeout(timer);
    const msg = e.name === 'AbortError' ? 'Timeout: Ollama tardó más de 3 minutos' : e.message;
    return { success: false, error: msg };
  }
});

// ─── IPC: TERMINAL ────────────────────────────────────────────────────────────

// One-shot command (for quick commands)
ipcMain.handle('exec-command', async (_, { cmd, cwd }) => {
  return new Promise((resolve) => {
    exec(cmd, { cwd }, (err, stdout, stderr) => {
      resolve({ stdout, stderr, error: err?.message || null });
    });
  });
});

// Streaming command (for npm install, etc.) — sends output back via event
ipcMain.handle('spawn-command', async (event, { cmd, args, cwd }) => {
  const child = spawn(cmd, args, { cwd, shell: true });
  const senderId = event.sender.id;

  child.stdout.on('data', (data) => {
    event.sender.send('terminal-output', { type: 'stdout', data: data.toString() });
  });
  child.stderr.on('data', (data) => {
    event.sender.send('terminal-output', { type: 'stderr', data: data.toString() });
  });
  child.on('close', (code) => {
    event.sender.send('terminal-output', { type: 'exit', code });
  });

  return { pid: child.pid };
});
