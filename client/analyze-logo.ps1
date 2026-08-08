Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile('C:\Users\cliny\OneDrive\Desktop\ELDawly\client\images\logo.jpeg')
$w = $img.Width; $h = $img.Height
Write-Output "Size: $w x $h"

$c1 = $img.GetPixel(3,3)
$c2 = $img.GetPixel($w-4,3)
$c3 = $img.GetPixel(3,$h-4)
$c4 = $img.GetPixel($w-4,$h-4)
$cc = $img.GetPixel([int]($w/2),[int]($h/2))
Write-Output ("TL: " + $c1.R + "," + $c1.G + "," + $c1.B)
Write-Output ("TR: " + $c2.R + "," + $c2.G + "," + $c2.B)
Write-Output ("BL: " + $c3.R + "," + $c3.G + "," + $c3.B)
Write-Output ("BR: " + $c4.R + "," + $c4.G + "," + $c4.B)
Write-Output ("Center: " + $cc.R + "," + $cc.G + "," + $cc.B)

$white=0; $light=0; $n=0
for ($y = 0; $y -lt $h; $y += 8) {
  for ($x = 0; $x -lt $w; $x += 8) {
    $p = $img.GetPixel($x,$y)
    if ($p.R -gt 235 -and $p.G -gt 235 -and $p.B -gt 235) { $white++ }
    if ($p.R -gt 200 -and $p.G -gt 200 -and $p.B -gt 200) { $light++ }
    $n++
  }
}
Write-Output ("Near-white(>235) %: " + [math]::Round(($white/$n)*100,1))
Write-Output ("Light(>200) %: " + [math]::Round(($light/$n)*100,1))
$img.Dispose()
