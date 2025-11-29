🎬 Video Editor App - Full Stack Assignment

A complete video editing application built with React Native frontend and FastAPI backend that allows users to add dynamic overlays (text/images) to videos with precise timing controls.

✨ Features

Frontend (React Native + Expo)
- 📹 Video upload from device & Google Drive integration
- 🖱️ Drag & drop positioning for overlays
- ⏱️ Timing controls (start/end time) for overlays
- 👀 Real-time video preview with overlays
- 📊 Progress tracking during processing
- 📥 Download processed videos

Backend (FastAPI + FFmpeg)
- 🚀 RESTful API with proper endpoints
- 🔄 Background video processing
- 🎨 FFmpeg integration for text/image overlays
- 📊 Job queue system with status monitoring
- 📁 File upload/download handling

 🛠️ Installation & Setup

 Backend Setup
```bash
cd backend
pip install fastapi uvicorn python-multipart
python main.py
Frontend Setup
bash
cd frontend
npm install
expo start
📡 API Endpoints
Method	Endpoint	Description
POST	/upload	Upload video with overlay metadata
GET	/status/{job_id}	Check processing status
GET	/result/{job_id}	Download processed video
🎯 Usage
Select video from Google Drive or device

Add text/image overlays with drag-drop positioning

Set timing controls (start/end time)

Submit for processing

Monitor real-time progress

Download final edited video

📁 Project Structure
text
Video-Editor-App/
├── frontend/
│   └── App.js                 # React Native application
├── backend/
│   └── main.py                # FastAPI server
├── README.md                  # Project documentation
└── .gitignore                 # Git ignore rules
🏗️ Tech Stack
Frontend: React Native, Expo, React Native Video

Backend: FastAPI, FFmpeg, Python, Uvicorn

Storage: Local file system + Google Drive integration

👨‍💻 Author
[FAIEQA NAEEM]



## 📄 **.gitignore FILE CONTENT:**
Python
pycache/
*.pyc
*.pyo
*.pyd
uploads/
outputs/

Node.js
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
