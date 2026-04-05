$ErrorActionPreference = 'Stop'
$base = 'http://localhost:3000'
$credsPath = '.tmp-smoke-creds.json'
$resultsPath = '.tmp-smoke-results.json'

if (-not (Test-Path $credsPath)) {
  throw 'Missing .tmp-smoke-creds.json'
}

$creds = Get-Content $credsPath | ConvertFrom-Json
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$results = New-Object System.Collections.Generic.List[object]

function Add-Result([string]$name, [bool]$ok, [string]$detail) {
  $results.Add([pscustomobject]@{ check = $name; ok = $ok; detail = $detail })
}

function Invoke-JsonPost([string]$url, [object]$bodyObj) {
  $body = $bodyObj | ConvertTo-Json -Depth 10
  return Invoke-WebRequest -Uri $url -UseBasicParsing -WebSession $session -Method Post -ContentType 'application/json' -Body $body
}

function Get-StatusFromException($ex) {
  if ($ex.Exception.Response -and $ex.Exception.Response.StatusCode) {
    return [int]$ex.Exception.Response.StatusCode.value__
  }
  return $null
}

try {
  $r = Invoke-WebRequest -Uri ($base + '/workflow-tool') -UseBasicParsing -WebSession $session -Method Get -MaximumRedirection 5
  Add-Result 'public_workflow_tool_route' $true ('status ' + [int]$r.StatusCode)
} catch {
  Add-Result 'public_workflow_tool_route' $false $_.Exception.Message
}

try {
  $r = Invoke-JsonPost ($base + '/api/auth/login') @{ email = $creds.email; password = $creds.password }
  Add-Result 'auth_login' ($r.StatusCode -ge 200 -and $r.StatusCode -lt 300) ('status ' + [int]$r.StatusCode)
} catch {
  $status = Get-StatusFromException $_
  Add-Result 'auth_login' $false ($(if ($status) { 'status ' + $status } else { $_.Exception.Message }))
}

$draftId = $null
$filmId = $null

try {
  $r = Invoke-JsonPost ($base + '/api/workflows') @{
    title = 'Smoke Workflow Draft'
    concept = 'smoke'
    creative_direction = 'cinematic'
    selected_tools = @('runway')
    workflow_steps = @('ideate','storyboard')
    notes = 'smoke-test'
  }
  $payload = $r.Content | ConvertFrom-Json
  $draftId = $payload.draft.id
  Add-Result 'create_workflow_draft' ([bool]$draftId) ('status ' + [int]$r.StatusCode)
} catch {
  $status = Get-StatusFromException $_
  Add-Result 'create_workflow_draft' $false ($(if ($status) { 'status ' + $status } else { $_.Exception.Message }))
}

try {
  $r = Invoke-WebRequest -Uri ($base + '/api/workflows') -UseBasicParsing -WebSession $session -Method Get
  $payload = $r.Content | ConvertFrom-Json
  $count = @($payload.drafts).Count
  Add-Result 'list_workflow_drafts' ($count -ge 1) ('count ' + $count)
} catch {
  $status = Get-StatusFromException $_
  Add-Result 'list_workflow_drafts' $false ($(if ($status) { 'status ' + $status } else { $_.Exception.Message }))
}

if ($draftId) {
  try {
    $r = Invoke-JsonPost ($base + '/api/workflows/' + $draftId + '?_sub=assets') @{
      label = 'Reference Link'
      url = 'https://example.com/reference'
      source_type = 'generic'
      stage = 'Ideation'
      notes = 'smoke asset'
    }
    $payload = $r.Content | ConvertFrom-Json
    Add-Result 'add_link_asset' ([bool]$payload.asset.id) ('status ' + [int]$r.StatusCode)
  } catch {
    $status = Get-StatusFromException $_
    Add-Result 'add_link_asset' $false ($(if ($status) { 'status ' + $status } else { $_.Exception.Message }))
  }

  try {
    $r = Invoke-WebRequest -Uri ($base + '/api/workflows/' + $draftId + '/assets') -UseBasicParsing -WebSession $session -Method Get
    $payload = $r.Content | ConvertFrom-Json
    $count = @($payload.assets).Count
    Add-Result 'list_draft_assets' ($count -ge 1) ('count ' + $count)
  } catch {
    $status = Get-StatusFromException $_
    Add-Result 'list_draft_assets' $false ($(if ($status) { 'status ' + $status } else { $_.Exception.Message }))
  }

  try {
    $slug = 'smoke-film-' + [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    $r = Invoke-JsonPost ($base + '/api/films') @{
      title = 'Smoke Film From Draft'
      slug = $slug
      synopsis = 'smoke'
      description = 'smoke'
      category = 'film'
      workflow_draft_id = $draftId
      visibility = 'private'
      publish_status = 'draft'
    }
    $payload = $r.Content | ConvertFrom-Json
    $filmId = $payload.film.id
    Add-Result 'seed_draft_via_film_create' ([bool]$filmId) ('status ' + [int]$r.StatusCode)
  } catch {
    $status = Get-StatusFromException $_
    Add-Result 'seed_draft_via_film_create' $false ($(if ($status) { 'status ' + $status } else { $_.Exception.Message }))
  }

  try {
    $r = Invoke-WebRequest -Uri ($base + '/api/workflows/' + $draftId + '/film-assets') -UseBasicParsing -WebSession $session -Method Get
    $payload = $r.Content | ConvertFrom-Json
    $count = @($payload.assets).Count
    Add-Result 'list_film_linked_assets' ($count -ge 1) ('count ' + $count)
  } catch {
    $status = Get-StatusFromException $_
    Add-Result 'list_film_linked_assets' $false ($(if ($status) { 'status ' + $status } else { $_.Exception.Message }))
  }

  try {
    $r = Invoke-WebRequest -Uri ($base + '/api/profile?_sub=integrations') -UseBasicParsing -WebSession $session -Method Get
    $payload = $r.Content | ConvertFrom-Json
    $count = @($payload.integrations).Count
    Add-Result 'list_integrations_endpoint' $true ('count ' + $count)
  } catch {
    $status = Get-StatusFromException $_
    Add-Result 'list_integrations_endpoint' $false ($(if ($status) { 'status ' + $status } else { $_.Exception.Message }))
  }

  try {
    $body = @{ platform = 'runway' } | ConvertTo-Json
    $r = Invoke-WebRequest -Uri ($base + '/api/workflows?_sub=integration-sync') -UseBasicParsing -WebSession $session -Method Patch -ContentType 'application/json' -Body $body
    $payload = $r.Content | ConvertFrom-Json
    Add-Result 'integration_sync_endpoint' ([bool]$payload.ok) ('status ' + [int]$r.StatusCode)
  } catch {
    $status = Get-StatusFromException $_
    Add-Result 'integration_sync_endpoint' $false ($(if ($status) { 'status ' + $status } else { $_.Exception.Message }))
  }
}

$results | ConvertTo-Json -Depth 5 | Set-Content $resultsPath
$pass = @($results | Where-Object { $_.ok -eq $true }).Count
$fail = @($results | Where-Object { $_.ok -ne $true }).Count
Write-Output ('SMOKE_RESULTS_READY pass=' + $pass + ' fail=' + $fail)
