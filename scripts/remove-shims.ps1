$rootPath = "C:\Users\Boby\Desktop\Pagines web\NextJS\ribotflow"

# Delete component shims
Get-ChildItem -Path "$rootPath\src\components\sat" -File -Filter "*.tsx" | ForEach-Object {
  git rm $_.FullName
}

# Delete action shims
Get-ChildItem -Path "$rootPath\src\actions\sat" -File -Filter "*.ts" | ForEach-Object {
  git rm $_.FullName
}

Write-Host "Done"
