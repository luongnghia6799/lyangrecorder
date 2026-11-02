@echo off
setlocal
title LyangRecorder - Dev Test (Hot Reload)

echo ========================================================
echo        CHAY THU LYANGRECORDER (CHEDO DEVELOPMENT)
echo ========================================================
echo.
echo * Luu y: App se mo truc tiep len man hinh.
echo * Co ho tro Hot Reload va F12 DevTools de kiem tra.
echo.

call npm run dev

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Ung dung ket thuc voi ma loi %ERRORLEVEL%.
    pause
)

