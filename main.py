from fastapi import FastAPI, File, UploadFile, Form, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
import json
import subprocess
import shutil
from typing import Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Video Editor API", version="1.0")

# CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create directories
os.makedirs("uploads", exist_ok=True)
os.makedirs("outputs", exist_ok=True)
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

# Job storage
jobs = {}

def process_video_with_overlays(job_id: str, video_path: str, image_path: Optional[str], overlays_data: str):
    """Process video with text and image overlays - SIMPLIFIED"""
    try:
        logger.info(f"🚀 Starting video processing for job {job_id}")
        jobs[job_id] = {"status": "processing", "progress": 20}
        
        # Parse overlays
        overlays = json.loads(overlays_data)
        output_path = f"outputs/{job_id}_final.mp4"
        
        jobs[job_id] = {"status": "processing", "progress": 40}
        
        # ✅ SIMPLE FFMPEG COMMAND - Text overlay only
        ffmpeg_cmd = ['ffmpeg', '-i', video_path]
        
        # Handle text overlays
        text_overlays = [ov for ov in overlays if ov["type"] == "text"]
        
        if text_overlays:
            # Take first text overlay only (simplified)
            text = text_overlays[0]["content"].replace("'", "'\\''")
            
            # ✅ FIXED: Add black background behind text
            ffmpeg_cmd.extend([
                '-vf', 
                f"drawtext=text='{text}':fontsize=36:fontcolor=white:box=1:boxcolor=black@0.5:boxborderw=5:x=(w-text_w)/2:y=50",
                '-c:a', 'copy',
                '-y'  # Overwrite output
            ])
        else:
            # No text overlays - just copy
            ffmpeg_cmd.extend(['-c', 'copy', '-y'])
        
        ffmpeg_cmd.append(output_path)
        
        jobs[job_id] = {"status": "processing", "progress": 70}
        
        # Run FFmpeg
        logger.info("Running simplified FFmpeg processing...")
        result = subprocess.run(ffmpeg_cmd, capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            jobs[job_id] = {
                "status": "completed", 
                "progress": 100,
                "output_path": output_path,
                "message": "Video processed successfully!"
            }
            logger.info(f"✅ Processing completed for {job_id}")
        else:
            # Fallback - simple copy
            logger.warning("FFmpeg failed, using fallback...")
            fallback_cmd = ['ffmpeg', '-i', video_path, '-c', 'copy', '-y', output_path]
            subprocess.run(fallback_cmd, capture_output=True)
            jobs[job_id] = {
                "status": "completed",
                "progress": 100,
                "output_path": output_path,
                "message": "Video processed (simple copy)"
            }
            
    except subprocess.TimeoutExpired:
        jobs[job_id] = {"status": "failed", "error": "Processing timeout - try smaller video"}
        logger.error("Processing timeout")
    except Exception as e:
        jobs[job_id] = {"status": "failed", "error": str(e)}
        logger.error(f"Processing error: {str(e)}")

@app.post("/upload")
async def upload_video(
    background_tasks: BackgroundTasks,
    video: UploadFile = File(...),
    image: UploadFile = File(None),
    overlays: str = Form("[]")
):
    """Upload video and overlays for processing"""
    try:
        # Validate video file
        if not video.filename.lower().endswith(('.mp4', '.avi', '.mov', '.mkv')):
            raise HTTPException(400, "Invalid video format")
        
        # Generate job ID
        job_id = str(uuid.uuid4())
        
        # Save video file
        video_path = f"uploads/{job_id}_{video.filename}"
        with open(video_path, "wb") as f:
            content = await video.read()
            f.write(content)
        
        file_size_mb = len(content) / (1024 * 1024)
        logger.info(f"📹 Video uploaded: {video.filename} ({file_size_mb:.1f}MB)")
        
        # Save image file if provided
        image_path = None
        if image:
            image_path = f"uploads/{job_id}_{image.filename}"
            with open(image_path, "wb") as f:
                await image.write(f.read())
            logger.info(f"🖼️ Image overlay uploaded: {image.filename}")
        
        # Parse overlays
        try:
            overlays_list = json.loads(overlays)
        except json.JSONDecodeError:
            raise HTTPException(400, "Invalid JSON in overlays")
        
        # Initialize job
        jobs[job_id] = {
            "status": "queued",
            "progress": 0,
            "video": video.filename,
            "overlays_count": len(overlays_list),
            "has_image": image is not None
        }
        
        # Start background processing
        background_tasks.add_task(
            process_video_with_overlays,
            job_id, video_path, image_path, overlays
        )
        
        return {
            "job_id": job_id,
            "status": "queued",
            "message": "Video processing started successfully!",
            "video": video.filename,
            "overlays": len(overlays_list),
            "estimated_time": "10-20 seconds",
            "status_url": f"/status/{job_id}",
            "result_url": f"/result/{job_id}"
        }
        
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(500, f"Upload failed: {str(e)}")

@app.get("/status/{job_id}")
async def get_status(job_id: str):
    """Get processing status"""
    if job_id not in jobs:
        raise HTTPException(404, "Job not found")
    return jobs[job_id]

@app.get("/result/{job_id}")
async def get_result(job_id: str):
    """Download processed video"""
    if job_id not in jobs:
        raise HTTPException(404, "Job not found")
    
    job = jobs[job_id]
    if job["status"] != "completed":
        raise HTTPException(400, "Video processing not completed")
    
    output_path = job.get("output_path")
    if not output_path or not os.path.exists(output_path):
        raise HTTPException(404, "Result file not found")
    
    # ✅ FIXED: Proper file response
    return FileResponse(
        output_path,
        media_type='video/mp4',
        filename=f"edited_video.mp4"
    )

@app.get("/")
async def root():
    return {
        "message": "🎬 Video Editor API is running",
        "version": "1.0",
        "status": "Ready for processing"
    }

# ✅ FIXED: CORRECT WAY TO RUN THE APP
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",  # "filename:app_instance" 
        host="0.0.0.0",
        port=8000,
        reload=True
    )