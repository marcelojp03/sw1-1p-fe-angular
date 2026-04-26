# SI2 SIA Frontend - Deploy to S3
# Bucket: si2-sia-fe
# Region: us-east-1

$BucketName = "si2-sia-fe"
$BuildFolder = "dist/si2-sia/browser"
$Region = "us-east-1"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  SI2 SIA Frontend - Deploy S3" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Verificar AWS CLI
Write-Host "[1/5] Verificando AWS CLI..." -ForegroundColor Cyan
$awsVersion = aws --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: AWS CLI no instalado" -ForegroundColor Red
    Write-Host "Instalar desde: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}
Write-Host "OK: $awsVersion" -ForegroundColor Green

# 2. Build
Write-Host "`n[2/5] Build de produccion..." -ForegroundColor Cyan
npm run build:prod
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR en build" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Build completado" -ForegroundColor Green

# 3. Verificar carpeta
Write-Host "`n[3/5] Verificando build..." -ForegroundColor Cyan
if (!(Test-Path $BuildFolder)) {
    Write-Host "ERROR: No existe $BuildFolder" -ForegroundColor Red
    Write-Host "Verificar que el build se haya completado correctamente" -ForegroundColor Yellow
    exit 1
}
$fileCount = (Get-ChildItem -Path $BuildFolder -Recurse -File).Count
Write-Host "OK: $fileCount archivos listos" -ForegroundColor Green

# 4. Subir a S3
Write-Host "`n[4/5] Subiendo a S3..." -ForegroundColor Cyan
Write-Host "Bucket: s3://$BucketName" -ForegroundColor Cyan
Write-Host "Region: $Region" -ForegroundColor Cyan

# Assets estaticos (1 año cache) - JS, CSS, imagenes, fuentes
Write-Host "  Subiendo assets estaticos (con cache)..." -ForegroundColor White
aws s3 sync $BuildFolder s3://$BucketName --region $Region --delete `
    --cache-control "public,max-age=31536000,immutable" `
    --exclude "*.html" `
    --exclude "*.json" `
    --exclude "*.txt"

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR subiendo assets" -ForegroundColor Red
    exit 1
}

# HTML, JSON y TXT (sin cache)
Write-Host "  Subiendo HTML/JSON (sin cache)..." -ForegroundColor White
aws s3 sync $BuildFolder s3://$BucketName --region $Region `
    --exclude "*" `
    --include "*.html" `
    --include "*.json" `
    --include "*.txt" `
    --cache-control "public,max-age=0,must-revalidate"

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR subiendo HTML" -ForegroundColor Red
    exit 1
}

Write-Host "OK: Archivos subidos" -ForegroundColor Green

# 5. Resumen
Write-Host "`n[5/5] Completado!" -ForegroundColor Cyan
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  DEPLOYMENT EXITOSO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "`nURLs de acceso:" -ForegroundColor Cyan
Write-Host "  S3 Website: http://$BucketName.s3-website-$Region.amazonaws.com" -ForegroundColor Yellow
Write-Host "  S3 Direct:  https://$BucketName.s3.$Region.amazonaws.com/index.html" -ForegroundColor Yellow

Write-Host "`nDatos del deployment:" -ForegroundColor Cyan
Write-Host "  Archivos: $fileCount" -ForegroundColor White
Write-Host "  Bucket:   $BucketName" -ForegroundColor White
Write-Host "  Region:   $Region" -ForegroundColor White
Write-Host ""
