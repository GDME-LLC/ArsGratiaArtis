param(
  [string]$Source = "public/video/hero-source.mp4",
  [string]$Output = "public/video/hero-loop-chrome.mp4",
  [string]$Poster = "public/video/hero-loop-poster.jpg"
)

$ffmpeg = Get-Command ffmpeg -ErrorAction SilentlyContinue
$ffprobe = Get-Command ffprobe -ErrorAction SilentlyContinue

if (-not $ffmpeg -or -not $ffprobe) {
  throw "ffmpeg and ffprobe must be installed and available on PATH before regenerating the hero loop."
}

if (-not (Test-Path $Source)) {
  throw "Source video not found: $Source"
}

$durationRaw = & $ffprobe.Source -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $Source
$duration = [double]::Parse($durationRaw, [System.Globalization.CultureInfo]::InvariantCulture)
$forwardDuration = [Math]::Min(7, $duration)
$forwardDurationString = $forwardDuration.ToString("0.###", [System.Globalization.CultureInfo]::InvariantCulture)
$posterTime = [Math]::Max([Math]::Min($forwardDuration - 0.2, $duration - 0.05), 0)
$posterTimeString = $posterTime.ToString("0.###", [System.Globalization.CultureInfo]::InvariantCulture)

# Exact command pattern used for ArsGratia's homepage hero:
# ffmpeg -y -i public/video/hero-source.mp4 -filter_complex "[0:v]trim=0:7,setpts=PTS-STARTPTS[fwd];[0:v]trim=0:7,setpts=PTS-STARTPTS,reverse[rev];[fwd][rev]concat=n=2:v=1:a=0[v]" -map "[v]" -an -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -movflags +faststart public/video/hero-loop-chrome.mp4
& $ffmpeg.Source -y -i $Source -filter_complex "[0:v]trim=0:$forwardDurationString,setpts=PTS-STARTPTS[fwd];[0:v]trim=0:$forwardDurationString,setpts=PTS-STARTPTS,reverse[rev];[fwd][rev]concat=n=2:v=1:a=0[v]" -map "[v]" -an -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -movflags +faststart $Output

# Matching poster frame near the end of the forward pass for reduced-motion users and initial paint stability:
# ffmpeg -y -ss 6.8 -i public/video/hero-source.mp4 -frames:v 1 -update 1 -q:v 2 public/video/hero-loop-poster.jpg
& $ffmpeg.Source -y -ss $posterTimeString -i $Source -frames:v 1 -update 1 -q:v 2 $Poster
