@echo off
echo ========================================================
echo        STARTING AI HARMONIUM PRO (LOCAL SERVER)
echo ========================================================
echo.
echo Machine Learning (CREPE AI) models require a local server 
echo to bypass browser security policies for local files.
echo.
echo Starting local Python server on port 8000...
echo.
start http://localhost:8000
python -m http.server 8000
pause
