import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('noveloraDesktop', {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
  },
  selectDirectory: (title?: string) => ipcRenderer.invoke('novelora:select-directory', title),
  selectFile: (title?: string) => ipcRenderer.invoke('novelora:select-file', title),
});
