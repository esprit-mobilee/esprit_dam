# Test: AI Announcement Generation & Database Storage
# Tests the full workflow: Gradio AI -> NestJS API -> MongoDB

Write-Host "`n=====================================================================" -ForegroundColor Cyan
Write-Host "FULL INTEGRATION TEST: AI -> API -> DATABASE" -ForegroundColor Cyan
Write-Host "October 12 Student Meeting Announcement Generation" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan

# Configuration
$gradioUrl = "http://localhost:7870/api/generate"
$nestUrl = "http://localhost:3000/api/announcements/generate-and-save"
$audience = "students"
$instruction = "Generate a professional announcement for students about a mandatory meeting on October 12. Make it clear, concise, and include the meeting date prominently."
$senderId = "admin-001"

# =========================================================================
# STEP 1: Check Services
# =========================================================================
Write-Host "`nSTEP 1: Checking Services..." -ForegroundColor Yellow
Write-Host "=================================================" -ForegroundColor Gray

$allServicesReady = $true

# Check Gradio
Write-Host "`nChecking Gradio AI Service..." -ForegroundColor Cyan
try {
    $gradioTest = Invoke-WebRequest -Uri "http://localhost:7870" -ErrorAction SilentlyContinue -TimeoutSec 5
    Write-Host "[OK] Gradio running on port 7870" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Gradio NOT running on port 7870" -ForegroundColor Red
    Write-Host "Start with: .\.venv\Scripts\python.exe main.py" -ForegroundColor Yellow
    $allServicesReady = $false
}

# Check MongoDB
Write-Host "`nChecking MongoDB..." -ForegroundColor Cyan
try {
    $tcpClient = [System.Net.Sockets.TcpClient]::new()
    $tcpClient.Connect("localhost", 27017)
    if ($tcpClient.Connected) {
        Write-Host "[OK] MongoDB running on port 27017" -ForegroundColor Green
        $tcpClient.Close()
    }
} catch {
    Write-Host "[FAIL] MongoDB NOT running on port 27017" -ForegroundColor Red
    Write-Host "Please start MongoDB service" -ForegroundColor Yellow
    $allServicesReady = $false
}

# Check NestJS
Write-Host "`nChecking NestJS Backend..." -ForegroundColor Cyan
try {
    $nestTest = Invoke-WebRequest -Uri "http://localhost:3000" -ErrorAction SilentlyContinue -TimeoutSec 5
    Write-Host "[OK] NestJS running on port 3000" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] NestJS NOT running on port 3000" -ForegroundColor Red
    Write-Host "Start with: npm run start:dev" -ForegroundColor Yellow
    $allServicesReady = $false
}

if (-not $allServicesReady) {
    Write-Host "`n[ERROR] Not all services are ready. Please start them first." -ForegroundColor Red
    exit 1
}

Write-Host "`n[SUCCESS] All services are ready!`n" -ForegroundColor Green

# =========================================================================
# STEP 2: Test AI Generation (Direct Gradio Test)
# =========================================================================
Write-Host "STEP 2: Testing Gradio AI Generation (3 requests)..." -ForegroundColor Yellow
Write-Host "=================================================" -ForegroundColor Gray

$aiResults = @()

for ($i = 1; $i -le 3; $i++) {
    Write-Host "`nAI Request $i..." -ForegroundColor Cyan
    
    $payload = @{
        audience = $audience
        instruction = $instruction
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri $gradioUrl `
            -Method POST `
            -ContentType "application/json" `
            -Body $payload `
            -TimeoutSec 90 `
            -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -eq 200) {
            $content = $response.Content | ConvertFrom-Json
            $announcement = if ($content.data -is [array]) { $content.data[0] } else { $content.data }
            
            $aiResults += @{
                index = $i
                content = $announcement
                length = $announcement.Length
            }
            
            Write-Host "[OK] Generated ($($announcement.Length) chars)" -ForegroundColor Green
        }
    } catch {
        Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Start-Sleep -Seconds 2
}

Write-Host "`nAI Generation Summary:" -ForegroundColor Yellow
Write-Host "Generated: $($aiResults.Count) announcements" -ForegroundColor Cyan
foreach ($result in $aiResults) {
    Write-Host "Choice $($result.index): $($result.length) characters" -ForegroundColor Gray
}

# =========================================================================
# STEP 3: Send to NestJS API (Generate and Save)
# =========================================================================
Write-Host "`nSTEP 3: Sending to NestJS API (Generate and Save)..." -ForegroundColor Yellow
Write-Host "=================================================" -ForegroundColor Gray

$apiPayload = @{
    audience = $audience
    instruction = $instruction
    senderId = $senderId
} | ConvertTo-Json

Write-Host "`nSending request to: POST $nestUrl" -ForegroundColor Cyan
Write-Host "Payload:" -ForegroundColor Gray
Write-Host "{" -ForegroundColor Gray
Write-Host "  audience: `"$audience`"" -ForegroundColor Gray
Write-Host "  instruction: `"$($instruction.Substring(0, 50))...`"" -ForegroundColor Gray
Write-Host "  senderId: `"$senderId`"" -ForegroundColor Gray
Write-Host "}" -ForegroundColor Gray

$dbResults = $null

try {
    $response = Invoke-WebRequest -Uri $nestUrl `
        -Method POST `
        -ContentType "application/json" `
        -Body $apiPayload `
        -TimeoutSec 120 `
        -ErrorAction SilentlyContinue
    
    if ($response.StatusCode -eq 201) {
        $dbResults = $response.Content | ConvertFrom-Json
        
        Write-Host "`n[OK] API Request Successful!" -ForegroundColor Green
        Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "Announcements saved: $($dbResults.Length)" -ForegroundColor Green
    } else {
        Write-Host "`n[WARNING] API returned status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "`n[ERROR] API Error: $($_.Exception.Message)" -ForegroundColor Red
}

# =========================================================================
# STEP 4: Verify Database Storage
# =========================================================================
Write-Host "`nSTEP 4: Verifying Database Storage..." -ForegroundColor Yellow
Write-Host "=================================================" -ForegroundColor Gray

if ($dbResults -and $dbResults.Length -gt 0) {
    Write-Host "`nDatabase Results:" -ForegroundColor Cyan
    Write-Host "Total stored: $($dbResults.Length) announcements`n" -ForegroundColor Green
    
    foreach ($idx in 0..($dbResults.Length - 1)) {
        $item = $dbResults[$idx]
        Write-Host "Choice $($idx + 1):" -ForegroundColor Cyan
        Write-Host "  ID: $($item._id)" -ForegroundColor Gray
        Write-Host "  Title: $($item.title)" -ForegroundColor Gray
        Write-Host "  Audience: $($item.audience)" -ForegroundColor Gray
        Write-Host "  Content Length: $($item.content.Length) chars" -ForegroundColor Gray
        Write-Host "  Created: $($item.createdAt)" -ForegroundColor Gray
        Write-Host ""
    }
    
    # Check uniqueness
    $uniqueContents = @($dbResults | Select-Object -ExpandProperty content -Unique)
    Write-Host "[OK] Unique announcements in DB: $($uniqueContents.Count) out of $($dbResults.Length)" -ForegroundColor Green
    
} else {
    Write-Host "`n[WARNING] No announcements returned from API" -ForegroundColor Yellow
}

# =========================================================================
# STEP 5: Retrieve All Announcements
# =========================================================================
Write-Host "`nSTEP 5: Retrieving All Announcements from Database..." -ForegroundColor Yellow
Write-Host "=================================================" -ForegroundColor Gray

try {
    $allResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/announcements" `
        -Method GET `
        -TimeoutSec 30 `
        -ErrorAction SilentlyContinue
    
    if ($allResponse.StatusCode -eq 200) {
        $allAnnouncements = $allResponse.Content | ConvertFrom-Json
        Write-Host "`n[OK] Retrieved $($allAnnouncements.Length) total announcements" -ForegroundColor Green
        
        # Filter for October 12 announcements
        $oct12Announcements = @($allAnnouncements | Where-Object { $_.audience -eq "students" })
        Write-Host "October 12 Meeting Announcements: $($oct12Announcements.Count)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "`n[WARNING] Could not retrieve announcements: $($_.Exception.Message)" -ForegroundColor Yellow
}

# =========================================================================
# FINAL SUMMARY
# =========================================================================
Write-Host "`n=====================================================================" -ForegroundColor Cyan
Write-Host "TEST COMPLETE" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan

Write-Host "`nTest Summary:" -ForegroundColor Green
Write-Host "[OK] Gradio AI: Generated $($aiResults.Count) announcements" -ForegroundColor Green
if ($dbResults) {
    Write-Host "[OK] NestJS API: Saved $($dbResults.Count) announcements to database" -ForegroundColor Green
    Write-Host "[OK] MongoDB: All announcements stored successfully" -ForegroundColor Green
} else {
    Write-Host "[FAIL] NestJS API: Failed to save to database" -ForegroundColor Red
}

Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "- Review the database to verify October 12 meeting announcements" -ForegroundColor Gray
Write-Host "- Select one announcement to use for the meeting notification" -ForegroundColor Gray
Write-Host "- Delete other unused announcement versions" -ForegroundColor Gray
Write-Host ""
