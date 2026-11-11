/**
 * Processo Principal do Electron (Desktop Nativo)
 * Sanches & Marques Esquadrias Pro - Versão Executável (.EXE)
 * Fornece inicialização com aceleração gráfica, banco offline e menus de estação de trabalho.
 */

const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require('electron');
const path = require('path');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 700,
    title: 'Sanches & Marques - ERP Industrial de Esquadrias & Serralheria v3.0 [Desktop Workstation]',
    icon: path.join(__dirname, '../public/icon-512.png'),
    backgroundColor: '#020617', // Slate-950 industrial
    show: false,
    autoHideMenuBar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      spellcheck: false,
    },
  });

  // Mostrar janela apenas quando estiver pronta (evita flash branco)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Carregar aplicação: ambiente de desenvolvimento ou build estática empacotada
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  const devUrl = process.env.ELECTRON_DEV_URL || 'http://localhost:3000';

  if (isDev && process.env.ELECTRON_DEV_URL) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html')).catch(() => {
      // Fallback em caso de rodar diretamente
      mainWindow.loadURL(devUrl);
    });
  }

  // Links externos abrem no navegador padrão do sistema operacional
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  setupApplicationMenu();
}

/**
 * Menu Nativo do Windows / macOS
 */
function setupApplicationMenu() {
  const template = [
    {
      label: 'Arquivo',
      submenu: [
        {
          label: 'Exportar Backup do Banco de Dados (.JSON)',
          accelerator: 'CmdOrCtrl+B',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.executeJavaScript(`
                if (window.dispatchEvent) {
                  window.dispatchEvent(new CustomEvent('desktop-backup-request'));
                }
              `);
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Imprimir / Gerar PDF',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            if (mainWindow) mainWindow.webContents.print();
          },
        },
        { type: 'separator' },
        {
          label: 'Fechar Sistema',
          accelerator: 'Alt+F4',
          role: 'quit',
        },
      ],
    },
    {
      label: 'Navegação',
      submenu: [
        {
          label: '1. Painel Geral / Dashboard',
          accelerator: 'Alt+1',
          click: () => switchTab('dashboard'),
        },
        {
          label: '2. Orçamentos & Pedidos',
          accelerator: 'Alt+2',
          click: () => switchTab('budgets'),
        },
        {
          label: '3. Plano de Corte 1D',
          accelerator: 'Alt+3',
          click: () => switchTab('cutting_plan'),
        },
        {
          label: '4. Máquinas CNC & G-Code',
          accelerator: 'Alt+4',
          click: () => switchTab('cnc_studio'),
        },
        {
          label: '5. Controle de Estoque de Alumínio',
          accelerator: 'Alt+5',
          click: () => switchTab('stock'),
        },
        {
          label: '6. Serralheria & PCP',
          accelerator: 'Alt+6',
          click: () => switchTab('production'),
        },
        {
          label: '7. Plano de Montagem',
          accelerator: 'Alt+7',
          click: () => switchTab('assembly'),
        },
        {
          label: '8. Romaneios & Carga',
          accelerator: 'Alt+8',
          click: () => switchTab('romaneio'),
        },
        {
          label: '9. Relatórios Analíticos',
          accelerator: 'Alt+9',
          click: () => switchTab('reports'),
        },
      ],
    },
    {
      label: 'Exibir',
      submenu: [
        {
          label: 'Alternar Tela Cheia',
          accelerator: 'F11',
          click: () => {
            if (mainWindow) {
              mainWindow.setFullScreen(!mainWindow.isFullScreen());
            }
          },
        },
        {
          label: 'Recarregar Tela',
          accelerator: 'CmdOrCtrl+R',
          role: 'reload',
        },
        { type: 'separator' },
        {
          label: 'Aumentar Zoom',
          accelerator: 'CmdOrCtrl+Plus',
          role: 'zoomIn',
        },
        {
          label: 'Diminuir Zoom',
          accelerator: 'CmdOrCtrl+-',
          role: 'zoomOut',
        },
        {
          label: 'Tamanho Padrão (100%)',
          accelerator: 'CmdOrCtrl+0',
          role: 'resetZoom',
        },
      ],
    },
    {
      label: 'Engenharia & Normas',
      submenu: [
        {
          label: 'Auditoria ABNT NBR 10821 (Pressão de Vento)',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'ABNT NBR 10821 & NBR 7199',
              message: 'Conformidade Técnica Certificada',
              detail:
                'O sistema Sanches & Marques calcula automaticamente a pressão de vento de projeto (kgf/m² e Pa), verificação de flecha máxima (L/175 e L/350), momento de inércia mínimo exigido (Ix em cm⁴) e espessura segura de vidro float, laminado ou temperado.',
            });
          },
        },
        {
          label: 'G-Code CNC de Fresadoras e Serras de Dupla Cabeça',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Módulo CNC G-Code',
              message: 'Compatibilidade com Centros de Usinagem de Esquadrias',
              detail:
                'Geração de arquivos industriais ISO G-Code (.nc / .gcode) e XML compatíveis com Emmegi, FOM Industrie, Yilmaz, Schüco e serras eletrônicas para furação de drenos, rasgos de fechaduras e corte em ângulos 45° e 90°.',
            });
          },
        },
      ],
    },
    {
      label: 'Ajuda',
      submenu: [
        {
          label: 'Sobre o Sistema Sanches & Marques',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Sanches & Marques Esquadrias Pro',
              message: 'Sanches & Marques - ERP & PCP Industrial de Esquadrias v3.0',
              detail:
                'Executável Desktop Windows nativo compilado com banco de dados local Offline-Ready (Local DB). Desenvolvido para serralherias de alumínio, construtoras e fabricantes de esquadrias de alto padrão.',
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function switchTab(tabId) {
  if (mainWindow) {
    mainWindow.webContents.executeJavaScript(`
      if (window.__setActiveTab) {
        window.__setActiveTab('${tabId}');
      }
    `).catch(() => {});
  }
}

// Bloqueio de instância única: se o usuário tentar abrir outro .exe, foca na janela já aberta
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(createWindow);

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}
