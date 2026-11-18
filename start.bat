@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Link Me — منصة تعلّم الإنجليزية الاحترافية

echo ========================================================
echo    🚀 مرحباً بك في منصة Link Me — إنجليزي من غير ما تترجم
echo ========================================================
echo.

set "PATH=C:\Program Files\nodejs;C:\Program Files\MariaDB 13.0\bin;%PATH%"

:: التحقق من وجود Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [خطأ] Node.js غير مثبت على جهازك!
    echo يرجى تحميل وتثبيت Node.js من: https://nodejs.org
    pause
    exit /b 1
)

:: نسخ ملف .env إذا لم يكن موجوداً
if not exist ".env" (
    echo [معلومة] إنشاء ملف .env من النموذج الافتراضي...
    copy ".env.example" ".env" >nul
)

:: التحقق من مجلد node_modules
if not exist "node_modules" (
    echo [تنبيه] تثبيت الحزم المطلوبة لأول مرة (قد يستغرق دقائق)...
    call npm install
)

:: 1. التحقق من تشغيل قاعدة البيانات MariaDB وتشغيلها تلقائياً
netstat -ano | findstr :3306 | findstr LISTENING >nul
if %errorlevel% neq 0 (
    if exist "C:\Program Files\MariaDB 13.0\bin\mysqld.exe" (
        echo [1/3] جاري بدء تشغيل قاعدة البيانات MariaDB...
        start /b "" "C:\Program Files\MariaDB 13.0\bin\mysqld.exe" --defaults-file="C:\Program Files\MariaDB 13.0\data\my.ini"
        timeout /t 4 /nobreak >nul
    ) else (
        echo [تنبيه] لم يتم العثور على MariaDB محلياً، تأكد من تشغيل MySQL على المنفذ 3306.
    )
) else (
    echo [1/3] قاعدة البيانات تعمل بالفعل (Port 3306).
)

echo [2/3] تشغيل السيرفر المحلي على المنفذ 3000...
echo [3/3] فتح المنصة في المتصفح تلقائياً...
echo.
echo --------------------------------------------------------
echo    الرابط: http://localhost:3000
echo    حساب الطالب التجريبي: student@linkme.app (كلمة المرور: linkme123)
echo    حساب الإدارة والمالك: admin@linkme.app (كلمة المرور: linkme123)
echo    رقم فودافون كاش: 01022412243
echo --------------------------------------------------------
echo.

start "" "http://localhost:3000"
node ./node_modules/tsx/dist/cli.mjs server/_core/index.ts

pause
