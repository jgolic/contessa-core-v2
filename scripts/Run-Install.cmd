@echo off
setlocal

set "NPM_CMD=%ProgramFiles%\nodejs\npm.cmd"
if not exist "%NPM_CMD%" set "NPM_CMD=%LocalAppData%\Programs\nodejs\npm.cmd"
if not exist "%NPM_CMD%" set "NPM_CMD=npm"

"%NPM_CMD%" install --ignore-scripts
