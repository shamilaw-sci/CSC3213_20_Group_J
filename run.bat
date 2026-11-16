@echo off
echo ========================================================
echo Starting iCrowd Backend (Spring Boot) and Frontend (Vite)
echo ========================================================

REM Backend: Spring Boot API on port 8080
start "iCrowd Backend API (Port 8080)" cmd /k "cd /d "%~dp0icrowd_api" && set MAVEN_OPTS=-Xmx512m -Xms128m && .\mvnw.cmd spring-boot:run"

REM Frontend: Vite dev server on port 5173
REM  - First installs node_modules if not present, then starts dev server
start "iCrowd Frontend UI (Port 5173)" cmd /k "cd /d "%~dp0iCrowd_UI" && (if not exist node_modules npm install) && npm run dev"

echo Both services are starting in separate windows.
echo.
echo   Backend  (Spring Boot) : http://localhost:8080
echo   Frontend (Vite)        : http://localhost:5173
echo.

