from typing import Optional, Callable
from fastapi import Depends, HTTPException, Header, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.security import decode_token
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def get_current_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme)
) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    
    return user


def get_current_workspace(
    x_workspace_id: Optional[str] = Header(None, alias="X-Workspace-ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Workspace:
    """
    Retrieves the current workspace and validates that current_user has access.
    """
    if x_workspace_id and x_workspace_id.isdigit():
        target_ws_id = int(x_workspace_id)
        membership = (
            db.query(WorkspaceMember)
            .filter(
                WorkspaceMember.workspace_id == target_ws_id,
                WorkspaceMember.user_id == current_user.id
            )
            .first()
        )
        if not membership and current_user.role != "ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this workspace"
            )
        workspace = db.query(Workspace).filter(Workspace.id == target_ws_id).first()
        if workspace:
            return workspace

    # Fallback to user's first workspace membership
    membership = (
        db.query(WorkspaceMember)
        .filter(WorkspaceMember.user_id == current_user.id)
        .first()
    )
    if membership:
        workspace = db.query(Workspace).filter(Workspace.id == membership.workspace_id).first()
        if workspace:
            return workspace

    # Fallback: check if user owns a workspace
    workspace = db.query(Workspace).filter(Workspace.owner_id == current_user.id).first()
    if workspace:
        return workspace

    # Create default workspace for user if none exists
    new_ws = Workspace(
        name=f"{current_user.name}'s Workspace",
        slug=f"workspace-{current_user.id}",
        owner_id=current_user.id
    )
    db.add(new_ws)
    db.commit()
    db.refresh(new_ws)

    member = WorkspaceMember(
        workspace_id=new_ws.id,
        user_id=current_user.id,
        role=current_user.role or "ADMIN"
    )
    db.add(member)
    db.commit()

    return new_ws


def check_role(required_roles: list[str]) -> Callable:
    """
    Enforces that the current user has one of the required roles in system or workspace context.
    ROLE HIERARCHY: ADMIN > SECURITY_ANALYST > DEVELOPER > VIEWER
    """
    ROLE_HIERARCHY = {
        "ADMIN": 4,
        "SECURITY_ANALYST": 3,
        "DEVELOPER": 2,
        "VIEWER": 1
    }

    def role_checker(
        current_user: User = Depends(get_current_user),
        workspace: Workspace = Depends(get_current_workspace),
        db: Session = Depends(get_db)
    ) -> User:
        # Check system role or workspace specific role
        membership = (
            db.query(WorkspaceMember)
            .filter(
                WorkspaceMember.workspace_id == workspace.id,
                WorkspaceMember.user_id == current_user.id
            )
            .first()
        )
        effective_role = membership.role if membership else current_user.role
        
        user_level = ROLE_HIERARCHY.get(effective_role.upper(), 1)
        required_levels = [ROLE_HIERARCHY.get(r.upper(), 1) for r in required_roles]
        min_required_level = min(required_levels) if required_levels else 1

        if user_level < min_required_level and current_user.role != "ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied. Required role: {', '.join(required_roles)}"
            )
        return current_user

    return role_checker
