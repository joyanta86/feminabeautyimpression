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
import openai

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

# OpenAI configuration
openai.api_key = os.environ.get('OPENAI_API_KEY')

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
    try:
        # Enhanced system prompt for beauty salon assistant
        system_prompt = """You are a helpful beauty assistant for Femina Beauty Impression, a professional beauty salon located at 21-23 Woodgrange Road, London E7 8BA (Inside Post Office).

Our services and pricing:
THREADING: Eye Brow (£5), Upper Lip (£3), Chin (£3), Forehead (£3), Neck (£3), Side Face (£5), Full Face (£15)
FACE WAXING: Eye Brows (£6), Upper Lip (£4), Chin (£4), Forehead (£4), Neck (£4), Side Face (£6), Full Face (£18)
BODY WAXING: Half Arm (£12), Full Arm (£18), Under Arm (£8), Half Leg (£15), Full Leg (£25), Full Body Except Bikini (£60)
PEDICURE & MANICURE: Pedicure (£25), Manicure (£20)
EYELASH & TINTING: Full Set Cluster (From £18), Party Lashes (£8), Eye Brows Tinting (£6), Eye Lashes Tinting (£8)
FACIAL & MASSAGE: Mini Facial (£15), Full Facial Cleansing/Whitening/Gold (£25), Herbal Facial (£30), Head Massage With/Without Herbal Oil (£15)
HENNA & HAIR: One Hand/Foot Henna (From £5), Both Hands/Feet Henna (From £10), Hair Trimming (£7), Any Other Cut (From £12), Children Under 10 (£10)
MAKEUP: Party Makeup (From £30), Bridal Makeup (From £150)

Opening Hours: Monday-Saturday 11:00 AM to 6:00 PM
Special appointments: 10:00 AM-11:00 AM and 6:00 PM-7:00 PM by appointment only
Phone: +44 7368 594210
Facebook: https://www.facebook.com/profile.php?id=100066574856943
Instagram: https://www.instagram.com/feminabeautyimpression1

Provide helpful beauty tips, answer questions about our services, help with appointment booking, and give location information. Be friendly, professional, and knowledgeable about beauty and skincare."""

        # Get OpenAI API key
        openai_api_key = os.environ.get('OPENAI_API_KEY')
        
        if openai_api_key:
            try:
                from openai import OpenAI
                client_openai = OpenAI(api_key=openai_api_key)
                
                response = client_openai.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": chat_data.message}
                    ],
                    max_tokens=300,
                    temperature=0.7
                )
                
                ai_response = response.choices[0].message.content
                print(f"OpenAI response successful: {ai_response[:50]}...")
                
            except Exception as openai_error:
                print(f"OpenAI API error: {str(openai_error)}")
                # Fallback to intelligent responses based on keywords
                ai_response = get_fallback_response(chat_data.message)
        else:
            print("No OpenAI API key found, using fallback")
            ai_response = get_fallback_response(chat_data.message)
        
        return {
            "response": ai_response,
            "session_id": chat_data.session_id or str(uuid.uuid4())
        }
    except Exception as e:
        print(f"Chat error: {str(e)}")
        # Final fallback response
        fallback_response = "Hello! I'm here to help with beauty tips and salon information. Our salon is located at 21-23 Woodgrange Road, London E7 8BA. We're open Monday-Saturday 11:00 AM to 6:00 PM. Call us at +44 7368 594210 to book an appointment!"
        
        return {
            "response": fallback_response,
            "session_id": chat_data.session_id or str(uuid.uuid4())
        }

def get_fallback_response(message: str):
    """Provide intelligent fallback responses based on keywords"""
    message_lower = message.lower()
    
    if any(word in message_lower for word in ['hour', 'time', 'open', 'close']):
        return "Our opening hours are Monday to Saturday, 11:00 AM to 6:00 PM. We also offer appointments from 10:00-11:00 AM and 6:00-7:00 PM by special arrangement. Call us at +44 7368 594210 to book!"
    
    elif any(word in message_lower for word in ['threading', 'eyebrow', 'thread']):
        return "We offer comprehensive threading services: Eye Brow (£5), Upper Lip (£3), Chin (£3), Forehead (£3), Neck (£3), Side Face (£5), and Full Face (£15). Our experienced technicians ensure precise and comfortable threading!"
    
    elif any(word in message_lower for word in ['wax', 'waxing']):
        return "We provide both face and body waxing services. Face waxing: Full Face (£18), individual areas from £4-£6. Body waxing: Full Leg (£25), Half Leg (£15), Full Arm (£18), Under Arm (£8), Full Body except bikini (£60)."
    
    elif any(word in message_lower for word in ['manicure', 'pedicure', 'nail']):
        return "Our nail services include professional Manicure (£20) and Pedicure (£25). We use high-quality products and techniques to keep your nails healthy and beautiful!"
    
    elif any(word in message_lower for word in ['facial', 'massage', 'spa']):
        return "We offer various facial treatments: Mini Facial (£15), Full Facial with cleansing/whitening/gold options (£25), Herbal Facial (£30), and Head Massage with or without herbal oil (£15). Perfect for relaxation and skin care!"
    
    elif any(word in message_lower for word in ['makeup', 'bridal', 'party']):
        return "Our makeup services include Party Makeup (from £30) and Bridal Makeup (from £150). We create stunning looks for your special occasions using professional techniques and premium products!"
    
    elif any(word in message_lower for word in ['henna', 'hair', 'cut']):
        return "We offer henna artistry and hair services: One Hand/Foot Henna (from £5), Both Hands/Feet (from £10), Hair Trimming (£7), Other cuts (from £12), and special rates for children under 10 (£10)."
    
    elif any(word in message_lower for word in ['location', 'address', 'where', 'find']):
        return "We're located at 21-23 Woodgrange Road, London E7 8BA (Inside Post Office). Easy to find and accessible by public transport. Call +44 7368 594210 for directions or to book an appointment!"
    
    elif any(word in message_lower for word in ['price', 'cost', 'how much']):
        return "Our prices range from £3 for individual threading services to £150 for bridal makeup. We offer competitive pricing for all beauty services. Would you like to know about specific treatments?"
    
    elif any(word in message_lower for word in ['book', 'appointment', 'schedule']):
        return "To book an appointment, please call us at +44 7368 594210. We're open Monday-Saturday 11:00 AM to 6:00 PM, with special appointment slots available 10:00-11:00 AM and 6:00-7:00 PM."
    
    else:
        return "Hello! I'm your beauty assistant at Femina Beauty Impression. I can help you with information about our services including threading, waxing, facials, manicure/pedicure, makeup, and henna. We're located at 21-23 Woodgrange Road, London E7 8BA. How can I help you today?"

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)