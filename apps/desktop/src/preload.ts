import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('noveloraDesktop', {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
  },
});
