$moves = @{
  'acceptQuote' = 'quotes'; 'createQuote' = 'quotes'; 'createQuoteTemplate' = 'quotes';
  'deleteQuote' = 'quotes'; 'deleteQuoteTemplate' = 'quotes'; 'duplicateQuoteTemplate' = 'quotes';
  'sendQuoteEmail' = 'quotes'; 'updateQuote' = 'quotes'; 'updateQuoteItem' = 'quotes';
  'updateQuoteStatus' = 'quotes'; 'addQuoteItem' = 'quotes'; 'removeQuoteItem' = 'quotes';
  'updateQuoteTemplate' = 'quotes';
  'createWorkOrder' = 'work-orders'; 'updateStatus' = 'work-orders'; 'assignTechnician' = 'work-orders';
  'checkIn' = 'work-orders'; 'saveSignature' = 'work-orders'; 'addMaterial' = 'work-orders';
  'removeMaterial' = 'work-orders'; 'addAttachment' = 'work-orders'; 'deleteAttachment' = 'work-orders';
  'generatePdf' = 'work-orders'; 'deletePdf' = 'work-orders'; 'getProducts' = 'work-orders';
  'createClient' = 'clients'; 'createCategory' = 'clients'; 'updateCategory' = 'clients'
}

$rootPath = "C:\Users\Boby\Desktop\Pagines web\NextJS\ribotflow\src\actions\sat"

foreach ($name in $moves.Keys) {
  $sub = $moves[$name]
  $path = Join-Path $rootPath "$name.ts"
  $content = "export * from ""./$sub/$name""`;"
  Set-Content -Path $path -Value $content -Encoding UTF8
}

Write-Host "Created $($moves.Count) shims"
