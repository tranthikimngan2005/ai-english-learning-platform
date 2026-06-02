<#
.SYNOPSIS
    Script khởi chạy nhanh dự án Pengwin - AI English Learning Platform.
.DESCRIPTION
    Tự động thiết lập môi trường, cài đặt dependencies, seed dữ liệu demo
    và đồng thời kích hoạt cả Backend (FastAPI) lẫn Frontend (React).
#>

$ErrorActionPreference = "Stop"

# Định nghĩa các đường dẫn chính xác dựa vào cấu trúc dự án
$BackendDir = Join-Path $PSScriptRoot "backend\lingai"
$FrontendDir = Join-Path $PSScriptRoot "frontend"

# --- 1. KIỂM TRA VÀ THIẾT LẬP MÔI TRƯỜNG ---
Write-Host "====== [1/4] Thiet lap moi truong ======" -ForegroundColor Cyan

# Kiểm tra nếu chưa có file .env trong thư mục backend, tạo file mặc định
$EnvPath = Join-Path $BackendDir ".env"
if (-not (Test-Path $EnvPath)) {
    Write-Host "Tao file .env mac dinh tai backend..." -ForegroundColor Yellow
    @"
DATABASE_URL=sqlite:///./lingai.db
SECRET_KEY=pengwin_super_secret_key_2026
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
"@ | Out-File -FilePath $EnvPath -Encoding utf8
}

# Kích hoạt Virtual Environment (nằm ở thư mục gốc)
if (-not (Test-Path ".venv")) {
    Write-Host "Khong tim thay thu muc .venv. Dang khoi tao virtualenv..." -ForegroundColor Yellow
    python -m venv .venv
}

Write-Host "Kich hoa venv..." -ForegroundColor Green
. .venv\Scripts\Activate.ps1

# Di chuyển vào thư mục backend để cài đặt thư viện
Write-Host "Dang cai dat dependencies cho Backend..." -ForegroundColor Yellow
Set-Location $BackendDir
pip install -r requirements.txt
Set-Location $PSScriptRoot

# --- 2. SEED DỮ LIỆU DEMO ---
Write-Host "====== [2/4] Khoi tao du lieu he thong ======" -ForegroundColor Cyan

$SkipSeed = $args -contains "-SkipSeed"

if (-not $SkipSeed) {
    Write-Host "Dang thuc hien seed du lieu TOEIC, Flashcards va Users..." -ForegroundColor Yellow
    try {
        Set-Location $BackendDir
        # Chạy các script python seed dữ liệu bên trong thư mục backend
        python seed_toeic_reading.py --reset
        python seed_flashcards.py --reset
        python seed_test_users.py
        Set-Location $PSScriptRoot
        Write-Host "Seed du lieu thanh cong!" -ForegroundColor Green
    }
    catch {
        Set-Location $PSScriptRoot
        Write-Host "[ERROR] Gap loi trong qua trinh khoi tao du lieu: $_" -ForegroundColor Red
    }
} else {
    Write-Host "Bo qua buoc seed du lieu theo yeu cau." -ForegroundColor Gray
}

# --- 3. CÀI ĐẶT FRONTEND DEPENDENCIES ---
Write-Host "====== [3/4] Kiem tra Frontend =====" -ForegroundColor Cyan
$SkipNpmInstall = $args -contains "-SkipNpmInstall"

if (-not $SkipNpmInstall) {
    Write-Host "Dang kiem tra va cai dat npm packages..." -ForegroundColor Yellow
    Set-Location $FrontendDir
    npm install
    Set-Location $PSScriptRoot
}

# --- 4. ĐỒNG THỜI KHỞI CHẠY BACKEND VÀ FRONTEND ---
Write-Host "====== [4/4] Khoi chay he thong Pengwin ======" -ForegroundColor Cyan
Write-Host "Frontend se chay tai: http://localhost:3000" -ForegroundColor Green
Write-Host "Backend API Docs tai: http://localhost:8000/docs" -ForegroundColor Green
Write-Host "Nhan Ctrl+C tai cua so Terminal hien tai de dung Backend." -ForegroundColor Yellow

# Lệnh khởi chạy
$BackendCommand = "uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
$FrontendCommand = "npm start"

# Mở một cửa sổ PowerShell mới độc lập để chạy Frontend (React)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$FrontendDir'; $FrontendCommand"

# Khởi chạy Backend (FastAPI) ngay tại cửa sổ Terminal hiện tại
Write-Host "Dang khoi dong Backend FastAPI..." -ForegroundColor Blue
Set-Location $BackendDir
Invoke-Expression $BackendCommand