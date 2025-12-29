# Test script for Gradio Summarize Function
# This script validates that the Gradio integration works end-to-end:
# 1. Check if services are running (MongoDB, Gradio, NestJS)
# 2. Create test messages in the database
# 3. Call the summarize endpoint
# 4. Verify the response and mark-as-read functionality

$ErrorActionPreference = "Continue"

# Color output helper
function Write-Status {
    param([string]$Message, [string]$Status = "INFO")
    $timestamp = Get-Date -Format "HH:mm:ss"
    
    $colors = @{
        "INFO"    = "Cyan"
        "SUCCESS" = "Green"
        "ERROR"   = "Red"
        "WARNING" = "Yellow"
    }
    
    $color = $colors[$Status] ?? "White"
    Write-Host "[$timestamp] [$Status] " -ForegroundColor $color -NoNewline
    Write-Host $Message
}

Write-Host "`n========================================`n" -ForegroundColor Cyan
Write-Host "GRADIO SUMMARIZE FUNCTION TEST SUITE`n" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ============================================
# 1. CHECK SERVICES STATUS
# ============================================
Write-Status "Checking service availability..." "INFO"

# Check MongoDB
try {
    $mongoResponse = Get-NetTCPConnection -LocalPort 27017 -ErrorAction SilentlyContinue
    if ($mongoResponse) {
        Write-Status "MongoDB is running on port 27017" "SUCCESS"
        $mongoOk = $true
    } else {
        Write-Status "MongoDB is NOT running on port 27017" "ERROR"
        $mongoOk = $false
    }
} catch {
    Write-Status "MongoDB check failed: $_" "ERROR"
    $mongoOk = $false
}

# Check Gradio
try {
    $gradioResponse = Invoke-WebRequest -Uri "http://localhost:7870/config" -Method GET -ErrorAction SilentlyContinue
    if ($gradioResponse.StatusCode -eq 200) {
        Write-Status "Gradio is running on port 7870" "SUCCESS"
        $gradioOk = $true
    } else {
        Write-Status "Gradio returned unexpected status: $($gradioResponse.StatusCode)" "WARNING"
        $gradioOk = $false
    }
} catch {
    Write-Status "Gradio is NOT reachable on port 7870. Trying 7860..." "WARNING"
    try {
        $gradioResponse = Invoke-WebRequest -Uri "http://localhost:7860/config" -Method GET -ErrorAction SilentlyContinue
        if ($gradioResponse.StatusCode -eq 200) {
            Write-Status "Gradio is running on port 7860 (updated)" "SUCCESS"
            $gradioUrl = "http://localhost:7860"
            $gradioOk = $true
        } else {
            Write-Status "Gradio is NOT running on either port" "ERROR"
            $gradioOk = $false
        }
    } catch {
        Write-Status "Gradio is NOT running on either port" "ERROR"
        $gradioOk = $false
    }
}

# Check NestJS
try {
    $nestResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -Method GET -ErrorAction SilentlyContinue
    if ($nestResponse.StatusCode -eq 200 -or $nestResponse.StatusCode -eq 404) {
        Write-Status "NestJS is running on port 3000" "SUCCESS"
        $nestOk = $true
    } else {
        Write-Status "NestJS returned unexpected status: $($nestResponse.StatusCode)" "WARNING"
        $nestOk = $false
    }
} catch {
    Write-Status "NestJS is NOT reachable on port 3000" "ERROR"
    $nestOk = $false
}

Write-Host ""

# Check if all services are ready
if (-not ($mongoOk -and $gradioOk -and $nestOk)) {
    Write-Status "Not all services are running. Please start:" "ERROR"
    if (-not $mongoOk) { Write-Host "  - MongoDB on port 27017" }
    if (-not $gradioOk) { Write-Host "  - Gradio on port 7870/7860" }
    if (-not $nestOk) { Write-Host "  - NestJS on port 3000" }
    Write-Host ""
    exit 1
}

# ============================================
# 2. CREATE TEST MESSAGES
# ============================================
Write-Status "Creating test messages in database..." "INFO"

$userId1 = "user_001"
$userId2 = "user_002"

$messagePayloads = @(
    @{
        senderId = $userId1
        receiverId = $userId2
        content = "Hello, I wanted to discuss the Q4 roadmap"
        type = "text"
    },
    @{
        senderId = $userId2
        receiverId = $userId1
        content = "Sure! Let's start with the priority items"
        type = "text"
    },
    @{
        senderId = $userId1
        receiverId = $userId2
        content = "Agreed. We should focus on performance optimization and new features."
        type = "text"
    },
    @{
        senderId = $userId2
        receiverId = $userId1
        content = "Perfect. I'll prepare a detailed breakdown by tomorrow."
        type = "text"
    }
)

# Create messages via API
$createdMessages = @()
foreach ($payload in $messagePayloads) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3000/api/messages" `
            -Method POST `
            -ContentType "application/json" `
            -Body (ConvertTo-Json $payload) `
            -ErrorAction SilentlyContinue

        if ($response) {
            $createdMessages += $response
            Write-Status "Message created: '$($payload.content.Substring(0, 50))...'" "SUCCESS"
        } else {
            Write-Status "Failed to create message: $($payload.content.Substring(0, 50))..." "ERROR"
        }
    } catch {
        Write-Status "Error creating message: $_" "ERROR"
    }
}

Write-Host ""

if ($createdMessages.Count -eq 0) {
    Write-Status "No messages were created. Cannot proceed with summarization test." "ERROR"
    exit 1
}

Write-Status "Total messages created: $($createdMessages.Count)" "SUCCESS"
Write-Host ""

# ============================================
# 3. TEST SUMMARIZE ENDPOINT
# ============================================
Write-Status "Testing summarize and mark-as-read endpoint..." "INFO"

$summarizePayload = @{
    userId = $userId1
    otherId = $userId2
} | ConvertTo-Json

try {
    Write-Status "Sending POST request to /integrations/gradio/summarize-and-mark" "INFO"
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/integrations/gradio/summarize-and-mark" `
        -Method POST `
        -ContentType "application/json" `
        -Body $summarizePayload `
        -ErrorAction Stop

    Write-Status "Response received successfully" "SUCCESS"
    Write-Host ""
    Write-Host "Summary Result:" -ForegroundColor Cyan
    Write-Host ($response | ConvertTo-Json -Depth 5) -ForegroundColor Green
    Write-Host ""
    
    $summarizeOk = $true
} catch {
    Write-Status "Summarize endpoint failed: $_" "ERROR"
    Write-Host "Response details: $($_.Exception.Response | ConvertTo-Json)" -ForegroundColor Red
    Write-Host ""
    $summarizeOk = $false
}

# ============================================
# 4. VERIFY MARK-AS-READ
# ============================================
if ($summarizeOk) {
    Write-Status "Verifying messages are marked as read..." "INFO"
    
    try {
        $unreadResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/messages/unseen/$userId1/$userId2" `
            -Method GET `
            -ErrorAction SilentlyContinue

        if ($unreadResponse -and ($unreadResponse -is [array] -and $unreadResponse.Count -eq 0)) {
            Write-Status "All messages successfully marked as read" "SUCCESS"
        } elseif ($unreadResponse -and $unreadResponse.Count -gt 0) {
            Write-Status "Warning: $($unreadResponse.Count) messages are still unread" "WARNING"
            Write-Host ($unreadResponse | ConvertTo-Json) -ForegroundColor Yellow
        } else {
            Write-Status "Unseen messages check completed" "INFO"
        }
    } catch {
        Write-Status "Could not verify mark-as-read status: $_" "WARNING"
    }
    
    Write-Host ""
}

# ============================================
# 5. TEST WITH DIRECT MESSAGE ARRAY
# ============================================
Write-Status "Testing with direct message array (optional test)..." "INFO"

$directMessagePayload = @{
    messages = @(
        @{ sender = "Alice"; message = "What about the timeline?" },
        @{ sender = "Bob"; message = "We can start next month" },
        @{ sender = "Alice"; message = "Great, let's schedule a kickoff meeting" }
    )
} | ConvertTo-Json

try {
    Write-Status "Sending summarization request with direct message array" "INFO"
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/integrations/gradio/summarize-and-mark" `
        -Method POST `
        -ContentType "application/json" `
        -Body $directMessagePayload `
        -ErrorAction Stop

    Write-Status "Direct message array test successful" "SUCCESS"
    Write-Host ""
    Write-Host "Direct Message Summary:" -ForegroundColor Cyan
    Write-Host ($response | ConvertTo-Json -Depth 5) -ForegroundColor Green
    
} catch {
    Write-Status "Direct message array test failed: $_" "WARNING"
}

Write-Host ""

# ============================================
# 6. TEST RESULT SUMMARY
# ============================================
Write-Host "========================================`n" -ForegroundColor Cyan
Write-Host "TEST SUMMARY`n" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$testResults = @{
    "Services Running" = $mongoOk -and $gradioOk -and $nestOk
    "Messages Created" = $createdMessages.Count -gt 0
    "Summarize Endpoint" = $summarizeOk
}

foreach ($test in $testResults.GetEnumerator()) {
    $status = if ($test.Value) { "PASS" } else { "FAIL" }
    $color = if ($test.Value) { "Green" } else { "Red" }
    Write-Host "$($test.Key): " -NoNewline
    Write-Host $status -ForegroundColor $color
}

Write-Host ""

if ($testResults.Values -contains $false) {
    Write-Status "Some tests failed. Please review the output above." "ERROR"
    exit 1
} else {
    Write-Status "All tests passed! The Gradio summarize function is working correctly." "SUCCESS"
    exit 0
}
