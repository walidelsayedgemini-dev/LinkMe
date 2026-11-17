@echo off
chcp 65001 >nul
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

echo.
echo [1/2] تشغيل السيرفر المحلي على المنفذ 3000...
echo [2/2] فتح المنصة في المتصفح تلقائياً...
echo.
echo --------------------------------------------------------
echo    الرابط: http://localhost:3000
echo    حساب الطالب التجريبي: student@linkme.app (كلمة المرور: linkme123)
echo    حساب الإدارة والمالك: admin@linkme.app (كلمة المرور: linkme123)
echo --------------------------------------------------------
echo.

start "" "http://localhost:3000"
node ./node_modules/tsx/dist/cli.mjs server/_core/index.ts

pause
