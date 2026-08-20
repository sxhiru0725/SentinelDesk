from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember
from app.schemas.workspace import WorkspaceResponse, WorkspaceMemberResponse, WorkspaceMemberRoleUpdate
from app.core.deps import get_current_user, get_current_workspace, check_role
from app.services.audit_service import log_audit_event

router = APIRouter()


@router.get("/current", response_model=WorkspaceResponse)
def get_current_workspace_info(
    workspace: Workspace = Depends(get_current_workspace)
):
    return workspace


@router.get("/members", response_model=List[WorkspaceMemberResponse])
def get_workspace_members(
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    members = (
        db.query(WorkspaceMember)
        .filter(WorkspaceMember.workspace_id == workspace.id)
        .all()
    )
    return members


@router.put("/members/{user_id}/role", response_model=WorkspaceMemberResponse)
def update_member_role(
    user_id: int,
    role_data: WorkspaceMemberRoleUpdate,
    request: Request,
    current_user: User = Depends(check_role(["ADMIN"])),
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    member = (
        db.query(WorkspaceMember)
        .filter(
            WorkspaceMember.workspace_id == workspace.id,
            WorkspaceMember.user_id == user_id
        )
        .first()
    )
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found in workspace"
        )

    old_role = member.role
    member.role = role_data.role
    db.commit()
    db.refresh(member)

    log_audit_event(
        db=db,
        action="ROLE_UPDATE",
        resource_type="workspace_member",
        workspace_id=workspace.id,
        actor_id=current_user.id,
        resource_id=str(user_id),
        metadata_json={"old_role": old_role, "new_role": role_data.role},
        request=request
    )

    return member


@router.delete("/members/{user_id}")
def remove_workspace_member(
    user_id: int,
    request: Request,
    current_user: User = Depends(check_role(["ADMIN"])),
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    if user_id == workspace.owner_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove workspace owner"
        )

    member = (
        db.query(WorkspaceMember)
        .filter(
            WorkspaceMember.workspace_id == workspace.id,
            WorkspaceMember.user_id == user_id
        )
        .first()
    )
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found in workspace"
        )

    db.delete(member)
    db.commit()

    log_audit_event(
        db=db,
        action="MEMBER_REMOVE",
        resource_type="workspace_member",
        workspace_id=workspace.id,
        actor_id=current_user.id,
        resource_id=str(user_id),
        request=request
    )

    return {"message": "Member removed successfully"}
