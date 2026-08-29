@echo off
echo ========================================================
echo Starting iCrowd Backend (Spring Boot) and Frontend (Vite)
echo ========================================================

start "iCrowd Backend API (Port 8080)" cmd /k "cd /d "%~dp0icrowd_api" && .\mvnw.cmd spring-boot:run"
start "iCrowd Frontend UI (Port 5173)" cmd /k "cd /d "%~dp0iCrowd_UI" && npm run dev"

echo Both services are starting in separate windows.
