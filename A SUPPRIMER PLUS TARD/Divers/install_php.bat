@echo off
echo ======================================================
echo          INSTALLATION DE PHP POUR POINTAGE PRO
echo ======================================================
echo.
echo Ce script va utiliser Windows Package Manager (winget) 
echo pour telecharger et installer PHP automatiquement.
echo.
echo Patientez pendant le telechargement...
echo.
winget install PHP.PHP.8.5 --accept-source-agreements --accept-package-agreements

if %errorlevel% equ 0 (
    echo.
    echo Installation de PHP reussie !
    echo Veuillez fermer cette fenetre et relancer 'lancer_serveur.bat'.
    echo Important : Si le serveur ne se lance toujours pas, 
    echo redemarrez votre ordinateur pour mettre a jour les variables d'environnement.
) else (
    echo.
    echo L'installation a rencontre un probleme.
    echo Vous pouvez telecharger PHP manuellement sur https://windows.php.net/download/
    echo ou installer XAMPP (https://www.apachefriends.org/fr/index.html).
)
echo.
pause
