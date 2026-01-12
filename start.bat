@echo off
echo ========================================
echo   Resume Shortlister - Starting...
echo ========================================
echo.

echo Starting Backend Server...
start "Resume Shortlister Backend" cmd /k "cd backend && npm start"

timeout /t 3 /nobreak > nul

echo Starting Frontend...
start "Resume Shortlister Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo   Both servers are starting!
echo   Backend: http://localhost:5000
echo   Frontend: http://localhost:5173
echo ========================================
echo.
echo Press any key to exit this window...
pause > nul
