import { type ChildProcess } from 'node:child_process';
import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { join } from 'node:path';
import { spawnApiProcess } from './apiProcess';

const DEV_SERVER_URL = process.env.ELECTRON_RENDERER_URL ?? 'http://localhost:5173/';
const PROD_INDEX = join(__dirname, '../../web/dist/index.html');

let apiChild: ChildProcess | undefined;

function registerIpcHandlers(): void {
  ipcMain.handle('novelora:select-directory', async (event, title?: unknown) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return null;
    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory'],
      title: typeof title === 'string' && title.trim() !== '' ? title : '选择文件夹',
    });
    return result.canceled ? null : (result.filePaths[0] ?? null);
  });
  ipcMain.handle('novelora:select-file', async (event, title?: unknown) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return null;
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      title: typeof title === 'string' && title.trim() !== '' ? title : '选择文件',
      filters: [
        { name: 'Markdown / 文本', extensions: ['md', 'txt'] },
        { name: '所有文件', extensions: ['*'] },
      ],
    });
    return result.canceled ? null : (result.filePaths[0] ?? null);
  });
}

function startApiProcess(): void {
  try {
    apiChild = spawnApiProcess();
  } catch (err) {
    console.error('Failed to start novelora api process', err);
  }
}

function createWindow(): void {
  const win = new BrowserWindow({
    title: '笔心',
    width: 1728,
    height: 972,
    minWidth: 1440,
    minHeight: 810,
    autoHideMenuBar: true,
    backgroundColor: '#f4fbf7',
    icon: join(__dirname, '../../assets/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (app.isPackaged) {
    void win.loadFile(PROD_INDEX);
  } else {
    void win.loadURL(DEV_SERVER_URL);
  }
}

app.whenReady().then(() => {
  startApiProcess();
  registerIpcHandlers();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  apiChild?.kill();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
