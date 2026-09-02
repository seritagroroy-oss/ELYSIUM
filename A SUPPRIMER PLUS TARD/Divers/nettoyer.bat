@echo off
TITLE Nettoyage des fichiers inutiles
echo Création du dossier _A_SUPPRIMER...
mkdir _A_SUPPRIMER 2>nul

echo Déplacement des fichiers de test...
move test*.php _A_SUPPRIMER\ >nul 2>&1
move test*.js _A_SUPPRIMER\ >nul 2>&1
move test*.html _A_SUPPRIMER\ >nul 2>&1
move api_test.php _A_SUPPRIMER\ >nul 2>&1

echo Déplacement des fichiers de diagnostic...
move check*.php _A_SUPPRIMER\ >nul 2>&1
move check*.py _A_SUPPRIMER\ >nul 2>&1
move diag*.php _A_SUPPRIMER\ >nul 2>&1
move debug*.php _A_SUPPRIMER\ >nul 2>&1
move debug*.log _A_SUPPRIMER\ >nul 2>&1

echo Déplacement des scripts de correction...
move fix*.php _A_SUPPRIMER\ >nul 2>&1
move fix*.py _A_SUPPRIMER\ >nul 2>&1
move patch*.php _A_SUPPRIMER\ >nul 2>&1
move patch*.ps1 _A_SUPPRIMER\ >nul 2>&1
move patch*.py _A_SUPPRIMER\ >nul 2>&1
move repair*.js _A_SUPPRIMER\ >nul 2>&1
move repair*.php _A_SUPPRIMER\ >nul 2>&1

echo Déplacement des dumps et logs...
move dump*.php _A_SUPPRIMER\ >nul 2>&1
move dump*.py _A_SUPPRIMER\ >nul 2>&1
move *.txt _A_SUPPRIMER\ >nul 2>&1
move *init_output.json _A_SUPPRIMER\ >nul 2>&1
move php_errors_custom.log _A_SUPPRIMER\ >nul 2>&1
move server.log _A_SUPPRIMER\ >nul 2>&1
move debug_api_out.json _A_SUPPRIMER\ >nul 2>&1

echo Déplacement des utilitaires divers...
move add_*.py _A_SUPPRIMER\ >nul 2>&1
move automate_*.py _A_SUPPRIMER\ >nul 2>&1
move find*.py _A_SUPPRIMER\ >nul 2>&1
move find_*.php _A_SUPPRIMER\ >nul 2>&1
move inject_*.py _A_SUPPRIMER\ >nul 2>&1
move replace_*.py _A_SUPPRIMER\ >nul 2>&1
move reset*.py _A_SUPPRIMER\ >nul 2>&1
move search*.py _A_SUPPRIMER\ >nul 2>&1
move update_*.py _A_SUPPRIMER\ >nul 2>&1
move header_merge.py _A_SUPPRIMER\ >nul 2>&1
move inspect*.py _A_SUPPRIMER\ >nul 2>&1
move sticky_headers.py _A_SUPPRIMER\ >nul 2>&1
move refactor_*.py _A_SUPPRIMER\ >nul 2>&1
move alter*.php _A_SUPPRIMER\ >nul 2>&1
move clean_api.php _A_SUPPRIMER\ >nul 2>&1
move replace_api.php _A_SUPPRIMER\ >nul 2>&1
move delete_*.php _A_SUPPRIMER\ >nul 2>&1
move inject_*.php _A_SUPPRIMER\ >nul 2>&1
move inspect_users*.php _A_SUPPRIMER\ >nul 2>&1
move migrate*.php _A_SUPPRIMER\ >nul 2>&1
move reset*.php _A_SUPPRIMER\ >nul 2>&1
move restore*.php _A_SUPPRIMER\ >nul 2>&1
move seed_*.php _A_SUPPRIMER\ >nul 2>&1
move init_suivi_db.php _A_SUPPRIMER\ >nul 2>&1

echo.
echo =========================================================
echo Terminé ! Tous les fichiers ont été placés dans le dossier
echo _A_SUPPRIMER. Vous pouvez maintenant supprimer ce dossier.
echo =========================================================
pause
