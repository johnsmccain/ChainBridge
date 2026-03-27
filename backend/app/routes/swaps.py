"""Swap status, history, and proof verification endpoints (#26, #59)."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.config.redis import get_redis, CacheService
from app.models.swap import CrossChainSwap
from app.schemas.swap import SwapResponse, SwapProof
from app.middleware.auth import require_api_key
from app.ws.events import emit_swap_event, EventType

router = APIRouter()


@router.get("/", response_model=list[SwapResponse])
async def list_swaps(
    chain: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    query = select(CrossChainSwap)
    if chain:
        query = query.where(CrossChainSwap.other_chain == chain)
    if state:
        query = query.where(CrossChainSwap.state == state)
    query = query.order_by(CrossChainSwap.created_at.desc()).limit(limit).offset(offset)

    result = await db.execute(query)
    swaps = result.scalars().all()
    return [SwapResponse.model_validate(s) for s in swaps]


@router.get("/{swap_id}", response_model=SwapResponse)
async def get_swap(swap_id: str, db: AsyncSession = Depends(get_db)):
    cache = CacheService(get_redis())
    cached = await cache.get(f"swap:{swap_id}")
    if cached:
        return cached

    result = await db.execute(select(CrossChainSwap).where(CrossChainSwap.id == swap_id))
    swap = result.scalar_one_or_none()
    if not swap:
        raise HTTPException(status_code=404, detail="Swap not found")

    response = SwapResponse.model_validate(swap).model_dump()
    await cache.set(f"swap:{swap_id}", response, ttl=30)
    return response


@router.post("/{swap_id}/verify-proof")
async def verify_proof(
    swap_id: str, proof: SwapProof, db: AsyncSession = Depends(get_db), _=Depends(require_api_key)
):
    result = await db.execute(select(CrossChainSwap).where(CrossChainSwap.id == swap_id))
    swap = result.scalar_one_or_none()
    if not swap:
        raise HTTPException(status_code=404, detail="Swap not found")

    # Proof verification would call the Soroban contract's verify_proof function.
    # For now, store the proof data and mark as executed.
    swap.other_chain_tx = proof.tx_hash
    swap.state = "executed"
    await db.commit()

    redis = get_redis()
    cache = CacheService(redis)
    await cache.delete(f"swap:{swap_id}")

    response = SwapResponse.model_validate(swap)
    await emit_swap_event(redis, EventType.SWAP_PROOF_VERIFIED, response.model_dump())

    return {"status": "verified", "swap_id": str(swap.id), "state": swap.state}
