param(
  [string]$BaseUrl = "http://localhost:4000/api/v1"
)

$ErrorActionPreference = "Stop"

function Invoke-JsonPost {
  param(
    [string]$Path,
    [hashtable]$Body,
    [string]$Token = ""
  )

  $headers = @{}

  if ($Token) {
    $headers.Authorization = "Bearer $Token"
  }

  $response = Invoke-WebRequest "$BaseUrl/$Path" `
    -UseBasicParsing `
    -Method Post `
    -ContentType "application/json" `
    -Headers $headers `
    -Body ($Body | ConvertTo-Json -Depth 8)

  ,($response.Content | ConvertFrom-Json)
}

function Invoke-JsonGet {
  param(
    [string]$Path,
    [string]$Token = ""
  )

  $headers = @{}

  if ($Token) {
    $headers.Authorization = "Bearer $Token"
  }

  $response = Invoke-WebRequest "$BaseUrl/$Path" `
    -UseBasicParsing `
    -Headers $headers

  ,($response.Content | ConvertFrom-Json)
}

$health = Invoke-JsonGet "health"

if ($health.status -ne "ok") {
  throw "Health check failed"
}

$teacherLogin = Invoke-JsonPost "auth/login" @{
  email = "teacher@example.com"
  password = "password"
  role = "teacher"
}
$teacherToken = $teacherLogin.accessToken

if (-not $teacherToken) {
  throw "Teacher login did not return an access token"
}

$teacherClasses = Invoke-JsonGet "teacher/classes" $teacherToken

if ($teacherClasses.Count -lt 1) {
  throw "Teacher class list is empty"
}

$studentLogin = Invoke-JsonPost "auth/login" @{
  email = "student@example.com"
  password = "password"
  role = "student"
}
$studentToken = $studentLogin.accessToken

if (-not $studentToken) {
  throw "Student login did not return an access token"
}

$assignments = Invoke-JsonGet "student/assignments" $studentToken

if ($assignments.Count -lt 1) {
  throw "Student assignment list is empty"
}

$assignmentId = $assignments[0].id
$wordSet = Invoke-JsonGet "student/word-sets/$assignmentId" $studentToken
$word = @($wordSet.wordsList)[0]

if (-not $word.id) {
  throw "Student word-set details did not include words"
}

$practice = Invoke-JsonPost "student/practice-sessions" @{
  assignmentId = $assignmentId
  mode = "writing"
  attempts = @(
    @{
      wordId = $word.id
      status = "correct"
      answeredAt = (Get-Date).ToUniversalTime().ToString("o")
    }
  )
} $studentToken

if ($practice.correctAnswers -lt 1) {
  throw "Practice submission did not record a correct answer"
}

$progress = Invoke-JsonGet "student/progress/words" $studentToken

if ($progress.Count -lt 1) {
  throw "Student progress list is empty"
}

$analytics = Invoke-JsonGet "teacher/analytics" $teacherToken

if ($analytics.totalStudents -lt 1 -or $analytics.totalWordSets -lt 1) {
  throw "Teacher analytics totals are empty"
}

[ordered]@{
  health = $health.status
  teacherClasses = $teacherClasses.Count
  studentAssignments = $assignments.Count
  submittedPracticeWordId = $word.id
  progressWords = $progress.Count
  analyticsTotalStudents = $analytics.totalStudents
  analyticsTotalWordSets = $analytics.totalWordSets
  analyticsProblemWords = @($analytics.problemWords).Count
} | ConvertTo-Json -Depth 4
