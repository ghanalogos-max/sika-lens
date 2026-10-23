# Downloads brand marks into assets/brands/<id>.(png|jpg), then wire them in src/ui/brandLogos.ts.
# Prefer Wikimedia / official favicons / known bank logo CDNs over generic Google defaults.
$ErrorActionPreference = 'Continue'
$out = Join-Path $PSScriptRoot '..\assets\brands'
New-Item -ItemType Directory -Force -Path $out | Out-Null
$hdr = @{ 'User-Agent' = 'Mozilla/5.0 SikaLensLogoFetch/1.0' }

$sources = [ordered]@{
  mtn = @(
    'https://upload.wikimedia.org/wikipedia/commons/9/93/New-mtn-logo.jpg',
    'https://www.google.com/s2/favicons?domain=mtn.com.gh&sz=128'
  )
  telecel = @(
    'https://www.telecel.com.gh/favicon-32x32.png',
    'https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://www.telecel.com.gh&size=128'
  )
  airteltigo = @(
    'https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://www.at.com.gh&size=128',
    'https://www.google.com/s2/favicons?domain=at.com.gh&sz=128'
  )
  gcb = @('https://www.google.com/s2/favicons?domain=gcbbank.com.gh&sz=128')
  ecobank = @('https://cdn.jsdelivr.net/gh/supermx1/nigerian-banks-api@master/logos/ecobank-nigeria.png')
  absa = @(
    'https://www.absa.com.gh/content/dam/ghana/absa/logos/absa-logo-bg-gh.png',
    'https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://www.absa.com.gh&size=128'
  )
  stanbic = @('https://cdn.jsdelivr.net/gh/supermx1/nigerian-banks-api@master/logos/stanbic-ibtc-bank.png')
  fidelity = @(
    # Official Fidelity Bank Ghana app icon (orange F) via App Store artwork
    'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/6b/e9/e3/6be9e31d-d36c-5103-e3ae-14ee58505c04/AppIcon-0-0-1x_U007emarketing-0-5-0-85-220.png/512x512bb.jpg'
  )
  calbank = @('https://www.google.com/s2/favicons?domain=calbank.net&sz=128')
  access = @('https://cdn.jsdelivr.net/gh/supermx1/nigerian-banks-api@master/logos/access-bank.png')
  zenith = @('https://cdn.jsdelivr.net/gh/supermx1/nigerian-banks-api@master/logos/zenith-bank.png')
  cbg = @('https://www.google.com/s2/favicons?domain=cbg.com.gh&sz=128')
  # Official ADB Mobile Banking app icon (leaf + adb wordmark) — not the tiny site favicon
  adb = @(
    'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/3e/5b/3b/3e5b3b78-ee9e-cb6e-7d35-6be68fa0559e/AppIcon-0-0-1x_U007emarketing-0-11-0-85-220.png/512x512bb.jpg',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Agricultural_Development_Bank_of_Ghana_(ADB)_logo.jpg'
  )
  republic = @(
    'https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://www.republicghana.com&size=128'
  )
  gtbank = @('https://cdn.jsdelivr.net/gh/supermx1/nigerian-banks-api@master/logos/guaranty-trust-bank.png')
  umb = @('https://www.google.com/s2/favicons?domain=myumbbank.com&sz=128')
  fnb = @('https://www.google.com/s2/favicons?domain=firstnationalbank.com.gh&sz=128')
  # Official Société Générale red/black square (SG Connect app mark) — not the wide wordmark
  sg = @(
    'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/f6/58/a6/f658a696-fd87-1936-e504-3c585c3d0dd3/AppIcon-0-0-1x_U007emarketing-0-6-0-85-220.png/512x512bb.jpg',
    'https://commons.wikimedia.org/wiki/Special:FilePath/SGG_Logo.png'
  )
  prudential = @('https://www.google.com/s2/favicons?domain=prudentialbank.com.gh&sz=128')
  nab = @(
    'https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://www.nib-ghana.com&size=128'
  )
  omnibsic = @('https://www.google.com/s2/favicons?domain=omnibsic.com.gh&sz=128')
  # Official Bank of Africa Ghana square mark (BMobile Ghana app) — not the wide BMCE wordmark
  boa = @(
    'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/c3/ba/84/c3ba8447-75cf-a37e-d8c5-7d6897ad4bb3/AppIcon-0-0-1x_U007emarketing-0-8-0-85-220.png/512x512bb.jpg',
    'https://boaghana.com/wp-content/uploads/2022/02/cropped-fav-icon-boa-logo-270x270.png',
    'https://boaghana.com/wp-content/uploads/2017/02/nLogo.png'
  )
  fab = @('https://www.google.com/s2/favicons?domain=firstatlanticbank.com.gh&sz=128')
  uba = @('https://cdn.jsdelivr.net/gh/supermx1/nigerian-banks-api@master/logos/united-bank-for-africa.png')
  fidelity_life = @('https://www.google.com/s2/favicons?domain=fbnbankghana.com&sz=128')
}

foreach ($id in $sources.Keys) {
  $ok = $false
  foreach ($url in $sources[$id]) {
    $tmp = Join-Path $out "$id.tmp"
    try {
      Invoke-WebRequest -Uri $url -OutFile $tmp -TimeoutSec 30 -UseBasicParsing -Headers $hdr
      $bytes = [System.IO.File]::ReadAllBytes($tmp)
      if ($bytes.Length -lt 400 -or $bytes[0] -eq 0x3C) {
        Remove-Item $tmp -Force -ErrorAction SilentlyContinue
        continue
      }
      $ext = if ($bytes[0] -eq 0xFF -and $bytes[1] -eq 0xD8) { 'jpg' } else { 'png' }
      Move-Item -Force $tmp (Join-Path $out "$id.$ext")
      # Drop sibling with the other extension so require paths stay unambiguous.
      $other = Join-Path $out "$id.$(if ($ext -eq 'png') { 'jpg' } else { 'png' })"
      if (Test-Path $other) { Remove-Item $other -Force }
      Write-Output "ok $id $ext bytes=$($bytes.Length)"
      $ok = $true
      break
    } catch {
      if (Test-Path $tmp) { Remove-Item $tmp -Force -ErrorAction SilentlyContinue }
    }
  }
  if (-not $ok) { Write-Output "fail $id" }
}
