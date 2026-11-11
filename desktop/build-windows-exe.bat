@echo off
chcp 65001 > nul
title Sanches & Marques Esquadrias - Compilador de Executavel Windows (.EXE)

echo =====================================================================
echo    SANCHES & MARQUES ESQUADRIAS - COMPILADOR AUTOMATICO (.EXE)
echo =====================================================================
echo.
echo [1/3] Verificando dependencias do Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERRO: Node.js nao encontrado. Por favor, instale o Node.js LTS em https://nodejs.org
    pause
    exit /b 1
)

echo [2/3] Instalando dependencias e compilando o projeto Vite...
call npm install
call npm run build

echo [3/3] Empacotando o aplicativo no formato executavel Windows (.exe)...
call npx electron-builder --win --x64

echo.
echo =====================================================================
echo   SUCESSO! O executavel foi gerado na pasta:
echo   dist\Sanches&Marques Esquadrias Setup.exe
echo =====================================================================
pause
