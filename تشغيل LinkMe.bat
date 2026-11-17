@echo off
chcp 65001 > nul
title تشغيل منصة Link Me
echo ========================================================
echo          جاري تشغيل منصة Link Me محلياً 🚀
echo ========================================================
echo.

set PATH=C:\Program Files\nodejs;C:\Program Files\MariaDB 13.0\bin;%PATH%

:: 1. التحقق من تشغيل قاعدة البيانات
netstat -ano | findstr :3306 | findstr LISTENING > nul
if %errorlevel% neq 0 (
    echo [1/3] جاري بدء تشغيل قاعدة البيانات MariaDB...
    start /b "" "C:\Program Files\MariaDB 13.0\bin\mysqld.exe" --defaults-file="C:\Program Files\MariaDB 13.0\data\my.ini"
    timeout /t 3 /nobreak > nul
) else (
    echo [1/3] قاعدة البيانات MySQL تعمل بالفعل (Port 3306).
)

:: 2. التحقق من تشغيل السيرفر
netstat -ano | findstr :3300 | findstr LISTENING > nul
netstat -ano | findstr :3000 | findstr LISTENING > nul
if %errorlevel% neq 0 (
    echo [2/3] جاري تشغيل سيرفر Link Me (Port 3000)...
    start /b "" "C:\Program Files\nodejs\node.exe" ./node_modules/tsx/dist/cli.mjs server/_core/index.ts
    timeout /t 4 /nobreak > nul
) else (
    echo [2/3] سيرفر Link Me يعمل بالفعل (Port 3000).
)

:: 3. فتح الموقع في المتصفح
echo [3/3] جاري فتح الموقع في المتصفح...
start http://localhost:3000

echo.
echo ========================================================
echo المنصة جاهزة وتعمل على: http://localhost:3000
echo.
echo بيانات الدخول:
echo   - حساب الطالب: student@linkme.app  (كلمة المرور: linkme123)
echo   - لوحة الإدارة: admin@linkme.app    (كلمة المرور: linkme123)
echo   - رقم فودافون كاش: 01022412243
echo ========================================================
echo.
pause
