const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('novaAPI', {
  // File System
  openFolderDialog: () => ipcRenderer.invoke('dialog-open-folder'),
  readDir: (dirPath) => ipcRenderer.invoke('fs-read-dir', dirPath),
  readFile: (filePath) => ipcRenderer.invoke('fs-read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('fs-write-file', { filePath, content }),
  createFile: (dirPath, name) => ipcRenderer.invoke('fs-create-file', { dirPath, name }),
  deleteEntry: (filePath) => ipcRenderer.invoke('fs-delete', filePath),
  getAppDataPath: () => ipcRenderer.invoke('get-app-data-path'),
  startPreviewServer: (projectPath) => ipcRenderer.invoke('start-preview-server', projectPath),

  // Terminal
  execCommand: (cmd, cwd) => ipcRenderer.invoke('exec-command', { cmd, cwd }),
  spawnCommand: (cmd, args, cwd) => ipcRenderer.invoke('spawn-command', { cmd, args, cwd }),
  onTerminalOutput: (callback) => {
    ipcRenderer.on('terminal-output', (_, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('terminal-output');
  },
});
