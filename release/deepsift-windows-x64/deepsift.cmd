@echo off
setlocal
set "NODE_EXE=%~dp0node.exe"
if not exist "%NODE_EXE%" (
  set "NODE_EXE=node"
)
"%NODE_EXE%" "%~dp0dist\cli\cli-entry.js" %*
