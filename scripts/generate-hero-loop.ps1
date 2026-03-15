param(
  [string]$Source = "public/video/hero-source.mp4",
  [string]$Output = "public/video/hero-loop.mp4",
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
$start = [Math]::Max(0, $duration - 1)
$startString = $start.ToString("0.###", [System.Globalization.CultureInfo]::InvariantCulture)
$posterTime = [Math]::Max($start + 0.8, $duration - 0.05)
$posterTimeString = $posterTime.ToString("0.###", [System.Globalization.CultureInfo]::InvariantCulture)

# Exact loop extraction command used for ArsGratia's homepage hero:
# ffmpeg -y -ss <duration-1> -i public/video/hero-source.mp4 -t 1 -an -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -movflags +faststart public/video/hero-loop.mp4
& $ffmpeg.Source -y -ss $startString -i $Source -t 1 -an -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -movflags +faststart $Output

# Matching poster frame for reduced-motion users and initial paint stability:
# ffmpeg -y -ss <duration-0.2> -i public/video/hero-source.mp4 -frames:v 1 -update 1 -q:v 2 public/video/hero-loop-poster.jpg
& $ffmpeg.Source -y -ss $posterTimeString -i $Source -frames:v 1 -update 1 -q:v 2 $Poster
