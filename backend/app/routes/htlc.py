"""HTLC endpoints: create, claim, refund, status (#26, #59)."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.config.redis import get_redis, CacheService
from app.models.htlc import HTLC
from app.schemas.htlc import HTLCCreate, HTLCResponse, HTLCClaim
from app.middleware.auth import require_api_key
from app.ws.events import emit_htlc_event, EventType

router = APIRouter()


@router.post("/", response_model=HTLCResponse, status_code=201)
async def create_htlc(data: HTLCCreate, db: AsyncSession = Depends(get_db), _=Depends(require_api_key)):
    htlc = HTLC(
        sender=data.sender,
        receiver=data.receiver,
        amount=data.amount,
        hash_lock=data.hash_lock,
        time_lock=data.time_lock,
        hash_algorithm=data.hash_algorithm,
        status="active",
    )
    db.add(htlc)
    await db.commit()
    await db.refresh(htlc)

    redis = get_redis()
    cache = CacheService(redis)
    await cache.delete(f"htlc:{htlc.id}")

    response = HTLCResponse.model_validate(htlc)
    await emit_htlc_event(redis, EventType.HTLC_CREATED, response.model_dump())
    return response


@router.get("/{htlc_id}", response_model=HTLCResponse)
async def get_htlc(htlc_id: str, db: AsyncSession = Depends(get_db)):
    cache = CacheService(get_redis())
    cached = await cache.get(f"htlc:{htlc_id}")
    if cached:
        return cached

    result = await db.execute(select(HTLC).where(HTLC.id == htlc_id))
    htlc = result.scalar_one_or_none()
    if not htlc:
        raise HTTPException(status_code=404, detail="HTLC not found")

    response = HTLCResponse.model_validate(htlc).model_dump()
    await cache.set(f"htlc:{htlc_id}", response, ttl=60)
    return response


@router.post("/{htlc_id}/claim", response_model=HTLCResponse)
async def claim_htlc(htlc_id: str, data: HTLCClaim, db: AsyncSession = Depends(get_db), _=Depends(require_api_key)):
    result = await db.execute(select(HTLC).where(HTLC.id == htlc_id))
    htlc = result.scalar_one_or_none()
    if not htlc:
        raise HTTPException(status_code=404, detail="HTLC not found")
    if htlc.status != "active":
        raise HTTPException(status_code=400, detail="HTLC is not active")

    htlc.status = "claimed"
    htlc.secret = data.secret
    await db.commit()

    redis = get_redis()
    cache = CacheService(redis)
    await cache.delete(f"htlc:{htlc_id}")

    response = HTLCResponse.model_validate(htlc)
    await emit_htlc_event(redis, EventType.HTLC_CLAIMED, response.model_dump())
    return response


@router.post("/{htlc_id}/refund", response_model=HTLCResponse)
async def refund_htlc(htlc_id: str, db: AsyncSession = Depends(get_db), _=Depends(require_api_key)):
    result = await db.execute(select(HTLC).where(HTLC.id == htlc_id))
    htlc = result.scalar_one_or_none()
    if not htlc:
        raise HTTPException(status_code=404, detail="HTLC not found")
    if htlc.status != "active":
        raise HTTPException(status_code=400, detail="HTLC is not active")

    htlc.status = "refunded"
    await db.commit()

    redis = get_redis()
    cache = CacheService(redis)
    await cache.delete(f"htlc:{htlc_id}")

    response = HTLCResponse.model_validate(htlc)
    await emit_htlc_event(redis, EventType.HTLC_REFUNDED, response.model_dump())
    return response


@router.get("/{htlc_id}/status")
async def get_htlc_status(htlc_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(HTLC).where(HTLC.id == htlc_id))
    htlc = result.scalar_one_or_none()
    if not htlc:
        raise HTTPException(status_code=404, detail="HTLC not found")
    return {"htlc_id": str(htlc.id), "status": htlc.status}
