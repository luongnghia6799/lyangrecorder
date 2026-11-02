@echo off
setlocal
title LyangRecorder - Test Production Unpacked

echo ========================================================
echo       BUILD & TEST LYANGRECORDER (UNPACKED EXE)
echo ========================================================
echo.
echo * Che do nay tao thu muc chay truc tiep release\win-unpacked\
echo * Khong mat thoi gian nen file portable, test giong 100 phan tram ban thuc te.
echo.

echo [1/4] Chuan bi native helpers va ffmpeg...
call npm run build:platform-native-helpers
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Build native helpers that bai.
    goto :error
)
echo.

echo [2/4] Build Vite va Electron Main...
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

call node scripts/normalize-electron-main-cjs.mjs
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Chuan hoa Electron Main that bai.
    goto :error
)

echo.
echo [3/4] Tao ban Unpacked bang electron-builder...
call npx electron-builder --win --dir
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Tao ban unpacked that bai.
    goto :error
)

echo.
echo [4/4] Dang khoi chay LyangRecorder.exe...
start "" "release\win-unpacked\LyangRecorder.exe"

echo Da khoi chay app thanh cong!
goto :end

:error
echo.
echo Da xay ra loi trong qua trinh thuc hien!
pause

:end

