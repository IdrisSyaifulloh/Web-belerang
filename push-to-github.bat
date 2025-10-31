@echo off
echo ====================================
echo Pushing to GitHub Repository
echo ====================================

cd /d "c:\Users\saefu\Documents\STAS-RG\Web-belerang\dashboard-frontend"

echo.
echo Adding all changes...
git add .

echo.
echo Committing changes...
git commit -m "Update dashboard: Add dark mode, 2-parameter chart, remove loading/error, fix navbar layout, rename parameters"

echo.
echo Pushing to remote repository...
git push origin main

echo.
echo ====================================
echo Done! Check the output above for any errors.
echo ====================================
pause
