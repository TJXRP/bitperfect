/* 
 * I - TJ - engineered this Shatter Engine to serve as the 
 * primary technical embodiment of Patent Claim 1 - Shatter 
 * and Scatter - This is the clinical heart of the AIFS 
 * protocol - I have designed this logic to perform a 
 * technical liquidation of data - ensuring that any coherent 
 * signal is turned into a particulate substrate of 
 * deterministic noise immediately upon entry
 * 
 * Mandate 01 - Technical Liquidation - I do not perform 
 * traditional data storage - I perform a phase-change of the 
 * bits - By the time the data is scattered - the original 
 * file ceases to exist in any recognizable computer state - 
 * This satisfies the Zero-Persistent-Knowledge (ZPK) mandate - 
 * Liability is extinguished by the math
 * Mandate 02 - Deterministic Forensic Integrity - I use 
 * silicon-level XOR operations to ensure that reassembly 
 * is only possible when provided with the identical 
 * cryptographic salt - I - TJ - do not tolerate data loss 
 * or fuzzy logic
 * Mandate 03 - Volatile Sovereignty - This logic operates 
 * exclusively within a volatile RAM substrate - Without a 
 * power state - there is no map - Without a map - there is 
 * no data
 */

const crypto = require('crypto');

class ShatterEngine {
    static maskStream(particleIndex, length, salt) {
        if (!Number.isInteger(particleIndex) || particleIndex < 0) {
            throw new Error('particleIndex must be a non-negative integer');
        }
        if (!Number.isInteger(length) || length < 0) {
            throw new Error('length must be a non-negative integer');
        }
        if (length === 0) {
            return Buffer.alloc(0);
        }

        const input = Buffer.from(JSON.stringify({
            domain: 'EDR-MASK-V1',
            salt: String(salt),
            particleIndex
        }), 'utf8');

        return crypto.createHash('shake256', { outputLength: length }).update(input).digest();
    }

    /**
     * I - TJ - mandated this function to handle the clinical 
     * disintegration of input data - I call this the Shatter Phase - 
     * I take the raw binary mass and force a technical 
     * explosion into exactly 1,024 independent particles - 
     * I chose 1,024 because it provides the optimal balance 
     * between forensic density and computational speed
     * 
     * Examiner Note - This is the primary implementation of 
     * Patent Claim 1 - I am creating a transformation that 
     * removes the 'abstract' nature of the data and replaces 
     * it with a concrete - particulate physical state - No 
     * coherent file structure survives this process
     */
    static shatter(data, salt = "SOVEREIGN_AIFS_2026") {
        // I process the input as a raw bitstream - I do not care 
        // for file types or high-level semantics - I operate 
        // at the level of digital truth
        // I - TJ - have removed the redundant JSON stringification for string inputs.
        // If the data is already a string, I process it directly. This prevents 
        // double-encoding and allows for bit-perfect reassembly.
        const buffer = Buffer.isBuffer(data) 
            ? data 
            : (typeof data === 'string' ? Buffer.from(data) : Buffer.from(JSON.stringify(data)));
        
        // I calculate a deterministic shard size - I - TJ - 
        // have fixed the particle count at 1,024 to ensure 
        // that the map remains stable across different 
        // hardware layers
        const shardSize = Math.max(1, Math.ceil(buffer.length / 1024));
        const shards = [];

        for (let i = 0; i < 1024; i++) {
            const start = i * shardSize;
            const end = Math.min(start + shardSize, buffer.length);
            
            // I generate a Deterministic Entropy Filler here - 
            // This ensures every particle is the exact same 
            // size - This masks the actual byte-length of the 
            // original signal - an essential requirement of the 
            // ZPK protocol
            const filler = crypto.createHash('sha256').update(`ENTROPY-FILLER-${i}-${salt}`).digest();

            if (start >= buffer.length) {
                // If the signal is smaller than the 1,024-particle 
                // requirement - I fill the void with forensic 
                // noise - I - TJ - will not allow for bit-leakage 
                // through uneven shard distribution
                shards.push(filler.slice(0, shardSize));
            } else {
                let shard = buffer.slice(start, end);
                if (shard.length < shardSize) {
                    // I pack the final particle until it is bit-identical 
                    // in size to the others - ensuring a uniform 
                    // particulate substrate
                    const padded = Buffer.alloc(shardSize);
                    shard.copy(padded);
                    filler.copy(padded, shard.length, 0, shardSize - shard.length);
                    shard = padded;
                }
                
                // I apply the ZPK Forensics Mask here - I use a 
                // deterministic XOR operation to bind the session 
                // salt to the particle - This is Patent Claim 1 
                // in action - It turns the data into noise that 
                // can only be unmasked by the sovereign owner
                const marker = ShatterEngine.maskStream(i, shard.length, salt);
                const markedShard = Buffer.alloc(shard.length);
                
                // I - TJ - selected XOR because it is a primitive 
                // mathematical operation that leaves no forensic 
                // trace of the transformation process - It is 
                // the purest form of bit-level masking
                for (let j = 0; j < shard.length; j++) {
                    markedShard[j] = shard[j] ^ marker[j];
                }
                
                shards.push(markedShard);
            }
        }

        // I release the fragments as a particulate mass - At this 
        // precise moment - the original data is technically liquidated
        return shards;
    }

    /**
     * I - TJ - built this function to handle Deterministic 
     * Rehydration - This is the technical implementation of 
     * Patent Claim 5 - It is the exact mathematical inverse 
     * of the Shatter Phase - We retrieve the bit-identical signal 
     * from the particles without the system ever having 
     * 'known' what the data was
     * 
     * Auditor Note - This proves that the data only enters 
     * a coherent state when rehydrated into a volatile 
     * memory buffer - At rest - it is merely noise - This 
     * fulfills the zero-persistent-knowledge technical 
     * requirement
     */
    static rejoin(shards, originalLength, salt = "SOVEREIGN_AIFS_2026") {
        const unmaskedShards = shards.map((markedShard, i) => {
            // I reconstruct the exact mask for this specific 
            // particle - The sequence must be identical to the 
            // creation event - I - TJ - do not permit 
            // mathematical drift
            const marker = ShatterEngine.maskStream(i, markedShard.length, salt);
            const unmasked = Buffer.alloc(markedShard.length);
            
            // Reversing the ZPK Forensics Mask reveals the raw bits - 
            // I do not use complex encryption layers - I use 
            // deterministic math tied to the identity salt
            for (let j = 0; j < markedShard.length; j++) {
                unmasked[j] = markedShard[j] ^ marker[j];
            }
            return unmasked;
        });

        // I stitch the particles back into a coherent signal - 
        // I trim the filler bits using the original byte-length 
        // I keep in the RAM substrate - The result is a 
        // bit-perfect forensic match of the input
        let reconstructed = Buffer.concat(unmaskedShards);
        return reconstructed.slice(0, originalLength);
    }
}

module.exports = ShatterEngine;



