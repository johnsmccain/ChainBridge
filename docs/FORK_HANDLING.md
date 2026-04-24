# Fork Detection and Reorg Handling

ChainBridge indexers include built-in fork/reorg handling for Bitcoin and Ethereum.

## Detection

- Each indexer tracks previous canonical block hash.
- On mismatch, a reorg is detected and `handle_reorg` is triggered.

## Safety Controls

- Reorg depth is computed from `last_synced_block - reorg_block`.
- Reorg metadata is recorded in indexer status:
  - `reorg_count`
  - `last_reorg_block`
  - `last_reorg_depth`
  - `reorg_history`
- Indexing checkpoint is rolled back to `reorg_block - 1`.

## Pause-on-Large-Reorg

- Reorgs with depth `>= 6` set `paused_due_to_reorg = true`.
- Indexing loop pauses briefly before automatic recovery.

## Notifications and History

- Reorg detection emits a synthetic `fork_detected` event onto the indexer queue.
- Reorg history is retained in-memory (latest 50 records) and surfaced by manager status API.
