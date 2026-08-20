from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token, TokenRefresh
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.core.deps import get_current_user
from app.services.audit_service import log_audit_event

router = APIRouter()


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(
    user_data: UserCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    email_clean = user_data.email.strip().lower()
    existing_user = db.query(User).filter(User.email == email_clean).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered"
        )

    # First registered user defaults to ADMIN, subsequent default to DEVELOPER
    user_count = db.query(User).count()
    default_role = "ADMIN" if user_count == 0 else "DEVELOPER"

    new_user = User(
        name=user_data.name.strip(),
        email=email_clean,
        password_hash=hash_password(user_data.password),
        role=default_role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create default workspace for the user
    ws_slug = f"workspace-{new_user.id}"
    new_workspace = Workspace(
        name=f"{new_user.name}'s Workspace",
        slug=ws_slug,
        owner_id=new_user.id
    )
    db.add(new_workspace)
    db.commit()
    db.refresh(new_workspace)

    member = WorkspaceMember(
        workspace_id=new_workspace.id,
        user_id=new_user.id,
        role=default_role
    )
    db.add(member)
    db.commit()

    log_audit_event(
        db=db,
        action="USER_REGISTER",
        resource_type="user",
        actor_id=new_user.id,
        resource_id=str(new_user.id),
        metadata_json={"email": email_clean, "role": default_role},
        request=request
    )

    access_token = create_access_token(subject=new_user.id)
    refresh_token = create_refresh_token(subject=new_user.id)

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(new_user)
    )


@router.post("/login", response_model=Token)
def login(
    login_data: UserLogin,
    request: Request,
    db: Session = Depends(get_db)
):
    email_clean = login_data.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    log_audit_event(
        db=db,
        action="USER_LOGIN",
        resource_type="user",
        actor_id=user.id,
        resource_id=str(user.id),
        metadata_json={"email": email_clean},
        request=request
    )

    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user)
    )


@router.post("/refresh", response_model=Token)
def refresh_token(
    token_data: TokenRefresh,
    db: Session = Depends(get_db)
):
    payload = decode_token(token_data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    access_token = create_access_token(subject=user.id)
    new_refresh_token = create_refresh_token(subject=user.id)

    return Token(
        access_token=access_token,
        refresh_token=new_refresh_token,
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/logout")
def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    log_audit_event(
        db=db,
        action="USER_LOGOUT",
        resource_type="user",
        actor_id=current_user.id,
        resource_id=str(current_user.id),
        request=request
    )
    return {"message": "Successfully logged out"}
