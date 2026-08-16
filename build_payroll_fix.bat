@echo off
TITLE Build Payroll Status Fix
echo ================================================
echo  Build du fix: Persistance Statuts de Paie
echo ================================================
echo.
cd /d "C:\laragon\www\pontage\frontend"
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ERREUR DE COMPILATION !
    pause
    exit /b %errorlevel%
)
echo.
echo Build reussi! Rafraichissez votre navigateur.
echo Suppression des fichiers temporaires...
del /f "C:\laragon\www\pontage\do_backup_payroll_fix.php" 2>nul
del /f "C:\laragon\www\pontage\run_build_tmp.php" 2>nul
echo Fichiers temporaires supprimes.
echo ================================================
pause
