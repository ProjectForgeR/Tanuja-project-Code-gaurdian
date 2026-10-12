@echo off
echo ========================================================
echo   Setting up codeguardian.ai domain in Windows hosts...
echo ========================================================

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [REQUESTING ADMIN PRIVILEGES...]
    powershell -Command "Start-Process cmd -ArgumentList '/c \"%~f0\"' -Verb RunAs"
    exit /b
)

findstr /i "codeguardian.ai" "%windir%\System32\drivers\etc\hosts" >nul
if %errorLevel% equ 0 (
    echo [INFO] codeguardian.ai is already present in hosts file!
) else (
    echo 127.0.0.1  codeguardian.ai >> "%windir%\System32\drivers\etc\hosts"
    echo [SUCCESS] Added 127.0.0.1 codeguardian.ai to hosts file!
)

echo.
echo Now you can open: http://codeguardian.ai:5173
pause
