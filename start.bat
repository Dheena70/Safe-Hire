@echo off
REM Starts the SAFE HIRE backend (Flask, port 5050) and frontend (CRA, port 3000)
REM together, each in its own window. Run from the project root:
REM
REM   start.bat
REM
REM Close either window to stop that service.

cd /d "%~dp0backend"

echo Installing backend packages (this can take a minute the first time)...
python -m pip install -q -r requirements.txt

if not exist ".env" (
    echo No backend\.env found - copying .env.example. Edit it before real use.
    copy .env.example .env
)

start "SAFE HIRE backend" cmd /k python app.py

cd /d "%~dp0frontend"
start "SAFE HIRE frontend" cmd /k npm start

echo.
echo Backend:  http://localhost:5050
echo Frontend: http://localhost:3000
echo Two windows just opened - close them to stop each service.
