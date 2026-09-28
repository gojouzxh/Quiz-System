param(
  [int]$Port = 8080
)
$ErrorActionPreference = "Stop"

$port = $Port

try {
  $probe = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:$Port/" -TimeoutSec 1 -ErrorAction Stop
  if ($probe.StatusCode -eq 200) {
    Write-Host "Serving static site on http://localhost:$Port/"
    exit 0
  }
} catch {
  # No existing server is available; this process will bind the port below.
}

while ($true) {
  try {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Parse("127.0.0.1"), $Port)
    $listener.Start()
    break
  } catch [System.Net.Sockets.SocketException] {
    if ($listener) { $listener.Stop() }
    Write-Error "Port $Port is already in use. Stop the existing server or use another port."
    exit 1
  }
}

$url = "http://127.0.0.1:$port/"
$root = (Get-Location).Path

Start-Process $url
Write-Host "Serving Quiz & Study Tracker at $url"
Write-Host "Press Ctrl+C to stop the server."

$contentTypes = @{
  ".css" = "text/css; charset=utf-8"
  ".html" = "text/html; charset=utf-8"
  ".js" = "text/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
}


try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $stream = $client.GetStream()
      $reader = [System.IO.StreamReader]::new($stream)
      $requestLine = $reader.ReadLine()
      if (-not $requestLine) { continue }

      $requestParts = $requestLine.Split(" ")
      $relativePath = [System.Uri]::UnescapeDataString(([string]$requestParts[1]).Split("?")[0].TrimStart("/"))
      if ([string]::IsNullOrWhiteSpace($relativePath)) { $relativePath = "index.html" }
      $filePath = [System.IO.Path]::GetFullPath((Join-Path $root $relativePath))

      if (-not $filePath.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path $filePath -PathType Leaf)) {
        $status = "404 Not Found"
        $bytes = [System.Text.Encoding]::UTF8.GetBytes("Not found")
        $type = "text/plain; charset=utf-8"
      } else {
        $status = "200 OK"
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $extension = [System.IO.Path]::GetExtension($filePath).ToLowerInvariant()
        $type = if ($contentTypes.ContainsKey($extension)) { $contentTypes[$extension] } else { "application/octet-stream" }
      }

      $headers = "HTTP/1.1 $status`r`nContent-Type: $type`r`nContent-Length: $($bytes.Length)`r`nConnection: close`r`n`r`n"
      $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headers)
      $stream.Write($headerBytes, 0, $headerBytes.Length)
      $stream.Write($bytes, 0, $bytes.Length)
      $stream.Flush()
    } finally {
      if ($reader) { $reader.Dispose() }
      if ($stream) { $stream.Dispose() }
      $client.Dispose()
    }
  }
} finally {
  $listener.Stop()
}