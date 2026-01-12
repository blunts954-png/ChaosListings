@echo off
echo ================================
echo ListingsIQ - Database Setup
echo ================================
echo.

echo Checking if Docker is running...
docker ps >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running!
    echo Please start Docker Desktop and try again.
    echo.
    pause
    exit /b 1
)

echo [OK] Docker is running!
echo.

echo Checking if database container exists...
docker ps -a | findstr listingsiq-postgres >nul 2>&1
if not errorlevel 1 (
    echo [INFO] Database container already exists. Starting it...
    docker start listingsiq-postgres
    echo [OK] Database started!
) else (
    echo [INFO] Creating new database container...
    docker run --name listingsiq-postgres ^
        -e POSTGRES_DB=listingsiq ^
        -e POSTGRES_USER=listingsiq_user ^
        -e POSTGRES_PASSWORD=secure_password_123 ^
        -p 5432:5432 ^
        -d postgres:14

    if errorlevel 1 (
        echo [ERROR] Failed to create database container!
        pause
        exit /b 1
    )

    echo [OK] Database container created!
    echo Waiting 5 seconds for PostgreSQL to initialize...
    timeout /t 5 /nobreak >nul
)

echo.
echo ================================
echo Database is ready!
echo ================================
echo.
echo Connection details:
echo   Host: localhost
echo   Port: 5432
echo   Database: listingsiq
echo   User: listingsiq_user
echo   Password: secure_password_123
echo.
echo Next steps:
echo   1. cd backend
echo   2. npx prisma migrate dev
echo   3. npm run start:dev
echo.
pause
