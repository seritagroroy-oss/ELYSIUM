@echo off
TITLE Compilation du Frontend (Vite/React)
echo Compilation de l'application en cours... Cela peut prendre quelques secondes.
echo.
cd /d "%~dp0frontend"
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERREUR DE COMPILATION ! Regardez le message ci-dessus.
    pause
    exit /b %errorlevel%
)
echo.
echo =========================================================
echo Compilation terminée ! Les modifications ont été appliquées dans le dossier dist/.
echo =========================================================
pause
