#!/bin/bash
set -e

echo "========================================================"
echo "   🚀 مرحباً بك في منصة Link Me — إنجليزي من غير ما تترجم"
echo "========================================================"
echo ""

if ! command -v node &> /dev/null; then
    echo "[خطأ] Node.js غير مثبت على جهازك! يرجى تثبيته من https://nodejs.org"
    exit 1
fi

if [ ! -f ".env" ]; then
    echo "[معلومة] إنشاء ملف .env من النموذج الافتراضي..."
    cp .env.example .env
fi

if [ ! -d "node_modules" ]; then
    echo "[تنبيه] تثبيت الحزم المطلوبة لأول مرة..."
    npm install
fi

echo ""
echo "--------------------------------------------------------"
echo "   الرابط: http://localhost:3000"
echo "   حساب الطالب: student@linkme.app (linkme123)"
echo "   حساب الإدارة: admin@linkme.app (linkme123)"
echo "--------------------------------------------------------"
echo ""

if command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:3000" &
elif command -v open &> /dev/null; then
    open "http://localhost:3000" &
fi

npx tsx server/_core/index.ts
