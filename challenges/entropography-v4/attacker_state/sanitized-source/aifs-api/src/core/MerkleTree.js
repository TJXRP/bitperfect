/**
 * MerkleTree.js - Tamper-evident turn history integrity layer.
 * USPTO Patent Pending: 19/551,805 (Merkle anchor CIP)
 *
 * Each leaf = SHA-256(pid + turnNum + contentHash + timestamp)
 * Root = deterministic proof that no turns were inserted, deleted, or reordered.
 * Recompute root anytime from the manifest and compare to stored root to verify integrity.
 */

const crypto = require('crypto');

function sha256(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

// Hash a single turn entry into a leaf.
function leafHash(turn) {
    return sha256(`${turn.pid}:${turn.turnNum}:${turn.hash || ''}:${turn.ts}`);
}

// Build Merkle root from an array of hex leaf hashes.
// Odd number of leaves: last leaf is duplicated (standard Bitcoin Merkle convention).
function buildRoot(leaves) {
    if (!leaves || leaves.length === 0) return null;
    let level = [...leaves];
    while (level.length > 1) {
        const next = [];
        for (let i = 0; i < level.length; i += 2) {
            const left  = level[i];
            const right = level[i + 1] || level[i];
            next.push(sha256(left + right));
        }
        level = next;
    }
    return level[0];
}

// Compute Merkle root directly from a manifest turns array.
function rootFromTurns(turns) {
    if (!turns || turns.length === 0) return null;
    return buildRoot(turns.map(leafHash));
}

// Generate inclusion proof for the turn at index.
// Returns array of { hash, side: 'left'|'right' } steps from leaf to root.
function getProof(turns, index) {
    if (!turns || index < 0 || index >= turns.length) return null;
    let level = turns.map(leafHash);
    const proof = [];
    let idx = index;
    while (level.length > 1) {
        const siblingIdx = (idx % 2 === 0) ? idx + 1 : idx - 1;
        const sibling    = level[Math.min(siblingIdx, level.length - 1)];
        proof.push({ hash: sibling, side: idx % 2 === 0 ? 'right' : 'left' });
        const next = [];
        for (let i = 0; i < level.length; i += 2) {
            next.push(sha256(level[i] + (level[i + 1] || level[i])));
        }
        level = next;
        idx   = Math.floor(idx / 2);
    }
    return proof;
}

// Verify that a leaf hash is included in a tree with the given root.
function verifyProof(leafH, proof, root) {
    let current = leafH;
    for (const step of proof) {
        current = step.side === 'right'
            ? sha256(current + step.hash)
            : sha256(step.hash + current);
    }
    return current === root;
}

module.exports = { leafHash, rootFromTurns, buildRoot, getProof, verifyProof };
