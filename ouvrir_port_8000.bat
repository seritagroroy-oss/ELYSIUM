@echo off
echo =======================================================
echo   Ouverture du port 8000 dans le Pare-feu Windows
echo =======================================================
echo.
netsh advfirewall firewall add rule name="Serveur Pontage 8000" dir=in action=allow protocol=TCP localport=8000
echo.
echo Termine ! Relancez maintenant "lancer_serveur.bat".
pause
