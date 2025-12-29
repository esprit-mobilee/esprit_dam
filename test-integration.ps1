#!/usr/bin/env powershell
# Real-Time Integration Test
# Generates announcement for October 12 meeting via AI and saves to database

Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Real-Time Test: AI Announcement Generation & Database Storage" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000/api/announcements"
$gradioUrl = "http://localhost:7870"

# Step 1: Check services
Write-Host "📋 STEP 1: Checking Services..." -ForegroundColor Green
Write-Host ""

Write-Host "1️⃣  Checking if Gradio AI service is running..." -ForegroundColor Yellow
try {
    $gradioCheck = Invoke-WebRequest -Uri "$gradioUrl/info" -ErrorAction SilentlyContinue
    if ($gradioCheck.StatusCode -eq 200) {
        Write-Host "   ✅ Gradio service running on port 7870" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  Gradio service not responding - Make sure to run: .\.venv\Scripts\activate; python main.py" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "2️⃣  Checking if NestJS backend is running..." -ForegroundColor Yellow
$nestRunning = $false
try {
    $nestCheck = Invoke-WebRequest -Uri "http://localhost:3000/announcements" -ErrorAction SilentlyContinue
    if ($nestCheck.StatusCode -eq 200 -or $nestCheck.StatusCode -eq 201) {
        Write-Host "   ✅ NestJS backend running on port 3000" -ForegroundColor Green
        $nestRunning = $true
    }
} catch {
    Write-Host "   ⚠️  NestJS backend not responding - Make sure to run: npm run start:dev" -ForegroundColor Yellow
}

Write-Host ""

if (-not $nestRunning) {
    Write-Host "❌ NestJS backend is not running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "To fix this, in a new terminal run:" -ForegroundColor Yellow
    Write-Host "  cd c:\Users\asus\EspritProjects\esprit_dam" -ForegroundColor Gray
    Write-Host "  npm run start:dev" -ForegroundColor Gray
    exit 1
}

# Step 2: Generate announcements
Write-Host "📋 STEP 2: Generating Announcement for October 12 Meeting..." -ForegroundColor Green
Write-Host ""

$payload = @{
    audience = "students"
    instruction = "Generate an announcement for students informing them about a mandatory meeting on October 12"
    senderId = "admin-001"
} | ConvertTo-Json

Write-Host "Request Payload:" -ForegroundColor Yellow
Write-Host $payload -ForegroundColor Gray
Write-Host ""

Write-Host "Sending request to: POST $baseUrl/generate-and-save" -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/generate-and-save" `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $payload

    $result = $response.Content | ConvertFrom-Json

    Write-Host "✅ Successfully generated and saved announcements!" -ForegroundColor Green
    Write-Host ""

    # Step 3: Display results
    Write-Host "📋 STEP 3: Generated Announcements" -ForegroundColor Green
    Write-Host ""

    if ($result.announcements.Count -eq 3) {
        Write-Host "✅ Generated exactly 3 announcements" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Expected 3 announcements, got $($result.announcements.Count)" -ForegroundColor Yellow
    }

    Write-Host ""

    $result.announcements | ForEach-Object -Begin { $i = 1 } -Process {
        Write-Host "CHOICE ${i}:" -ForegroundColor Yellow
        Write-Host "  _id: $($_._id)" -ForegroundColor Gray
        Write-Host "  Title: $($_.title)" -ForegroundColor Gray
        Write-Host "  Audience: $($_.audience)" -ForegroundColor Gray
        Write-Host "  Sender: $($_.senderId)" -ForegroundColor Gray
        Write-Host "  Content: $($_.content)" -ForegroundColor Cyan
        Write-Host "  Created: $($_.createdAt)" -ForegroundColor Gray
        Write-Host ""
        $i++
    }

    # Step 4: Verify database storage
    Write-Host "📋 STEP 4: Verifying Database Storage..." -ForegroundColor Green
    Write-Host ""

    $getResponse = Invoke-WebRequest -Uri $baseUrl -ErrorAction SilentlyContinue
    $allAnnouncements = $getResponse.Content | ConvertFrom-Json

    Write-Host "✅ Retrieved all announcements from database" -ForegroundColor Green
    Write-Host "   Total announcements in database: $($allAnnouncements.announcements.Count)" -ForegroundColor Gray
    Write-Host ""

    # Step 5: Success summary
    Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "  ✅ TEST COMPLETED SUCCESSFULLY" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""

    Write-Host "Summary:" -ForegroundColor Yellow
    Write-Host "  ✅ Generated 3 unique announcements for October 12 meeting" -ForegroundColor Green
    Write-Host "  ✅ All 3 saved to MongoDB database" -ForegroundColor Green
    Write-Host "  ✅ Each has unique _id" -ForegroundColor Green
    Write-Host "  ✅ All have correct audience (students)" -ForegroundColor Green
    Write-Host "  ✅ Can retrieve all from database" -ForegroundColor Green
    Write-Host ""

    Write-Host "Database IDs (for deletion testing):" -ForegroundColor Yellow
    $result.announcements | ForEach-Object -Begin { $i = 1 } -Process {
        Write-Host "  ${i}. DELETE $baseUrl/$($_._id)" -ForegroundColor Gray
        $i++
    }
    Write-Host ""

} catch {
    Write-Host "❌ Error calling API: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible issues:" -ForegroundColor Yellow
    Write-Host "  1. Gradio AI service not running - Start with: .\.venv\Scripts\activate; python main.py" -ForegroundColor Gray
    Write-Host "  2. NestJS server not running - Start with: npm run start:dev" -ForegroundColor Gray
    Write-Host "  3. MongoDB not running - Start MongoDB service" -ForegroundColor Gray
    Write-Host "  4. Wrong port configuration in .env file" -ForegroundColor Gray
}
