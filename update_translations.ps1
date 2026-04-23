$enPath = "public\locales\en\translation.json"
$esPath = "public\locales\es\translation.json"

# Read English file
$enContent = Get-Content $enPath -Raw | ConvertFrom-Json

# Add credits section to nav
$enContent.nav | Add-Member -MemberType NoteProperty -Name "credits" -Value "Credits" -Force

# Add credits section
$creditsEn = @{
    title = "Credits Management"
    available = "Available Credits"
    purchase = "Purchase Credits"
    amount = "Amount"
    buyButton = "Buy Credits"
    success = "Credits purchased successfully!"
    error = "Failed to purchase credits"
    invalidAmount = "Please enter a valid amount"
}
$enContent | Add-Member -MemberType NoteProperty -Name "credits" -Value $creditsEn -Force

# Save English file
$enContent | ConvertTo-Json -Depth 10 | Set-Content $enPath -Encoding UTF8

# Read Spanish file
$esContent = Get-Content $esPath -Raw | ConvertFrom-Json

# Add credits section to nav
$esContent.nav | Add-Member -MemberType NoteProperty -Name "credits" -Value "Créditos" -Force

# Add credits section
$creditsEs = @{
    title = "Gestión de Créditos"
    available = "Créditos Disponibles"
    purchase = "Comprar Créditos"
    amount = "Cantidad"
    buyButton = "Comprar Créditos"
    success = "¡Créditos comprados exitosamente!"
    error = "Error al comprar créditos"
    invalidAmount = "Por favor ingresa una cantidad válida"
}
$esContent | Add-Member -MemberType NoteProperty -Name "credits" -Value $creditsEs -Force

# Save Spanish file
$esContent | ConvertTo-Json -Depth 10 | Set-Content $esPath -Encoding UTF8

Write-Host "Translation files updated successfully"
