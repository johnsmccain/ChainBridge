"""Base class for chain-specific event indexers."""

import asyncio
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any

logger = logging.getLogger(__name__)


@dataclass
class IndexedEvent:
    """Standardized event representation across all chains."""

    chain: str
    event_type: str
    tx_hash: str
    block_number: int
    contract_address: str | None
    data: dict[str, Any]
    timestamp: datetime | None = None


@dataclass
class IndexerStatus:
    """Current state of an indexer."""

    chain: str
    is_running: bool = False
    last_synced_block: int = 0
    latest_chain_block: int = 0
    blocks_behind: int = 0
    events_processed: int = 0
    reorg_count: int = 0
    last_reorg_block: int | None = None
    last_reorg_depth: int = 0
    paused_due_to_reorg: bool = False
    reorg_history: list[dict[str, Any]] = field(default_factory=list)
    last_error: str | None = None
    last_sync_at: datetime | None = None


class BaseIndexer(ABC):
    """
    Abstract base for chain-specific indexers.

    Subclasses implement chain-specific logic for fetching blocks,
    parsing events, and handling reorgs.
    """

    def __init__(self, chain: str):
        self.chain = chain
        self.status = IndexerStatus(chain=chain)
        self._running = False
        self._event_queue: asyncio.Queue[IndexedEvent] = asyncio.Queue()
        self._pause_until: datetime | None = None

    @abstractmethod
    async def get_latest_block(self) -> int:
        """Get the latest confirmed block number on the chain."""

    @abstractmethod
    async def fetch_events(self, from_block: int, to_block: int) -> list[IndexedEvent]:
        """Fetch events from a block range."""

    @abstractmethod
    async def handle_reorg(self, reorg_block: int) -> None:
        """Handle a chain reorganization starting at reorg_block."""

    async def start(self, from_block: int = 0, poll_interval: int = 10) -> None:
        """Start the indexer loop."""
        self._running = True
        self.status.is_running = True
        self.status.last_synced_block = from_block

        logger.info("[%s] Indexer started from block %d", self.chain, from_block)

        while self._running:
            try:
                if self.status.paused_due_to_reorg and self._pause_until:
                    if datetime.utcnow() < self._pause_until:
                        await asyncio.sleep(poll_interval)
                        continue
                    self.status.paused_due_to_reorg = False
                    self._pause_until = None

                latest = await self.get_latest_block()
                self.status.latest_chain_block = latest
                self.status.blocks_behind = max(
                    0, latest - self.status.last_synced_block
                )

                if self.status.last_synced_block < latest:
                    # Process in batches to avoid overloading
                    batch_size = min(100, latest - self.status.last_synced_block)
                    to_block = self.status.last_synced_block + batch_size

                    events = await self.fetch_events(
                        self.status.last_synced_block + 1, to_block
                    )

                    for event in events:
                        await self._event_queue.put(event)
                        self.status.events_processed += 1

                    self.status.last_synced_block = to_block
                    self.status.last_sync_at = datetime.utcnow()
                    self.status.last_error = None

                    if events:
                        logger.info(
                            "[%s] Processed %d events (blocks %d-%d)",
                            self.chain,
                            len(events),
                            self.status.last_synced_block - batch_size + 1,
                            to_block,
                        )

            except Exception as e:
                self.status.last_error = str(e)
                logger.error("[%s] Indexer error: %s", self.chain, e)

            await asyncio.sleep(poll_interval)

    async def record_reorg(self, reorg_block: int, depth: int) -> None:
        self.status.reorg_count += 1
        self.status.last_reorg_block = reorg_block
        self.status.last_reorg_depth = depth
        self.status.reorg_history.append(
            {
                "reorg_block": reorg_block,
                "depth": depth,
                "detected_at": datetime.utcnow().isoformat(),
            }
        )
        self.status.reorg_history = self.status.reorg_history[-50:]

        await self._event_queue.put(
            IndexedEvent(
                chain=self.chain,
                event_type="fork_detected",
                tx_hash=f"reorg-{self.chain}-{reorg_block}",
                block_number=reorg_block,
                contract_address=None,
                data={"depth": depth, "paused": depth >= 6},
                timestamp=datetime.utcnow(),
            )
        )

        if depth >= 6:
            self.status.paused_due_to_reorg = True
            self._pause_until = datetime.utcnow() + timedelta(minutes=2)

    def stop(self) -> None:
        """Stop the indexer loop."""
        self._running = False
        self.status.is_running = False
        logger.info("[%s] Indexer stopped", self.chain)

    async def get_events(self, max_events: int = 100) -> list[IndexedEvent]:
        """Drain queued events."""
        events = []
        while not self._event_queue.empty() and len(events) < max_events:
            events.append(self._event_queue.get_nowait())
        return events
