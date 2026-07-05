@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 맛집지도를 실행합니다...
where python >nul 2>&1
if %errorlevel%==0 (
    start "" http://localhost:8765
    python -m http.server 8765
) else (
    start "" "index.html"
)
