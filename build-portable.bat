@echo off
setlocal
title LyangRecorder - Portable Build

echo ========================================================
echo        DONG GOI LYANGRECORDER - PHIEN BAN PORTABLE
echo ========================================================
echo.

where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Khong tim thay Node.js tren may cua ban.
    echo Vui long cai dat Node.js truoc khi chay script.
    goto :error
)

echo [1/4] Chuan bi native helpers va whisper runtime...
call npm run build:platform-native-helpers
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Build native helpers that bai.
    goto :error
)
echo.

echo [2/4] Kiem tra TypeScript va build giao dien Vite...
call npx tsc
if %ERRORLEVEL% neq 0 (
    echo [ERROR] TypeScript check that bai.
    goto :error
)

call npx vite build --config vite.config.ts
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Vite build that bai.
    goto :error
)
echo.

echo [3/4] Chuan hoa va kiem tra Electron Main CJS...
call node scripts/normalize-electron-main-cjs.mjs
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Chuan hoa Electron Main that bai.
    goto :error
)

call node scripts/smoke-electron-main-cjs.mjs
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Smoke check that bai.
    goto :error
)
echo.

echo [4/4] Dong goi file thuc thi Portable voi electron-builder...
call npx electron-builder --win portable
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Electron builder that bai.
    goto :error
)
echo.

echo ========================================================
echo        DONG GOI PORTABLE HOAN TAT THANH CONG!
echo ========================================================
echo File thuc thi duoc luu tai thu muc: release\
echo.

if exist release (
    start "" explorer release
)

pause
exit /b 0

:error
echo.
echo ========================================================
echo                    BUILD THAT BAI!
echo ========================================================
echo Vui long kiem tra lai thong bao loi o tren.
pause
exit /b 1
