#!/usr/bin/env pwsh

$ErrorActionPreference = "Stop"
$apiUrl = "http://localhost:3000/api"

Write-Host "`n=== GRADIO AI SUMMARIZE FUNCTION TEST ===" -ForegroundColor Cyan

# Test 1: Create messages
Write-Host "`n[TEST 1] Creating test messages..." -ForegroundColor Magenta
$msgIds = @()

try {
    $msg1 = @{
        senderId = "alice001"
        receiverId = "bob001"
        content = "Hi Bob, let's discuss the Q4 roadmap priorities"
        type = "text"
    } | ConvertTo-Json

    $r1 = Invoke-RestMethod -Uri "$apiUrl/messages" -Method POST -ContentType "application/json" -Body $msg1
    $msgIds += $r1._id
    Write-Host "Created message: $($r1.content)" -ForegroundColor Green

    $msg2 = @{
        senderId = "bob001"
        receiverId = "alice001"
        content = "Great! We should focus on backend performance and security improvements"
        type = "text"
    } | ConvertTo-Json

    $r2 = Invoke-RestMethod -Uri "$apiUrl/messages" -Method POST -ContentType "application/json" -Body $msg2
    $msgIds += $r2._id
    Write-Host "Created message: $($r2.content)" -ForegroundColor Green
} catch {
    Write-Host "❌ Error creating messages: $_" -ForegroundColor Red
    exit 1
}

# Test 2: Check unseen BEFORE
Write-Host "`n[TEST 2] Unseen messages BEFORE summarization..." -ForegroundColor Magenta
try {
    $unseen = Invoke-RestMethod -Uri "$apiUrl/messages/unseen/alice001/bob001" -Method GET
    Write-Host "Found $($unseen.Count) unseen messages" -ForegroundColor Yellow
    if ($null -ne $unseen) {
        $unseen | ForEach-Object { Write-Host "  - $($_.message)" -ForegroundColor Gray }
    }
} catch {
    Write-Host "❌ Error fetching unseen: $_" -ForegroundColor Red
    exit 1
}

# Test 3: Call summarize endpoint
Write-Host "`n[TEST 3] Calling Gradio summarize endpoint..." -ForegroundColor Magenta
$summarizeReq = @{
    userId = "alice001"
    otherId = "bob001"
} | ConvertTo-Json

try {
    $summary = Invoke-RestMethod -Uri "$apiUrl/integrations/gradio/summarize-and-mark" -Method POST -ContentType "application/json" -Body $summarizeReq -TimeoutSec 60
    Write-Host "✅ SUCCESS! Summary:" -ForegroundColor Green
    Write-Host ($summary | ConvertTo-Json) -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: $_" -ForegroundColor Red
    exit 1
}

# Test 4: Check unseen AFTER
Write-Host "`n[TEST 4] Unseen messages AFTER summarization..." -ForegroundColor Magenta
try {
    $unseenAfter = Invoke-RestMethod -Uri "$apiUrl/messages/unseen/alice001/bob001" -Method GET
    Write-Host "Found $($unseenAfter.Count) unseen messages (should be 0)" -ForegroundColor Yellow

    if ($unseenAfter.Count -eq 0) {
        Write-Host "✅ SUCCESS! All messages marked as read!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ WARNING: Messages are still unread" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error checking final state: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== TEST COMPLETE ===" -ForegroundColor Cyan
Write-Host ""