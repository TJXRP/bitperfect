const crypto = require('crypto');

class PrivateInclusionFilter {
    constructor(sizeBits = 65536, hashCount = 7) {
        if (!Number.isInteger(sizeBits) || sizeBits < 1024) {
            throw new Error('invalid inclusion filter size');
        }
        if (!Number.isInteger(hashCount) || hashCount < 3) {
            throw new Error('invalid inclusion filter hash count');
        }
        this.sizeBits = sizeBits;
        this.hashCount = hashCount;
        this.bytes = Buffer.alloc(Math.ceil(sizeBits / 8));
    }

    positions(value) {
        const input = Buffer.isBuffer(value) ? value : Buffer.from(String(value));
        const digest = crypto.createHash('sha256').update(input).digest();
        const positions = [];
        for (let i = 0; i < this.hashCount; i++) {
            const offset = (i * 4) % digest.length;
            positions.push(digest.readUInt32BE(offset) % this.sizeBits);
        }
        return positions;
    }

    add(value) {
        for (const position of this.positions(value)) {
            const byteIndex = Math.floor(position / 8);
            const bitIndex = position % 8;
            this.bytes[byteIndex] |= (1 << bitIndex);
        }
    }

    has(value) {
        return this.positions(value).every((position) => {
            const byteIndex = Math.floor(position / 8);
            const bitIndex = position % 8;
            return (this.bytes[byteIndex] & (1 << bitIndex)) !== 0;
        });
    }

    export() {
        return {
            algorithm: 'private-inclusion-filter-v1',
            size_bits: this.sizeBits,
            hash_count: this.hashCount,
            bitset_sha256: crypto.createHash('sha256').update(this.bytes).digest('hex'),
            bitset_base64: this.bytes.toString('base64')
        };
    }
}

module.exports = PrivateInclusionFilter;
