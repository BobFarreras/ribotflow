$rootPath = "C:\Users\Boby\Desktop\Pagines web\NextJS\ribotflow"

# Map old shim path -> canonical new path (both static and dynamic imports)
$replacements = @{
  '@/services/sat/attachmentService'        = '@/services/sat/work-orders/attachmentService'
  '@/services/sat/locationService'          = '@/services/sat/work-orders/locationService'
  '@/services/sat/materialService'           = '@/services/sat/work-orders/materialService'
  '@/services/sat/productService'            = '@/services/sat/work-orders/productService'
  '@/services/sat/signatureService'          = '@/services/sat/work-orders/signatureService'
  '@/services/sat/workOrderService'          = '@/services/sat/work-orders/workOrderService'
  '@/services/sat/quoteService'              = '@/services/sat/quotes/quoteService'
  '@/services/sat/quoteItemService'          = '@/services/sat/quotes/quoteItemService'
  '@/services/sat/quoteTemplateService'      = '@/services/sat/quotes/quoteTemplateService'
}

$files = Get-ChildItem -Path "$rootPath\src", "$rootPath\tests", "$rootPath\scripts" -Recurse -File -Include "*.ts","*.tsx" -ErrorAction SilentlyContinue

$updatedCount = 0
foreach ($file in $files) {
  $content = [System.IO.File]::ReadAllText($file.FullName)
  $original = $content

  foreach ($key in $replacements.Keys) {
    $newPath = $replacements[$key]
    # Static imports: from "oldPath" / from 'oldPath'
    $content = $content -replace ([regex]::Escape("from `"$key`"")),  "from `"$newPath`""
    $content = $content -replace ([regex]::Escape("from '$key'")),  "from '$newPath'"
    # Dynamic imports: import("oldPath") / import('oldPath')
    $content = $content -replace ([regex]::Escape("import(`"$key`")")),  "import(`"$newPath`")"
    $content = $content -replace ([regex]::Escape("import('$key')")),  "import('$newPath')"
  }

  if ($content -ne $original) {
    [System.IO.File]::WriteAllText($file.FullName, $content)
    $rel = $file.FullName.Replace($rootPath + '\', '')
    Write-Host "Updated: $rel"
    $updatedCount++
  }
}

Write-Host ""
Write-Host "Total files updated: $updatedCount"
