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
