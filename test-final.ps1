$ErrorActionPreference = "Continue"
$apiUrl = "http://localhost:3000/api"

Write-Host "`n========== GRADIO AI SUMMARIZE TEST ==========" -ForegroundColor Cyan

# Test creating messages
Write-Host "`nStep 1: Creating test messages..." -ForegroundColor Green

$msg1 = @{
    senderId = "alice_test"
    receiverId = "bob_test"
    content = "Hi Bob, let's discuss Q4 roadmap and priorities"
    type = "text"
} | ConvertTo-Json

try {
    $r1 = Invoke-RestMethod -Uri "$apiUrl/messages" -Method POST -ContentType "application/json" -Body $msg1 -TimeoutSec 10
    Write-Host "Message 1 created: $($r1._id)" -ForegroundColor Green
} catch {
    Write-Host "ERROR creating message 1: $($_.Exception.Message)" -ForegroundColor Red
}

$msg2 = @{
    senderId = "bob_test"
    receiverId = "alice_test"
    content = "Good idea! We should focus on performance and security"
    type = "text"
} | ConvertTo-Json

try {
    $r2 = Invoke-RestMethod -Uri "$apiUrl/messages" -Method POST -ContentType "application/json" -Body $msg2 -TimeoutSec 10
    Write-Host "Message 2 created: $($r2._id)" -ForegroundColor Green
} catch {
    Write-Host "ERROR creating message 2: $($_.Exception.Message)" -ForegroundColor Red
}

$msg3 = @{
    senderId = "alice_test"
    receiverId = "bob_test"
    content = "Perfect. Let's also improve error handling"
    type = "text"
} | ConvertTo-Json

try {
    $r3 = Invoke-RestMethod -Uri "$apiUrl/messages" -Method POST -ContentType "application/json" -Body $msg3 -TimeoutSec 10
    Write-Host "Message 3 created: $($r3._id)" -ForegroundColor Green
} catch {
    Write-Host "ERROR creating message 3: $($_.Exception.Message)" -ForegroundColor Red
}

# Check unseen before
Write-Host "`nStep 2: Check unseen messages BEFORE summarization..." -ForegroundColor Green

try {
    $before = Invoke-RestMethod -Uri "$apiUrl/messages/unseen/alice_test/bob_test" -Method GET -TimeoutSec 10
    if ($before -is [array]) {
        Write-Host "Found $($before.Count) unseen messages" -ForegroundColor Cyan
        foreach ($msg in $before) {
            Write-Host "  - $($msg.message)" -ForegroundColor Gray
        }
    } else {
        Write-Host "Found 0 unseen messages" -ForegroundColor Cyan
    }
} catch {
    Write-Host "ERROR checking unseen: $($_.Exception.Message)" -ForegroundColor Red
}

# Call summarize endpoint
Write-Host "`nStep 3: Call Gradio summarize-and-mark endpoint..." -ForegroundColor Green

$summarizeReq = @{
    userId = "alice_test"
    otherId = "bob_test"
} | ConvertTo-Json

Write-Host "Request: $summarizeReq" -ForegroundColor Gray

try {
    $summary = Invoke-RestMethod -Uri "$apiUrl/integrations/gradio/summarize-and-mark" -Method POST -ContentType "application/json" -Body $summarizeReq -TimeoutSec 60
    Write-Host "SUCCESS! Got response:" -ForegroundColor Green
    Write-Host ($summary | ConvertTo-Json -Depth 5) -ForegroundColor Yellow
} catch {
    Write-Host "ERROR calling summarize endpoint:" -ForegroundColor Red
    Write-Host "  Exception: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Response: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

# Check unseen after
Write-Host "`nStep 4: Check unseen messages AFTER summarization..." -ForegroundColor Green

try {
    $after = Invoke-RestMethod -Uri "$apiUrl/messages/unseen/alice_test/bob_test" -Method GET -TimeoutSec 10
    if ($after -is [array]) {
        Write-Host "Found $($after.Count) unseen messages (should be 0)" -ForegroundColor Cyan
    } else {
        Write-Host "Found 0 unseen messages" -ForegroundColor Cyan
    }
} catch {
    Write-Host "ERROR checking unseen after: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========== TEST COMPLETE ==========" -ForegroundColor Cyan
