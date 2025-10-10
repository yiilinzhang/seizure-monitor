from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_session
from app.core.dependencies import get_current_user
from app.models.emergency_contact import EmergencyContact
from app.models.user import User
from app.schemas.emergency import (
    EmergencyContactCreate,
    EmergencyContactUpdate,
    EmergencyContactResponse
)

router = APIRouter()

@router.get("/", response_model=dict)
async def get_contacts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Get all emergency contacts for the authenticated user"""
    result = await db.execute(
        select(EmergencyContact)
        .where(EmergencyContact.user_id == current_user.id)
        .order_by(EmergencyContact.created_at.desc())
    )
    contacts = result.scalars().all()

    return {
        "contacts": [
            {
                "id": contact.id,
                "name": contact.name,
                "phone_number": contact.phone_number,
                "created_at": contact.created_at
            }
            for contact in contacts
        ],
        "count": len(contacts)
    }

@router.post("/", response_model=dict)
async def add_contact(
    contact_data: EmergencyContactCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Add a new emergency contact"""
    # Check if contact already exists
    result = await db.execute(
        select(EmergencyContact)
        .where(
            EmergencyContact.user_id == current_user.id,
            EmergencyContact.phone_number == contact_data.phone_number
        )
    )

    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Contact with this phone number already exists"
        )

    # Create new contact
    new_contact = EmergencyContact(
        user_id=current_user.id,
        name=contact_data.name,
        phone_number=contact_data.phone_number
    )

    db.add(new_contact)
    await db.commit()
    await db.refresh(new_contact)

    return {
        "message": "Contact added successfully",
        "contact": {
            "id": new_contact.id,
            "name": new_contact.name,
            "phone_number": new_contact.phone_number,
            "created_at": new_contact.created_at
        }
    }

@router.put("/{contact_id}", response_model=dict)
async def update_contact(
    contact_id: int,
    contact_data: EmergencyContactUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Update an emergency contact"""
    # Get the contact
    result = await db.execute(
        select(EmergencyContact)
        .where(
            EmergencyContact.id == contact_id,
            EmergencyContact.user_id == current_user.id
        )
    )
    contact = result.scalars().first()

    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )

    # Update fields
    if contact_data.name is not None:
        contact.name = contact_data.name
    if contact_data.phone_number is not None:
        contact.phone_number = contact_data.phone_number

    await db.commit()
    await db.refresh(contact)

    return {
        "message": "Contact updated successfully",
        "contact": {
            "id": contact.id,
            "name": contact.name,
            "phone_number": contact.phone_number,
            "created_at": contact.created_at
        }
    }

@router.delete("/{contact_id}", response_model=dict)
async def delete_contact(
    contact_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """Delete an emergency contact"""
    # Get the contact
    result = await db.execute(
        select(EmergencyContact)
        .where(
            EmergencyContact.id == contact_id,
            EmergencyContact.user_id == current_user.id
        )
    )
    contact = result.scalars().first()

    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )

    await db.delete(contact)
    await db.commit()

    return {
        "message": "Contact deleted successfully",
        "id": contact_id
    }