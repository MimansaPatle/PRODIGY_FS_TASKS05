from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from pydantic import BaseModel
from app.auth.dependencies import get_current_user
from app.database import get_database
from app.utils import get_ist_now
from bson import ObjectId

router = APIRouter(prefix="/moderation", tags=["moderation"])

class ReportCreate(BaseModel):
    target_type: str  # "post", "comment", "user"
    target_id: str
    reason: str
    description: str = ""

@router.post("/block/{user_id}")
async def block_user(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Block a user"""
    db = get_database()
    
    if user_id == current_user["_id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot block yourself"
        )
    
    # Check if already blocked
    existing = await db.blocks.find_one({
        "blocker_id": current_user["_id"],
        "blocked_id": user_id
    })
    
    if existing:
        return {"message": "User already blocked"}
    
    # Create block
    await db.blocks.insert_one({
        "blocker_id": current_user["_id"],
        "blocked_id": user_id,
        "created_at": get_ist_now()
    })
    
    # Remove follow relationships
    await db.follows.delete_many({
        "$or": [
            {"follower_id": current_user["_id"], "following_id": user_id},
            {"follower_id": user_id, "following_id": current_user["_id"]}
        ]
    })
    
    return {"message": "User blocked successfully"}

@router.delete("/block/{user_id}")
async def unblock_user(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Unblock a user"""
    db = get_database()
    
    result = await db.blocks.delete_one({
        "blocker_id": current_user["_id"],
        "blocked_id": user_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Block not found"
        )
    
    return {"message": "User unblocked successfully"}

@router.get("/blocked")
async def get_blocked_users(
    current_user: dict = Depends(get_current_user)
):
    """Get list of blocked users"""
    db = get_database()
    
    cursor = db.blocks.find({"blocker_id": current_user["_id"]})
    blocks = await cursor.to_list(length=1000)
    
    blocked_ids = [block["blocked_id"] for block in blocks]
    
    # Get user details
    cursor = db.users.find({"_id": {"$in": blocked_ids}})
    users = await cursor.to_list(length=len(blocked_ids))
    
    return [{
        "id": user["_id"],
        "username": user["username"],
        "displayName": user["displayName"],
        "photoURL": user.get("photoURL")
    } for user in users]

@router.post("/report")
async def report_content(
    report: ReportCreate,
    current_user: dict = Depends(get_current_user)
):
    """Report a post, comment, or user"""
    db = get_database()
    
    report_id = str(ObjectId())
    report_doc = {
        "_id": report_id,
        "reporter_id": current_user["_id"],
        "target_type": report.target_type,
        "target_id": report.target_id,
        "reason": report.reason,
        "description": report.description,
        "status": "pending",  # pending, reviewed, resolved
        "created_at": get_ist_now()
    }
    
    await db.reports.insert_one(report_doc)
    
    return {"message": "Report submitted successfully", "report_id": report_id}

@router.get("/is-blocked/{user_id}")
async def is_user_blocked(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Check if a user is blocked"""
    db = get_database()
    
    block = await db.blocks.find_one({
        "blocker_id": current_user["_id"],
        "blocked_id": user_id
    })
    
    return {"blocked": block is not None}
