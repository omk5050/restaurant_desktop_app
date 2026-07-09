const { app, BrowserWindow } = require("electron");
const path = require("path");

let mainWindow;

// Start Express backend directly in the Electron process (eliminates spawning a separate node process)
function startBackend() {
  console.log("[Electron Main] Initializing embedded Express backend...");
  try {
    require("./backend/server.js");
    console.log("[Electron Main] Express backend loaded successfully.");
  } catch (err) {
    console.error("[Electron Main] Error loading Express backend:", err);
  }
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
    title: "BillBucks",
    icon: path.join(__dirname, "backend", "image.png")
  });

  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    // In dev mode, load the Vite dev server
    setTimeout(() => {
      mainWindow.loadURL("http://localhost:5173");
      mainWindow.webContents.openDevTools();
    }, 2000);
  } else {
    // In production mode, load the local Express server
    setTimeout(() => {
      mainWindow.loadURL("http://localhost:3000");
    }, 1500);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.on("ready", () => {
  startBackend();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
