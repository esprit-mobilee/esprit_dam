# Complete AI Summarize Test Script
# This script will automatically test the entire Gradio summarization flow

$ErrorActionPreference = "Continue"

# ============================================
# COLORS AND LOGGING
# ============================================
function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] " -ForegroundColor Green -NoNewline
    Write-Host $Message
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] " -ForegroundColor Red -NoNewline
    Write-Host $Message
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] " -ForegroundColor Cyan -NoNewline
    Write-Host $Message
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] " -ForegroundColor Yellow -NoNewline
    Write-Host $Message
}

# ============================================
# STEP 1: CHECK SERVICES
# ============================================
Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "GRADIO AI SUMMARIZE - COMPLETE TEST SUITE" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

Write-Info "Checking service availability...`n"

# Check MongoDB
try {
    $mongoCheck = Get-NetTCPConnection -LocalPort 27017 -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" }
    if ($mongoCheck) {
        Write-Success "MongoDB is running on port 27017"
        $mongoOk = $true
    } else {
        Write-Error "MongoDB is NOT running on port 27017"
        $mongoOk = $false
    }
} catch {
    Write-Error "Failed to check MongoDB"
    $mongoOk = $false
}

# Check Gradio (try 7870 first, then 7860)
$gradioPort = $null
try {
    $gradioCheck = Invoke-WebRequest -Uri "http://localhost:7870/config" -Method GET -ErrorAction SilentlyContinue
    if ($gradioCheck.StatusCode -eq 200) {
        Write-Success "Gradio is running on port 7870"
        $gradioPort = 7870
        $gradioOk = $true
    }
} catch {
    try {
        $gradioCheck = Invoke-WebRequest -Uri "http://localhost:7860/config" -Method GET -ErrorAction SilentlyContinue
        if ($gradioCheck.StatusCode -eq 200) {
            Write-Success "Gradio is running on port 7860"
            $gradioPort = 7860
            $gradioOk = $true
        }
    } catch {
        Write-Error "Gradio is NOT running on ports 7870 or 7860"
        $gradioOk = $false
    }
}

# Check NestJS
try {
    $nestCheck = Invoke-WebRequest -Uri "http://localhost:3000/api/messages" -Method GET -ErrorAction SilentlyContinue
    if ($nestCheck.StatusCode -eq 200 -or $nestCheck.StatusCode -eq 401) {
        Write-Success "NestJS is running on port 3000"
        $nestOk = $true
    } else {
        Write-Error "NestJS returned unexpected status: $($nestCheck.StatusCode)"
        $nestOk = $false
    }
} catch {
    Write-Error "NestJS is NOT running on port 3000"
    $nestOk = $false
}

Write-Host ""

if (-not ($mongoOk -and $gradioOk -and $nestOk)) {
    Write-Error "Not all services are running!`n"
    Write-Warning "Please ensure the following are started in separate terminals:`n"
    if (-not $mongoOk) { Write-Host "  1. MongoDB (port 27017)" }
    if (-not $gradioOk) { Write-Host "  2. Gradio (port 7870 or 7860)" }
    if (-not $nestOk) { Write-Host "  3. NestJS (port 3000)" }
    Write-Host ""
    exit 1
}

Write-Success "All services are running!`n"

# ============================================
# STEP 2: CREATE TEST MESSAGES
# ============================================
Write-Host "`n--- STEP 1: Creating Test Messages ---`n" -ForegroundColor Magenta

$userId1 = "test_user_alice_$(Get-Random)"
$userId2 = "test_user_bob_$(Get-Random)"
$apiUrl = "http://localhost:3000/api"

Write-Info "User 1 ID: $userId1"
Write-Info "User 2 ID: $userId2`n"

$messages = @(
    @{
        senderId = $userId1
        receiverId = $userId2
        content = "Hi Bob, I wanted to discuss our Q4 roadmap and the upcoming milestones for our team's development"
        type = "text"
    },
    @{
        senderId = $userId2
        receiverId = $userId1
        content = "Great idea! I think backend performance optimization should be our top priority this quarter. We also need to address the technical debt."
        type = "text"
    },
    @{
        senderId = $userId1
        receiverId = $userId2
        content = "Absolutely agree. We should also consider implementing better error handling and improving our API documentation."
        type = "text"
    },
    @{
        senderId = $userId2
        receiverId = $userId1
        content = "Perfect points. I'll prepare a detailed breakdown of the estimated timeline and resource allocation for each initiative by tomorrow."
        type = "text"
    },
    @{
        senderId = $userId1
        receiverId = $userId2
        content = "Excellent. Let's schedule a team meeting on Wednesday to review everything and finalize our plan."
        type = "text"
    }
)

$createdMessageIds = @()

for ($i = 0; $i -lt $messages.Count; $i++) {
    $msg = $messages[$i]
    $body = $msg | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$apiUrl/messages" `
            -Method POST `
            -ContentType "application/json" `
            -Body $body `
            -ErrorAction Stop
        
        $createdMessageIds += $response._id
        Write-Success "Message $($i+1) created: '$($msg.content.Substring(0, 60))...'"
        Start-Sleep -Milliseconds 300
    } catch {
        Write-Error "Failed to create message $($i+1): $($_.Exception.Message)"
    }
}

Write-Host ""

if ($createdMessageIds.Count -eq 0) {
    Write-Error "No messages were created. Cannot proceed with test.`n"
    exit 1
}

Write-Success "Total messages created: $($createdMessageIds.Count)`n"

# ============================================
# STEP 3: CHECK UNSEEN MESSAGES BEFORE SUMMARIZATION
# ============================================
Write-Host "`n--- STEP 2: Check Unseen Messages BEFORE Summarization ---`n" -ForegroundColor Magenta

try {
    $unreadBefore = Invoke-RestMethod -Uri "$apiUrl/messages/unseen/$userId1/$userId2" `
        -Method GET `
        -ErrorAction Stop
    
    $unreadCount = if ($unreadBefore -is [array]) { $unreadBefore.Count } else { if ($unreadBefore) { 1 } else { 0 } }
    
    Write-Info "Messages from user $userId2 to user $userId1`: $unreadCount"
    
    if ($unreadCount -gt 0) {
        Write-Host ""
        foreach ($msg in $unreadBefore) {
            Write-Host "  - $($msg.message)" -ForegroundColor Green
        }
    }
    Write-Host ""
} catch {
    Write-Error "Failed to fetch unseen messages: $($_.Exception.Message)`n"
    exit 1
}

# ============================================
# STEP 4: CALL SUMMARIZE ENDPOINT
# ============================================
Write-Host "`n--- STEP 3: Call Gradio Summarize Endpoint ---`n" -ForegroundColor Magenta

$summarizeBody = @{
    userId = $userId1
    otherId = $userId2
} | ConvertTo-Json

Write-Info "Sending summarization request...`n"
Write-Info "Request body:"
Write-Host $summarizeBody -ForegroundColor Cyan
Write-Host ""

try {
    $summary = Invoke-RestMethod -Uri "$apiUrl/integrations/gradio/summarize-and-mark" `
        -Method POST `
        -ContentType "application/json" `
        -Body $summarizeBody `
        -ErrorAction Stop
    
    Write-Success "Summarization completed successfully!`n"
    Write-Host "Response:" -ForegroundColor Cyan
    Write-Host ($summary | ConvertTo-Json -Depth 5) -ForegroundColor Yellow
    Write-Host ""
    
    $summarizeSuccess = $true
} catch {
    Write-Error "Summarization failed: $($_.Exception.Message)`n"
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
    Write-Host ""
    $summarizeSuccess = $false
}

# ============================================
# STEP 5: VERIFY MARK AS READ
# ============================================
Write-Host "`n--- STEP 4: Verify Messages Marked as Read ---`n" -ForegroundColor Magenta

try {
    $unreadAfter = Invoke-RestMethod -Uri "$apiUrl/messages/unseen/$userId1/$userId2" `
        -Method GET `
        -ErrorAction Stop
    
    $unreadCountAfter = if ($unreadAfter -is [array]) { $unreadAfter.Count } else { if ($unreadAfter) { 1 } else { 0 } }
    
    Write-Info "Messages from user $userId2 to user $userId1 (after summarization): $unreadCountAfter"
    
    if ($unreadCountAfter -eq 0) {
        Write-Success "All messages successfully marked as read!`n"
        $markAsReadSuccess = $true
    } else {
        Write-Warning "Found $unreadCountAfter unread messages (expected 0)`n"
        $markAsReadSuccess = $false
    }
} catch {
    Write-Error "Failed to check unseen messages: $($_.Exception.Message)`n"
    $markAsReadSuccess = $false
}

# ============================================
# STEP 6: TEST WITH DIRECT MESSAGES ARRAY
# ============================================
Write-Host "`n--- STEP 5: Test Direct Messages Array (Bonus) ---`n" -ForegroundColor Magenta

$directMessages = @{
    messages = @(
        @{
            sender = "Manager"
            message = "We need to improve our system performance"
        },
        @{
            sender = "Developer"
            message = "I suggest implementing caching and database optimization"
        },
        @{
            sender = "Manager"
            message = "Good idea. Let's also consider load testing"
        }
    )
} | ConvertTo-Json

Write-Info "Testing with direct message array...`n"

try {
    $directSummary = Invoke-RestMethod -Uri "$apiUrl/integrations/gradio/summarize-and-mark" `
        -Method POST `
        -ContentType "application/json" `
        -Body $directMessages `
        -ErrorAction Stop
    
    Write-Success "Direct message summarization successful!`n"
    Write-Host "Summary:" -ForegroundColor Cyan
    Write-Host ($directSummary | ConvertTo-Json -Depth 5) -ForegroundColor Yellow
    Write-Host ""
    $directSummarySuccess = $true
} catch {
    Write-Warning "Direct message test failed: $($_.Exception.Message) (This is optional)`n"
    $directSummarySuccess = $false
}

# ============================================
# FINAL REPORT
# ============================================
Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "TEST RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

$results = @{
    "Services Running" = $mongoOk -and $gradioOk -and $nestOk
    "Messages Created" = $createdMessageIds.Count -gt 0
    "Messages Unseen Before" = $unreadCount -gt 0
    "Summarization Success" = $summarizeSuccess
    "Messages Marked as Read" = $markAsReadSuccess
    "Direct Message Test" = $directSummarySuccess
}

$allPassed = $true
foreach ($test in $results.GetEnumerator()) {
    $status = if ($test.Value) { "PASS" } else { "FAIL" }
    $color = if ($test.Value) { "Green" } else { "Red" }
    Write-Host "$($test.Key): " -NoNewline
    Write-Host $status -ForegroundColor $color
    
    if (-not $test.Value) {
        $allPassed = $false
    }
}

Write-Host ""

if ($allPassed) {
    Write-Success "ALL TESTS PASSED! The Gradio AI Summarize function is working perfectly!`n"
    exit 0
} else {
    Write-Error "Some tests failed. Please review the errors above.`n"
    exit 1
}
