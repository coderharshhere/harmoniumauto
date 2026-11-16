@echo off
title Push to GitHub - harmoniumauto
echo ========================================================
echo        PUSHING CODE TO GITHUB
echo        Repository: coderharshhere/harmoniumauto
echo ========================================================
echo.
cd /d "%~dp0"

echo Running: git push -u origin main
echo.
git push -u origin main

echo.
if %errorlevel% equ 0 (
    echo ========================================================
    echo  SUCCESS: Code successfully uploaded to GitHub!
    echo  View at: https://github.com/coderharshhere/harmoniumauto
    echo ========================================================
) else (
    echo ========================================================
    echo  Note: If a browser window opens, please sign in to GitHub
    echo  to authorize Git Credential Manager.
    echo ========================================================
)
echo.
pause
