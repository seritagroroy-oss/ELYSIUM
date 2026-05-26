@echo off
TITLE Serveur Pointage Pro
echo ======================================================
echo          LANCEMENT DU SERVEUR POINTAGE PRO
echo ======================================================
echo.
echo  -^> Interface React sur : http://localhost:8000
echo  -^> API backend PHP sur : http://localhost:8000/api.php
echo.

:: Verifier si le build React existe
if not exist "%~dp0dist\index.html" (
    echo =====================================================
    echo  ATTENTION : Le build React n'a pas ete genere !
    echo  Lancez d'abord : cd frontend ^&^& npm run build
    echo =====================================================
    echo.
    echo Appuyez sur une touche pour ouvrir quand meme...
    pause > nul
)

echo Appuyez sur une touche pour ouvrir le navigateur et lancer le serveur...
pause > nul

:: Ouvre le navigateur par defaut
start http://localhost:8000

:: Lance le serveur PHP integre avec le routeur
php -S localhost:8000 router.php

if %errorlevel% neq 0 (
    echo.
    echo ERREUR : PHP ne semble pas etre installe ou accessible.
    echo Veuillez installer PHP pour utiliser cette application.
    pause
)
