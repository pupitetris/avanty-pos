@echo off

net stop Apache2.4
if errorlevel 1 pause
net start Apache2.4
if errorlevel 1 pause
