@echo off
setlocal

set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"
if not exist "%NODE_EXE%" set "NODE_EXE=%LocalAppData%\Programs\nodejs\node.exe"
if not exist "%NODE_EXE%" set "NODE_EXE=node"

"%NODE_EXE%" "%~dp0..\contessa-app-tests.mjs"
if errorlevel 1 exit /b %errorlevel%

"%NODE_EXE%" "%~dp0..\contessa-ui-tests.mjs"
exit /b %errorlevel%
