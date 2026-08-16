@echo off
echo ===================================================
echo SYNCHRONISATION VERS LE DISQUE D:
echo ===================================================
echo.
echo Copie des fichiers de C:\laragon\www\pontage vers D:\Pontage - VRAI 07 07 2026...
xcopy /E /Y /I /Q "C:\laragon\www\pontage\*" "D:\Pontage - VRAI 07 07 2026\"

echo.
echo Compilation du frontend sur le disque D:...
cd /d "D:\Pontage - VRAI 07 07 2026\frontend"
call npm run build

echo.
echo ===================================================
echo TERMINE ! Vous pouvez maintenant rafraichir la page
echo sur http://127.0.0.1:8000/
echo ===================================================
pause
