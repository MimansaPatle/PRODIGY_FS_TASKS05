# 🚀 Quick Setup Guide

## Prerequisites
- Node.js (v16+)
- Python (v3.8+)
- MongoDB (v4.4+)

## Setup Steps

### 1. Clone & Install
```bash
git clone https://github.com/MimansaPatle/PRODIGY_FS_TASKS05.git
cd PRODIGY_FS_TASKS05

# Backend
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

**Backend** (`backend/.env`):
```bash
cp .env.example .env
# Edit .env with your MongoDB URL and JWT secret
```

**Frontend** (`frontend/.env`):
```bash
cp .env.example .env
# Default configuration should work
```

### 3. Run Application

**Terminal 1 - MongoDB:**
```bash
mongod
```

**Terminal 2 - Backend:**
```bash
cd backend
venv\Scripts\activate
python main.py
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

### 4. Access Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 🎉 You're Ready!
Create your first account and start exploring Pixora!
