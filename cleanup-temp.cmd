@echo off
cd /d C:\Users\cliny\OneDrive\Desktop\ELDawly
del /f /q diagnose.js run-diagnose.cmd test-order.cjs verify.js verify-output.txt diagnose-output.txt server.log 2>nul
echo CLEANUP_DONE
