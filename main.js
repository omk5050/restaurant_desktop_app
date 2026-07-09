const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

let mainWindow;
let backendProcess;

function startBackend() {
  const isDev = process.env.NODE_ENV === "development";
  console.log(`[Electron Main] Starting backend in ${isDev ? "development" : "production"} mode...`);

  // Path to server.js in backend/server.js
  const serverPath = path.join(__dirname, "backend", "server.js");

  // Spawn node process
  backendProcess = spawn("node", [serverPath], {
    env: {
      ...process.env,
      PORT: "3000",
      NODE_ENV: isDev ? "development" : "production"
    },
    stdio: "pipe"
  });

  backendProcess.stdout.on("data", (data) => {
    const message = data.toString();
    console.log(`[Express Backend] ${message.trim()}`);
  });

  backendProcess.stderr.on("data", (data) => {
    console.error(`[Express Backend Error] ${data.toString().trim()}`);
  });

  backendProcess.on("close", (code) => {
    console.log(`[Express Backend] Process exited with code ${code}`);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    autoHideMenuBar: true,
    title: "Restaurant POS"
  });

  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    // In dev mode, wait slightly and load the Vite dev server
    setTimeout(() => {
      mainWindow.loadURL("http://localhost:5173");
      mainWindow.webContents.openDevTools();
    }, 2000);
  } else {
    // In production, wait for the Express backend to bind and load localhost:3000
    setTimeout(() => {
      mainWindow.loadURL("http://localhost:3000");
    }, 1500);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// Clean up child process on exit
function cleanUp() {
  if (backendProcess) {
    console.log("[Electron Main] Killing Express backend process...");
    backendProcess.kill();
    backendProcess = null;
  }
}

app.on("ready", () => {
  startBackend();
  createWindow();
});

app.on("window-all-closed", () => {
  cleanUp();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("quit", () => {
  cleanUp();
});

process.on("exit", () => {
  cleanUp();
});
