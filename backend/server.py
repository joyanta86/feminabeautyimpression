from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional
import os
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
from datetime import datetime
import json
import base64
from passlib.context import CryptContext
import jwt
from datetime import timedelta

# Initialize FastAPI app
app = FastAPI(title="Femina Beauty Impression API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "your-secret-key-here"
ALGORITHM = "HS256"

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client.beauty_salon

# Models
class GalleryImage(BaseModel):
    id: str
    filename: str
    image_data: str
    description: Optional[str] = None
    uploaded_at: datetime

class AdminLogin(BaseModel):
    username: str
    password: str

class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None

# Default admin credentials (change these later)
DEFAULT_ADMIN = {
    "username": "admin",
    "password": "beauty123"
}

# Helper functions
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return username
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Routes
@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/api/admin/login")
async def admin_login(login_data: AdminLogin):
    if login_data.username == DEFAULT_ADMIN["username"] and login_data.password == DEFAULT_ADMIN["password"]:
        access_token = create_access_token(data={"sub": login_data.username})
        return {"access_token": access_token, "token_type": "bearer"}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.get("/api/gallery")
async def get_gallery():
    try:
        gallery_collection = db.gallery
        images = await gallery_collection.find({}).to_list(100)
        # Convert ObjectId to string and handle datetime serialization
        for image in images:
            if '_id' in image:
                del image['_id']
            if isinstance(image.get('uploaded_at'), datetime):
                image['uploaded_at'] = image['uploaded_at'].isoformat()
        return images
    except Exception as e:
        print(f"Gallery error: {str(e)}")
        return []  # Return empty list instead of error

@app.post("/api/gallery")
async def upload_image(
    file: UploadFile = File(...),
    description: str = Form(""),
    username: str = Depends(verify_token)
):
    try:
        # Read file content
        file_content = await file.read()
        
        # Encode image to base64
        image_data = base64.b64encode(file_content).decode('utf-8')
        
        # Create gallery item
        gallery_item = {
            "id": str(uuid.uuid4()),
            "filename": file.filename,
            "image_data": image_data,
            "description": description,
            "uploaded_at": datetime.utcnow()
        }
        
        # Save to database
        gallery_collection = db.gallery
        await gallery_collection.insert_one(gallery_item)
        
        return {"message": "Image uploaded successfully", "id": gallery_item["id"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/gallery/{image_id}")
async def delete_image(image_id: str, username: str = Depends(verify_token)):
    try:
        gallery_collection = db.gallery
        result = await gallery_collection.delete_one({"id": image_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Image not found")
        return {"message": "Image deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
async def chat_endpoint(chat_data: ChatMessage):
    # Placeholder for OpenAI integration
    # Will be implemented after getting API key
    return {
        "response": "Hello! I'm your beauty assistant. I can help you with beauty tips and provide information about our salon location at 21-23 Woodgrange Road, London E7 8BA. Our opening hours are Monday-Saturday 11:00 AM to 6:00 PM. How can I help you today?",
        "session_id": chat_data.session_id or str(uuid.uuid4())
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)