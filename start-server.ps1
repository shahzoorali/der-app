# Start Daawat E Ramzaan Prototype Server
Write-Host "-------------------------------------------" -ForegroundColor Blue
Write-Host "  Daawat E Ramzaan Prototype - Starting...  " -ForegroundColor Gold
Write-Host "-------------------------------------------" -ForegroundColor Blue
Write-Host ""

# Check if node_modules exists
if (-Not (Test-Path "node_modules")) {
    Write-Host "[!] node_modules not found. Running npm install first..." -ForegroundColor Yellow
    npm install
}

Write-Host "[+] Running development server at http://localhost:3000" -ForegroundColor Green
Write-Host "[+] Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

npm run dev
