@echo off
echo =========================================
echo   PULLING LATEST WIKI UPDATES FROM FMHY
echo =========================================
git fetch upstream
git merge upstream/main -X theirs --no-edit

echo =========================================
echo   CLEARING VITEPRESS CACHE & REBUILDING
echo =========================================
if exist docs\.vitepress\dist rd /s /q docs\.vitepress\dist
if exist docs\.vitepress\.vitepress rd /s /q docs\.vitepress\.vitepress
call pnpm docs:build

echo =========================================
echo   SYNCING FRESH ASSETS TO MOBILE APP
echo =========================================
call pnpm exec cap sync

echo =========================================
echo   LAUNCHING ANDROID STUDIO
echo =========================================
call pnpm exec cap open android

echo =========================================
echo   DEPLOYING LATEST TO VERCEL WEB
echo =========================================
call vercel --prod

echo =========================================
echo   DONE! Just click the Green Play button in Android Studio.
echo =========================================
pause