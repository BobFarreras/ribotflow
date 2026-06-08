$componentMap = @{
  'AddressAutocomplete' = '@/components/sat/shared/AddressAutocomplete'
  'AttachmentSection' = '@/components/sat/work-orders/AttachmentSection'
  'CategoryIcon' = '@/components/sat/shared/CategoryIcon'
  'CheckInButton' = '@/components/sat/work-orders/CheckInButton'
  'GoogleMapsLink' = '@/components/sat/shared/GoogleMapsLink'
  'MapView' = '@/components/sat/work-orders/MapView'
  'MaterialList' = '@/components/sat/work-orders/MaterialList'
  'PdfGenerator' = '@/components/sat/work-orders/PdfGenerator'
  'QuoteEditor' = '@/components/sat/quotes/QuoteEditor'
  'QuoteList' = '@/components/sat/quotes/QuoteList'
  'QuotePdfPreview' = '@/components/sat/quotes/QuotePdfPreview'
  'QuoteStatusBadge' = '@/components/sat/quotes/QuoteStatusBadge'
  'RoutePlanner' = '@/components/sat/work-orders/RoutePlanner'
  'SendQuoteEmailModal' = '@/components/sat/quotes/SendQuoteEmailModal'
  'SignatureCanvas' = '@/components/sat/work-orders/SignatureCanvas'
  'StatusHistorySection' = '@/components/sat/work-orders/StatusHistorySection'
  'TechnicianAssigner' = '@/components/sat/work-orders/TechnicianAssigner'
  'WorkOrderActions' = '@/components/sat/work-orders/WorkOrderActions'
  'WorkOrderCard' = '@/components/sat/work-orders/WorkOrderCard'
  'WorkOrderFilters' = '@/components/sat/work-orders/WorkOrderFilters'
  'WorkOrderForm' = '@/components/sat/work-orders/WorkOrderForm'
  'WorkOrderKanban' = '@/components/sat/work-orders/WorkOrderKanban'
  'WorkOrderList' = '@/components/sat/work-orders/WorkOrderList'
  'WorkOrderPriorityBadge' = '@/components/sat/shared/WorkOrderPriorityBadge'
  'WorkOrderStatusBadge' = '@/components/sat/shared/WorkOrderStatusBadge'
  'WorkOrderTable' = '@/components/sat/work-orders/WorkOrderTable'
}

$actionMap = @{
  'acceptQuote' = '@/actions/sat/quotes/acceptQuote'
  'addAttachment' = '@/actions/sat/work-orders/addAttachment'
  'addMaterial' = '@/actions/sat/work-orders/addMaterial'
  'addQuoteItem' = '@/actions/sat/quotes/addQuoteItem'
  'assignTechnician' = '@/actions/sat/work-orders/assignTechnician'
  'checkIn' = '@/actions/sat/work-orders/checkIn'
  'createCategory' = '@/actions/sat/clients/createCategory'
  'createClient' = '@/actions/sat/clients/createClient'
  'createQuote' = '@/actions/sat/quotes/createQuote'
  'createQuoteTemplate' = '@/actions/sat/quotes/createQuoteTemplate'
  'createWorkOrder' = '@/actions/sat/work-orders/createWorkOrder'
  'deleteAttachment' = '@/actions/sat/work-orders/deleteAttachment'
  'deletePdf' = '@/actions/sat/work-orders/deletePdf'
  'deleteQuote' = '@/actions/sat/quotes/deleteQuote'
  'deleteQuoteTemplate' = '@/actions/sat/quotes/deleteQuoteTemplate'
  'duplicateQuoteTemplate' = '@/actions/sat/quotes/duplicateQuoteTemplate'
  'generatePdf' = '@/actions/sat/work-orders/generatePdf'
  'getProducts' = '@/actions/sat/work-orders/getProducts'
  'removeMaterial' = '@/actions/sat/work-orders/removeMaterial'
  'removeQuoteItem' = '@/actions/sat/quotes/removeQuoteItem'
  'saveSignature' = '@/actions/sat/work-orders/saveSignature'
  'sendQuoteEmail' = '@/actions/sat/quotes/sendQuoteEmail'
  'updateCategory' = '@/actions/sat/clients/updateCategory'
  'updateQuote' = '@/actions/sat/quotes/updateQuote'
  'updateQuoteItem' = '@/actions/sat/quotes/updateQuoteItem'
  'updateQuoteStatus' = '@/actions/sat/quotes/updateQuoteStatus'
  'updateQuoteTemplate' = '@/actions/sat/quotes/updateQuoteTemplate'
  'updateStatus' = '@/actions/sat/work-orders/updateStatus'
}

$rootPath = "C:\Users\Boby\Desktop\Pagines web\NextJS\ribotflow\src"
$files = Get-ChildItem -Path $rootPath -Recurse -Include *.ts, *.tsx -File

$changes = 0
foreach ($file in $files) {
  $content = [System.IO.File]::ReadAllText($file.FullName)
  $original = $content

  foreach ($name in $componentMap.Keys) {
    $newPath = $componentMap[$name]
    $content = $content -replace [regex]::Escape("@/components/sat/$name"), $newPath
  }
  foreach ($name in $actionMap.Keys) {
    $newPath = $actionMap[$name]
    $content = $content -replace [regex]::Escape("@/actions/sat/$name"), $newPath
  }

  if ($content -ne $original) {
    [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.UTF8Encoding]::new($false))
    $changes++
    Write-Host "Updated: $($file.FullName.Replace($rootPath, ''))"
  }
}

Write-Host "`nTotal files changed: $changes"
