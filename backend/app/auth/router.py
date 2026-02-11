from fastapi import APIRouter, HTTPException, status, Depends
from datetime import timedelta, datetime
from app.models import UserCreate, UserLogin, Token, UserResponse
from app.auth.dependencies import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from app.database import get_database
from app.services.email_service import email_service
from app.utils import get_ist_now
from bson import ObjectId
from pydantic import BaseModel
import re
import secrets
import string

router = APIRouter(prefix="/auth", tags=["authentication"])

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

def validate_username(username: str) -> bool:
    """Validate username format"""
    pattern = r'^[a-zA-Z0-9_]{3,30}$'
    return bool(re.match(pattern, username))

@router.post("/register", response_model=dict)
async def register(user: UserCreate):
    """Register a new user"""
    db = get_database()
    
    # Validate username format
    if not validate_username(user.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must be 3-30 characters long and contain only letters, numbers, and underscores"
        )
    
    # Check if user already exists
    existing_user = await db.users.find_one({
        "$or": [
            {"email": user.email},
            {"username": user.username}
        ]
    })
    
    if existing_user:
        if existing_user["email"] == user.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
    
    # Hash password and create user
    hashed_password = get_password_hash(user.password)
    user_id = str(ObjectId())
    
    user_doc = {
        "_id": user_id,
        "username": user.username,
        "email": user.email,
        "displayName": user.displayName,
        "password": hashed_password,
        "photoURL": None,
        "bio": "",
        "followers_count": 0,
        "following_count": 0,
        "posts_count": 0,
        "created_at": get_ist_now()
    }
    
    await db.users.insert_one(user_doc)
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_id}, expires_delta=access_token_expires
    )
    
    # Return user data and token
    user_response = UserResponse(**user_doc)
    return {
        "user": user_response.model_dump(by_alias=True),
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/login", response_model=dict)
async def login(user: UserLogin):
    """Login user"""
    db = get_database()
    
    # Find user by email
    user_doc = await db.users.find_one({"email": user.email})
    
    if not user_doc or not verify_password(user.password, user_doc["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_doc["_id"]}, expires_delta=access_token_expires
    )
    
    # Return user data and token
    user_response = UserResponse(**user_doc)
    return {
        "user": user_response.model_dump(by_alias=True),
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """Send password reset email with reset link"""
    print(f"🔍 Forgot password request received for email: {request.email}")
    
    try:
        db = get_database()
        print("✅ Database connection established")
        
        # Find user by email
        user_doc = await db.users.find_one({"email": request.email})
        print(f"🔍 User lookup result: {'Found' if user_doc else 'Not found'}")
        
        if not user_doc:
            # Don't reveal if email exists or not for security
            print("⚠️ User not found, returning generic message")
            return {"message": "If the email exists, a password reset link has been sent"}
        
        # Generate a secure reset token
        reset_token = secrets.token_urlsafe(32)
        print(f"🔑 Generated reset token: {reset_token[:10]}...")
        
        # Set token expiration (1 hour from now)
        expires_at = get_ist_now() + timedelta(hours=1)
        print(f"⏰ Token expires at: {expires_at}")
        
        # Store reset token in database
        print("🗑️ Removing old tokens...")
        await db.password_resets.delete_many({"user_id": user_doc["_id"]})  # Remove old tokens
        
        print("💾 Storing new reset token...")
        await db.password_resets.insert_one({
            "user_id": user_doc["_id"],
            "email": request.email,
            "token": reset_token,
            "expires_at": expires_at,
            "used": False,
            "created_at": get_ist_now()
        })
        print("✅ Reset token stored successfully")
        
        # Send email with reset link
        try:
            print(f"📧 Sending password reset email to: {request.email}")
            email_sent = email_service.send_password_reset_link(request.email, reset_token)
            if email_sent:
                print(f"✅ Password reset email sent successfully to {request.email}")
            else:
                print(f"❌ Failed to send email to {request.email}")
        except Exception as e:
            print(f"📧 Email service error: {str(e)}")
        
        print("✅ Forgot password request completed successfully")
        return {"message": "If the email exists, a password reset link has been sent"}
        
    except Exception as e:
        print(f"❌ Error in forgot_password endpoint: {str(e)}")
        print(f"❌ Error type: {type(e).__name__}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Reset password using token"""
    db = get_database()
    
    # Find valid reset token
    reset_doc = await db.password_resets.find_one({
        "token": request.token,
        "used": False,
        "expires_at": {"$gt": get_ist_now()}
    })
    
    if not reset_doc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Hash new password
    hashed_password = get_password_hash(request.new_password)
    
    # Update user's password
    await db.users.update_one(
        {"_id": reset_doc["user_id"]},
        {"$set": {"password": hashed_password}}
    )
    
    # Mark token as used
    await db.password_resets.update_one(
        {"_id": reset_doc["_id"]},
        {"$set": {"used": True, "used_at": get_ist_now()}}
    )
    
    print(f"✅ Password reset successful for user: {reset_doc['email']}")
    
    return {"message": "Password reset successful"}

@router.get("/verify-reset-token/{token}")
async def verify_reset_token(token: str):
    """Verify if reset token is valid"""
    db = get_database()
    
    # Check if token exists and is valid
    reset_doc = await db.password_resets.find_one({
        "token": token,
        "used": False,
        "expires_at": {"$gt": get_ist_now()}
    })
    
    if not reset_doc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    return {
        "valid": True,
        "email": reset_doc["email"],
        "expires_at": reset_doc["expires_at"]
    }