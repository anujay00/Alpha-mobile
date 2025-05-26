@echo off
echo Adding firewall rule for Expo Backend Server (Port 4000)...
echo This requires administrator privileges.
echo.

REM Check if the script is run as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Error: This script requires administrator privileges.
    echo Please right-click on this file and select "Run as administrator".
    echo.
    pause
    exit /b 1
)

REM Add inbound rule for port 4000 TCP
netsh advfirewall firewall add rule name="Expo Backend Server" dir=in action=allow protocol=TCP localport=4000

echo.
echo To check if the rule was added successfully, run:
echo netsh advfirewall firewall show rule name="Expo Backend Server"
echo.
echo Test connection to your backend server from your Android device
echo at http://10.16.137.79:4000 or http://10.16.137.79:4000
echo.
pause 