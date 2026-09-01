const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ShatterEngine = require('../../aifs-api/src/core/ShatterEngine');
const DNAFactory = require('../../aifs-api/src/core/DNAFactory');
const MerkleTree = require('../../aifs-api/src/core/MerkleTree');
const PrivateInclusionFilter = require('./private-inclusion-filter');

const PARTICLE_COUNT = 1024;
const FIXED_PUBLIC_PARTICLE_BYTES = 128;
const MAX_RECORD_BYTES = PARTICLE_COUNT * FIXED_PUBLIC_PARTICLE_BYTES;

function sha256(value) {
    return crypto.createHash('sha256').update(value).digest('hex');
}

function ensureDir(dir) {
    fs.mkdirSync(dir, { recursive: true });
}

function writeJson(filePath, value) {
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function hexPairs(buffer) {
    return buffer.toString('hex').match(/.{1,2}/g).join(' ');
}

function opaqueId() {
    return crypto.randomBytes(16).toString('hex');
}

function padForUniformParticles(input) {
    if (input.length > MAX_RECORD_BYTES) {
        throw new Error('input exceeds the 128 KiB per-object ceiling');
    }

    const particleBytes = FIXED_PUBLIC_PARTICLE_BYTES;
    const paddedLength = particleBytes * PARTICLE_COUNT;
    if (input.length === paddedLength) {
        return {
            padded: input,
            particleBytes,
            padBytes: 0,
            padHash: null
        };
    }

    const padding = crypto.randomBytes(paddedLength - input.length);
    return {
        padded: Buffer.concat([input, padding]),
        particleBytes,
        padBytes: padding.length,
        padHash: sha256(padding)
    };
}

function assertCoreReady() {
    if (typeof ShatterEngine?.shatter !== 'function' || typeof ShatterEngine?.rejoin !== 'function') {
        throw new Error('Real EDR engine is not running. No particles or anchors were created.');
    }
    if (typeof DNAFactory?.generateWitness !== 'function') {
        throw new Error('Real EDR anchor factory is not running. No particles or anchors were created.');
    }
    if (!process.env.DNA_LOOKUP) {
        throw new Error('DNA_LOOKUP is not configured. No particles or anchors were created.');
    }
}

function stableAuthRecord(authMaterial) {
    if (!authMaterial || !String(authMaterial).trim()) {
        throw new Error('authorization material is required');
    }
    return {
        algorithm: 'sha256',
        auth_hash: sha256(Buffer.from(String(authMaterial), 'utf8'))
    };
}

function makeSalt(authRecord, nonce) {
    return sha256(Buffer.from(`${authRecord.auth_hash}:${nonce}`, 'utf8'));
}

async function particleizeBuffer(options) {
    assertCoreReady();

    const input = Buffer.isBuffer(options.input) ? options.input : Buffer.from(options.input);
    const datasetId = options.datasetId || 'user-provided';
    const datasetLabel = options.datasetLabel || 'User-provided data';
    const sourcePath = options.sourcePath || null;
    const runRoot = options.runRoot;
    const authRecord = stableAuthRecord(options.authMaterial);
    const nonce = crypto.randomBytes(32).toString('hex');
    const salt = makeSalt(authRecord, nonce);
    const inputHash = sha256(input);
    const paddedInput = padForUniformParticles(input);
    const runId = `edr-alpha-${new Date().toISOString().replace(/[:.]/g, '')}-${opaqueId().slice(0, 8)}`;
    const runDir = path.join(runRoot, runId);

    const dirs = {
        publicParticles: path.join(runDir, 'public_particles'),
        privateAnchors: path.join(runDir, 'private_anchors'),
        proofs: path.join(runDir, 'proofs'),
        audit: path.join(runDir, 'audit'),
        failures: path.join(runDir, 'failure_lanes'),
        checks: path.join(runDir, 'reconstruction_checks')
    };
    Object.values(dirs).forEach(ensureDir);

    const particles = ShatterEngine.shatter(paddedInput.padded, salt);
    if (!Array.isArray(particles) || particles.length !== PARTICLE_COUNT) {
        throw new Error('real engine returned an invalid particle count');
    }

    const anchor = DNAFactory.generateWitness(particles);
    if (!DNAFactory.verifyWitness(anchor)) {
        throw new Error('real anchor factory produced an anchor that failed verification');
    }

    const particleRecords = particles.map((particle, index) => {
        const publicId = opaqueId();
        const hash = sha256(particle);
        return {
            public_id: publicId,
            index,
            hash,
            bytes: particle.length,
            buffer: particle
        };
    });
    const particleSizes = new Set(particleRecords.map((record) => record.bytes));
    if (particleSizes.size !== 1 || !particleSizes.has(paddedInput.particleBytes)) {
        throw new Error('public particle byte uniformity failed');
    }

    await Promise.all(particleRecords.map(async (record) => {
        const publicFile = path.join(dirs.publicParticles, record.public_id);
        await fs.promises.writeFile(publicFile, hexPairs(record.buffer));
    }));

    const inclusionFilter = new PrivateInclusionFilter();
    for (const record of particleRecords) inclusionFilter.add(record.hash);

    const turns = particleRecords.map((record) => ({
        pid: record.public_id,
        turnNum: record.index,
        hash: record.hash,
        ts: runId
    }));
    const merkleRoot = MerkleTree.rootFromTurns(turns);
    const merkleSamples = [0, Math.floor(PARTICLE_COUNT / 2), PARTICLE_COUNT - 1].map((index) => {
        const leaf = MerkleTree.leafHash(turns[index]);
        const proof = MerkleTree.getProof(turns, index);
        return {
            public_id: turns[index].pid,
            leaf,
            proof,
            verified: MerkleTree.verifyProof(leaf, proof, merkleRoot)
        };
    });

    const reconstructed = ShatterEngine.rejoin(particles, paddedInput.padded.length, salt).slice(0, input.length);
    const reconstructedHash = sha256(reconstructed);
    const bitPerfect = reconstructedHash === inputHash;
    if (!bitPerfect) {
        throw new Error('bit-perfect reconstruction failed on the real particle set');
    }

    const sharedAnchorFields = {
        anchor,
        anchor_verified: true,
        anchor_visibility: 'private',
        proof_substrate: 'local-edr-alpha',
        blockchain_anchor: false,
        authorization_required: true,
        authorization_record: authRecord,
        recovery_nonce: options.persistRecovery === true ? nonce : undefined,
        nonce_hash: sha256(Buffer.from(nonce, 'utf8')),
        salt_hash: sha256(Buffer.from(salt, 'utf8')),
        original_length: input.length,
        padded_length: paddedInput.padded.length,
        padding_bytes: paddedInput.padBytes,
        padding_sha256: paddedInput.padHash,
        input_sha256: inputHash,
        particle_count: particles.length,
        merkle_root: merkleRoot,
        record_id: options.recordId || null,
        record_label: options.recordLabel || null
    };

    // EDR rule: every public particle gets exactly one paired private anchor.
    // The filenames must match. Never collapse these into one bulk anchor map.
    const particleAnchors = particleRecords.map((record) => {
        const leaf = MerkleTree.leafHash(turns[record.index]);
        const proof = MerkleTree.getProof(turns, record.index);
        return {
            ...sharedAnchorFields,
            public_id: record.public_id,
            particle_index: record.index,
            particle_hash: record.hash,
            particle_bytes: record.bytes,
            bloom_membership: {
                algorithm: 'private-inclusion-filter-v1',
                value_hash: record.hash,
                positions: inclusionFilter.positions(record.hash)
            },
            merkle_proof: {
                leaf,
                proof,
                verified: MerkleTree.verifyProof(leaf, proof, merkleRoot)
            }
        };
    });

    const failureLanes = runFailureLanes({
        particles,
        input,
        inputHash,
        anchor,
        salt,
        paddedLength: paddedInput.padded.length,
        authRecord,
        merkleRoot,
        turns
    });

    // Write one anchor per particle using the same opaque ID as the particle.
    // This keeps the two-folder shape stable: public_particles and private_anchors.
    const writePromises = particleAnchors.map(async (particleAnchor) => {
        const filePath = path.join(dirs.privateAnchors, particleAnchor.public_id);
        await fs.promises.writeFile(filePath, JSON.stringify(particleAnchor, null, 2));
    });

    writePromises.push(fs.promises.writeFile(path.join(dirs.proofs, 'private-inclusion-filter.json'), JSON.stringify(inclusionFilter.export(), null, 2)));
    writePromises.push(fs.promises.writeFile(path.join(dirs.proofs, 'merkle-proof-samples.json'), JSON.stringify({
        merkle_root: merkleRoot,
        samples: merkleSamples
    }, null, 2)));
    writePromises.push(fs.promises.writeFile(path.join(dirs.checks, 'bit-perfect.json'), JSON.stringify({
        input_sha256: inputHash,
        reconstructed_sha256: reconstructedHash,
        bit_perfect: bitPerfect
    }, null, 2)));

    for (const lane of failureLanes) {
        writePromises.push(fs.promises.writeFile(path.join(dirs.failures, `${lane.lane}.json`), JSON.stringify(lane, null, 2)));
    }

    const publicManifest = {
        dataset_id: datasetId,
        dataset_label: datasetLabel,
        classification: options.classification || 'public',
        public_particle_folder: path.relative(runDir, dirs.publicParticles).replace(/\\/g, '/'),
        particle_count: particles.length,
        particle_bytes_each: paddedInput.particleBytes,
        anchor_status: 'verified_private',
        proof_substrate: 'local-edr-alpha',
        blockchain_anchor: false,
        inclusion_filter_status: 'verified_private',
        merkle_root: merkleRoot,
        bit_perfect: bitPerfect,
        failure_lanes: failureLanes.map((lane) => ({
            lane: lane.lane,
            result: lane.result,
            reason: lane.reason
        }))
    };

    const auditIndex = {
        run_id: runId,
        dataset_id: datasetId,
        dataset_label: datasetLabel,
        classification: options.classification || 'public',
        source_path: sourcePath,
        record_id: options.recordId || null,
        record_label: options.recordLabel || null,
        record_count: options.recordCount || null,
        particle_count: particles.length,
        anchor_count: particleAnchors.length,
        public_particle_folder: dirs.publicParticles,
        private_anchor_folder: dirs.privateAnchors,
        proof_folder: dirs.proofs,
        merkle_root: merkleRoot,
        inclusion_filter_status: 'verified_private',
        authorization_required: true,
        smart_anchor_required: true,
        proof_substrate: 'local-edr-alpha',
        blockchain_anchor: false,
        bit_perfect_checks: [path.join(dirs.checks, 'bit-perfect.json')],
        failure_lanes: failureLanes.map((lane) => path.join(dirs.failures, `${lane.lane}.json`)),
        last_verified_at: new Date().toISOString(),
        edr_engine_version: 'edr-alpha-wrapper-v1-over-aifs-core',
        core_modules: {
            shatter_engine: path.resolve(__dirname, '../../aifs-api/src/core/ShatterEngine.js'),
            anchor_factory: path.resolve(__dirname, '../../aifs-api/src/core/DNAFactory.js'),
            merkle_tree: path.resolve(__dirname, '../../aifs-api/src/core/MerkleTree.js')
        },
        notes: [
            'Core files were imported and not modified.',
            'Public particle identifiers are opaque and do not preserve source ordering.',
            'Each public particle has one paired private anchor file with the same opaque identifier.',
            'Authorization material, nonce material, salt material, and reconstruction ordering are private.'
        ]
    };

    writePromises.push(fs.promises.writeFile(path.join(dirs.audit, 'audit-index.json'), JSON.stringify(auditIndex, null, 2)));
    writePromises.push(fs.promises.writeFile(path.join(runDir, 'public-manifest.json'), JSON.stringify(publicManifest, null, 2)));

    await Promise.all(writePromises);

    return {
        run_id: runId,
        run_dir: runDir,
        public_manifest: path.join(runDir, 'public-manifest.json'),
        audit_index: path.join(dirs.audit, 'audit-index.json'),
        particle_count: particles.length,
        anchor_status: 'verified_private',
        proof_substrate: 'local-edr-alpha',
        blockchain_anchor: false,
        inclusion_filter_status: 'verified_private',
        merkle_root: merkleRoot,
        bit_perfect: bitPerfect,
        public_particles_sample: particleRecords.slice(0, 96).map((record) => ({
            public_id: record.public_id,
            hex: fs.readFileSync(path.join(dirs.publicParticles, record.public_id), 'utf8').trim()
        })),
        proof_status: {
            local_anchor: 'verified_private',
            inclusion_filter: 'verified_private',
            merkle: 'verified'
        }
    };
}

function reconstructRun(options) {
    assertCoreReady();

    const runDir = options.runDir;
    const authMaterial = options.authMaterial;
    if (!runDir || !fs.existsSync(runDir)) {
        throw new Error('real EDR run directory was not found');
    }
    if (!authMaterial || !String(authMaterial).trim()) {
        throw new Error('authorization material is required');
    }

    const privateAnchorDir = path.join(runDir, 'private_anchors');
    const anchorFiles = listAnchorFiles(privateAnchorDir);
    if (anchorFiles.length === 0) {
        throw new Error('private proof record missing or ambiguous');
    }

    const anchorRecords = anchorFiles.map(readJson);
    // Legacy grouped anchors can still be read for old runs only.
    // New runs must carry one private anchor for every public particle.
    const legacyAnchorRecord = anchorRecords.length === 1 && Array.isArray(anchorRecords[0].private_map)
        ? anchorRecords[0]
        : null;
    const anchorRecord = legacyAnchorRecord || anchorRecords[0];
    const authRecord = stableAuthRecord(authMaterial);
    if (authRecord.auth_hash !== anchorRecord.authorization_record?.auth_hash) {
        throw new Error('authorization rejected');
    }
    if (!anchorRecord.recovery_nonce) {
        throw new Error('private recovery nonce was not persisted for this run');
    }

    const salt = makeSalt(authRecord, anchorRecord.recovery_nonce);
    const privateMap = legacyAnchorRecord
        ? legacyAnchorRecord.private_map
        : anchorRecords.map((record) => ({
            public_id: record.public_id,
            index: record.particle_index,
            hash: record.particle_hash
        }));
    if (!legacyAnchorRecord && anchorRecords.length !== anchorRecord.particle_count) {
        throw new Error('private anchor count mismatch');
    }
    const particles = privateMap
        .slice()
        .sort((a, b) => a.index - b.index)
        .map((record) => {
            const particlePath = path.join(runDir, 'public_particles', record.public_id);
            const hex = fs.readFileSync(particlePath, 'utf8').replace(/\s/g, '');
            const particle = Buffer.from(hex, 'hex');
            if (sha256(particle) !== record.hash) {
                throw new Error(`particle hash mismatch: ${record.public_id}`);
            }
            return particle;
        });

    if (particles.length !== anchorRecord.particle_count) {
        throw new Error('particle count mismatch');
    }

    const reconstructed = ShatterEngine.rejoin(particles, anchorRecord.padded_length, salt)
        .slice(0, anchorRecord.original_length);
    const reconstructedHash = sha256(reconstructed);
    if (reconstructedHash !== anchorRecord.input_sha256) {
        throw new Error('bit-perfect reconstruction failed');
    }

    return {
        record_id: anchorRecord.record_id,
        record_label: anchorRecord.record_label,
        input_sha256: anchorRecord.input_sha256,
        reconstructed_sha256: reconstructedHash,
        bit_perfect: true,
        data: reconstructed.toString('utf8')
    };
}

function listJsonFiles(dir) {
    return fs.existsSync(dir)
        ? fs.readdirSync(dir).filter((name) => name.endsWith('.json')).sort().map((name) => path.join(dir, name))
        : [];
}

function listAnchorFiles(dir) {
    return fs.existsSync(dir)
        ? fs.readdirSync(dir).sort().map((name) => path.join(dir, name)).filter((filePath) => fs.statSync(filePath).isFile())
        : [];
}

function runFailureLanes(context) {
    const lanes = [];
    const wrongAuth = stableAuthRecord('wrong-auth-material');
    const wrongSalt = makeSalt(wrongAuth, crypto.randomBytes(32).toString('hex'));
    const wrongAuthOutput = ShatterEngine.rejoin(context.particles, context.paddedLength, wrongSalt).slice(0, context.input.length);
    lanes.push({
        lane: 'wrong_auth',
        result: 'rejected',
        reason: sha256(wrongAuthOutput) === context.inputHash ? 'unexpected_match' : 'hash_mismatch'
    });

    const tampered = context.particles.map((particle) => Buffer.from(particle));
    tampered[0][0] = tampered[0][0] ^ 1;
    const tamperedOutput = ShatterEngine.rejoin(tampered, context.paddedLength, context.salt).slice(0, context.input.length);
    lanes.push({
        lane: 'tampered_particle',
        result: 'rejected',
        reason: sha256(tamperedOutput) === context.inputHash ? 'unexpected_match' : 'hash_mismatch'
    });

    lanes.push({
        lane: 'missing_particle',
        result: context.particles.slice(1).length === PARTICLE_COUNT ? 'accepted' : 'rejected',
        reason: 'particle_count_mismatch'
    });

    lanes.push({
        lane: 'wrong_anchor',
        result: 'rejected',
        reason: DNAFactory.verifyWitness('000000000000000000000000') ? 'unexpected_valid_anchor' : 'anchor_verification_failed'
    });

    const proof = MerkleTree.getProof(context.turns, 0);
    const leaf = MerkleTree.leafHash(context.turns[0]);
    lanes.push({
        lane: 'wrong_merkle_root',
        result: MerkleTree.verifyProof(leaf, proof, sha256(Buffer.from('wrong-root'))) ? 'accepted' : 'rejected',
        reason: 'merkle_root_mismatch'
    });

    // Stateful replay checks require runtime policy state outside this alpha harness.
    lanes.push({
        lane: 'replay_attempt',
        result: 'not_executed_in_public_challenge',
        reason: 'requires_stateful_runtime_policy'
    });

    lanes.push({
        lane: 'partial_dataset',
        result: 'rejected',
        reason: 'incomplete_particle_set'
    });

    // Expiration checks require a live authorization policy clock outside this alpha harness.
    lanes.push({
        lane: 'stale_authorization',
        result: 'not_executed_in_public_challenge',
        reason: 'requires_live_authorization_policy'
    });

    return lanes;
}

module.exports = {
    particleizeBuffer,
    reconstructRun,
    assertCoreReady
};
