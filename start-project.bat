@echo off
title CodeGuardian AI Launcher
echo ========================================================
echo        Starting CodeGuardian AI Development Servers
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Starting Backend Server (FastAPI on Port 8000)...
start "CodeGuardian Backend" cmd /k "cd backend && .\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/2] Starting Frontend Server (Vite on Port 5173)...
start "CodeGuardian Frontend" cmd /k "cd frontend && npm run dev -- --host 0.0.0.0 --port 5173"

echo.
echo Waiting for servers to initialize...
timeout /t 3 >nul

echo Opening browser at http://localhost:5173...
start http://localhost:5173

echo.
echo ========================================================
echo  CodeGuardian AI is now running!
echo  Frontend: http://localhost:5173
echo  Backend:  http://localhost:8000 (Docs: /docs)
echo ========================================================
echo.
pause
