@echo off
setlocal enabledelayedexpansion
title Sanches & Marques Esquadrias Pro - Estacao de Trabalho

cls
echo ===================================================================
echo               SANCHES & MARQUES ESQUADRIAS PRO
echo   Sistema de Gestao, Estoque, Orcamentos e Corte CNC Industrial
echo ===================================================================
echo.

:: 1. Verificar se o Node.js esta instalado no computador
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO CRITICO] O Node.js nao foi encontrado no Windows!
    echo.
    echo Por favor, instale o Node.js versao 20.19+ ou 22.12+ (LTS) atraves de:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Exibir versao do Node detectada
for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo [OK] Node.js detectado: %NODE_VER%

:: 2. Instalar dependencias se node_modules nao existir
if not exist "node_modules\" (
    echo.
    echo [AVISO] Pasta "node_modules" nao encontrada. Instalando pacotes...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERRO] Falha ao instalar dependencias com npm install.
        pause
        exit /b 1
    )
    echo [OK] Dependencias instaladas com sucesso!
)

:: 3. Verificar se a porta 3000 ja esta aberta ou iniciar o servidor Vite
set "SERVER_READY=0"
netstat -ano | findstr /R ":3000.*LISTENING" >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Servidor de aplicacao local ja em execucao na porta 3000.
    set "SERVER_READY=1"
) else (
    echo.
    echo [INFO] Iniciando servidor local Vite na porta 3000...
    start "Sanches & Marques - Servidor de Aplicacao" /min cmd /c "npm run dev"
)

:: 4. Aguardar o servidor responder em http://localhost:3000 ou http://127.0.0.1:3000
echo [INFO] Aguardando inicializacao do sistema local (porta 3000)...
set /a ATTEMPTS=0
set /a MAX_ATTEMPTS=60

:wait_loop
if %SERVER_READY% equ 1 goto launch_app

set /a ATTEMPTS+=1

:: Teste rapido via PowerShell ou netstat
powershell -Command "(New-Object System.Net.Sockets.TcpClient).Connect('127.0.0.1', 3000)" >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Servidor ativo e respondendo na porta 3000!
    goto launch_app
)

timeout /t 1 /nobreak >nul
if %ATTEMPTS% geq %MAX_ATTEMPTS% (
    echo.
    echo [AVISO] O servidor demorou mais que o esperado para responder.
    echo Causas provaveis:
    echo   1. Node.js com versao desatualizada (recomendado Node 20.19+ ou 22.12+).
    echo   2. Erro interno durante o "npm run dev".
    echo   3. Bloqueio de porta por firewall ou antivirus.
    echo.
    echo Tentando abrir a janela do sistema mesmo assim...
    goto launch_app
)
goto wait_loop

:launch_app
echo.
echo [INFO] Abrindo em modo Janela de Aplicativo Nativa (.EXE / Desktop)...

set "APP_URL=http://localhost:3000"

:: 5. Tentar Google Chrome no modo --app
set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if exist "%CHROME%" goto run_chrome
set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if exist "%CHROME%" goto run_chrome
set "CHROME=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
if exist "%CHROME%" goto run_chrome

:: Tentar Microsoft Edge no modo --app
set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if exist "%EDGE%" goto run_edge
set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if exist "%EDGE%" goto run_edge

:: Fallback: abrir no navegador padrao
echo [INFO] Abrindo no navegador web padrao...
start "" "%APP_URL%"
exit /b 0

:run_chrome
start "" "%CHROME%" --app="%APP_URL%" --window-size=1380,900 --user-data-dir="%LOCALAPPDATA%\Sanches_Marques_Desktop_Profile"
exit /b 0

:run_edge
start "" "%EDGE%" --app="%APP_URL%" --window-size=1380,900 --user-data-dir="%LOCALAPPDATA%\Sanches_Marques_Desktop_Profile"
exit /b 0
