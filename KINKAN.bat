@echo off
cd /d "%~dp0"

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8080"') do (
    taskkill /f /pid %%a > nul 2>&1
)

start "" /min python -m http.server 8080
timeout /t 2 /nobreak > nul
start "" "http://localhost:8080/kinkan.html"
pause
