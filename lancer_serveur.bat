@echo off
TITLE ELYSIUM - Serveur Local
color 0A
echo.
echo  ============================================================
echo        ELYSIUM - Lancement du Serveur Local
echo  ============================================================
echo.

:: Tuer les anciens processus PHP qui pourraient bloquer le port
echo  [1/4] Nettoyage des anciens processus PHP...
taskkill /F /IM php.exe /T >nul 2>&1
timeout /t 1 /nobreak >nul

:: Verifier si PHP est installe
php -v >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ERREUR : PHP n'est pas installe ou pas dans le PATH.
    echo  Telechargez PHP sur : https://windows.php.net/download/
    pause
    exit /b 1
)

:: Verifier si le build React existe
if not exist "%~dp0dist\index.html" (
    echo  [2/4] Build React absent - Generation en cours...
    cd /d "%~dp0frontend"
    call npm run build
    cd /d "%~dp0"
    echo  Build termine.
) else (
    echo  [2/4] Build React OK - dist/index.html trouve.
)

echo  [3/4] Ouverture du navigateur dans 2 secondes...
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8000/"

echo  [4/4] Demarrage du serveur PHP...
echo.
echo  ============================================================
echo   Application disponible sur : http://127.0.0.1:8000/
echo   Appuyez sur Ctrl+C pour arreter le serveur
echo  ============================================================
echo.

php -S 127.0.0.1:8000 router.php

if %errorlevel% neq 0 (
    echo.
    echo  ERREUR : Impossible de demarrer le serveur PHP.
    pause
)
