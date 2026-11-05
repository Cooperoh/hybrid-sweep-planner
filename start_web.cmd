@echo off
setlocal
cd /d "%~dp0"
python -B -m planner.web_server --open %*
if errorlevel 1 pause
