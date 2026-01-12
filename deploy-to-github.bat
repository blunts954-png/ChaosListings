@echo off
echo ========================================
echo   ChaosListings - GitHub Setup
echo ========================================
echo.

echo Step 1: Initializing Git repository...
git init
if errorlevel 1 (
    echo Git is already initialized or error occurred
)
echo.

echo Step 2: Adding files to Git...
git add .
echo.

echo Step 3: Creating initial commit...
git commit -m "Initial commit - ChaosListings ready for deployment"
echo.

echo ========================================
echo   Next Steps:
echo ========================================
echo.
echo 1. Create a new repository on GitHub:
echo    - Go to https://github.com/new
echo    - Name: chaoslistings
echo    - Don't initialize with README
echo    - Click "Create repository"
echo.
echo 2. Copy your repository URL (it looks like):
echo    https://github.com/YOUR_USERNAME/chaoslistings.git
echo.
echo 3. Run these commands (replace YOUR_USERNAME):
echo.
echo    git remote add origin https://github.com/YOUR_USERNAME/chaoslistings.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo 4. Then go to https://app.netlify.com
echo    - Click "Add new site"
echo    - Choose "Import from GitHub"
echo    - Select your repository
echo    - Base directory: frontend
echo    - Build command: npm run build
echo    - Publish directory: frontend/.next
echo    - Click "Deploy site"
echo.
echo ========================================
echo Your site will be live in 3 minutes! 🚀
echo ========================================
echo.
pause
