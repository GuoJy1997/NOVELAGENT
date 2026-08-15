import { type ChildProcess } from 'node:child_process';
import { app, BrowserWindow } from 'electron';
import { join } from 'node:path';
import { spawnApiProcess } from './apiProcess';

const DEV_SERVER_URL = process.env.ELECTRON_RENDERER_URL ?? 'http://localhost:5173/';
const PROD_INDEX = join(__dirname, '../../web/dist/index.html');

let apiChild: ChildProcess | undefined;

function startApiProcess(): void {
  try {
    apiChild = spawnApiProcess();
  } catch (err) {
    console.error('Failed to start novelora api process', err);
  }
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1728,
    height: 972,
    minWidth: 1440,
    minHeight: 810,
    autoHideMenuBar: true,
    backgroundColor: '#f4fbf7',
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
