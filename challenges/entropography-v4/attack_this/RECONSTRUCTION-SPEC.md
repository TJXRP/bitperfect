# Sanitized EDR Alpha Reconstruction Specification

Source reviewed: `sanitize` branch
Base source commit reviewed: `118d45091b624a137f01d1894db25d89aa8c56b6`

This document describes the sanitized EDR alpha reconstruction path at the reviewed commit.

The Entropic Dispersal framing is under review and stronger security language (including the word "post-quantum") is NOT yet finalized in this document.

## Reconstruction Path

### Constants

```text
PARTICLE_COUNT = 1024
FIXED_PUBLIC_PARTICLE_BYTES = 128
MAX_RECORD_BYTES = 1024 * 128 = 131072 bytes
```

The alpha path accepts records up to `131072` bytes. Inputs larger than that are rejected.

```text
if input.length > 131072:
    reject with "input exceeds the 128 KiB per-object ceiling"
```

Accepted records are padded to exactly `131072` bytes. The result is always:

```text
1024 particles
128 bytes per particle
131072 bytes padded length
```

### Shatter

Input:

```text
record bytes
auth_material
```

Authorization hash:

```text
auth_hash = SHA256(UTF8(auth_material))
```

Nonce generation:

```text
nonce = randomBytes(32).toHex()
```

Salt derivation:

```text
salt = SHA256(UTF8(auth_hash + ":" + nonce))
```

Padding:

```text
if record.length < 131072:
    padding = randomBytes(131072 - record.length)
    padded_record = record || padding
else:
    padded_record = record
```

Particle creation:

```text
shard_size = ceil(padded_record.length / 1024)
```

Because `padded_record.length` is fixed at `131072`, `shard_size` resolves to `128`.

For each `particleIndex` from `0` to `1023`:

```text
shard = padded_record[particleIndex * 128 : (particleIndex + 1) * 128]

mask_input = JSON({
    domain: "EDR-MASK-V1",
    salt: String(salt),
    particleIndex
})

mask = SHAKE256(mask_input, outputLength = 128)

particle = shard XOR mask
```

The result is `1024` public particles, each `128` bytes.

The alpha path also creates private anchor records. Each public particle has one paired private anchor with the same opaque public identifier.

### Rejoin

Input:

```text
public particles
private anchor files
auth_material
```

The rejoin path recomputes:

```text
auth_hash = SHA256(UTF8(auth_material))
```

It compares this value to the private anchor's stored `authorization_record.auth_hash`.

```text
if auth_hash does not match:
    reject with "authorization rejected"
```

The private anchor must contain the recovery nonce.

```text
if recovery_nonce is missing:
    reject
```

Salt is recomputed:

```text
salt = SHA256(UTF8(auth_hash + ":" + recovery_nonce))
```

The private anchors provide:

```text
public_id
particle_index
particle_hash
particle_count
original_length
padded_length
input_sha256
```

For each particle:

```text
read public particle by public_id
verify SHA256(public_particle) == particle_hash
sort particles by particle_index
```

Then the engine rejoins:

```text
for each particleIndex from 0 to 1023:
    mask_input = JSON({
        domain: "EDR-MASK-V1",
        salt: String(salt),
        particleIndex
    })

    mask = SHAKE256(mask_input, outputLength = particle.length)

    shard = particle XOR mask

padded_record = concat(shards)
record = padded_record.slice(0, original_length)
```

Final integrity check:

```text
if SHA256(record) != input_sha256:
    reject with "bit-perfect reconstruction failed"
```

If the hash matches, the recovered record is returned.

## Must Stay Secret

The following values must not be disclosed as attacker-visible material:

```text
auth_material
authorization_record.auth_hash
recovery_nonce
salt
private anchor files
particle_index mapping
particle_hash values used for reconstruction
original_length
padded_length
input_sha256 / source_sha256 for low-entropy or guessable records
padding bytes
padding_bytes
padding_sha256
private inclusion filter
private inclusion filter positions
DNA_LOOKUP HMAC secret
```

## Safe To Be Public

Assuming all secret values above remain withheld, the following can be public:

```text
the algorithm description
the sanitized source code
public particle bytes
opaque public particle IDs
particle_count = 1024
particle_byte_size = 128
padded public particle field size = 131072 bytes
maximum accepted object size = 131072 bytes
SHAKE256 domain string = "EDR-MASK-V1"
primitive names
Merkle root commitment
public challenge labels
failure-lane labels and outcomes
salted prelaunch commitment hash without the salt
```

`particle_byte_size` is now a fixed public constant. It does not vary by record, so it does not leak record length.

No public field or pair of public fields in the safe list derives any secret field. The sizing pair now derives only public constants:

```text
1024 * 128 = 131072
```

That value is fixed for all accepted records.

## Public-Key Cryptography Statement

No public-key cryptography exists on the reviewed sanitized reconstruction path.

The reviewed reconstruction path does not use:

```text
RSA
ECC
Diffie-Hellman
KEM
public-key signatures
wallet signatures
MetaMask
Xaman
Xumm
xrpl
ethers
```

The primitives actually used on this path are:

```text
SHA-256
SHAKE256
HMAC-SHA256
randomBytes
XOR
Merkle SHA-256
```

HMAC-SHA256 is used for anchor witness integrity through `DNA_LOOKUP`. It is not public-key cryptography.

## Threat Model

The attacker is assumed to have:

```text
all public particles
all opaque public particle IDs
the full algorithm
the sanitized source code
all public metadata
Merkle commitment material
failure-lane public outcomes
unlimited offline analysis time
future computing capability
```

The attacker is assumed not to have:

```text
auth_material
authorization_record.auth_hash
recovery_nonce
salt
private anchor files
particle order mapping
original_length
input_sha256 / source_sha256
padding metadata
private inclusion filter material
DNA_LOOKUP
```

Precise claim:

Given only the public particles, public source, public algorithm, and public metadata, an attacker cannot recover the original record, cannot recover any portion of it, and cannot distinguish the public particles from uniform random data with advantage better than guessing.

## Source Files On The Reconstruction Path

```text
D:\aifs\_codex_worktrees\sanitize\EDR\src\alpha-engine.js
D:\aifs\_codex_worktrees\sanitize\EDR\src\private-inclusion-filter.js
D:\aifs\_codex_worktrees\sanitize\aifs-api\src\core\ShatterEngine.js
D:\aifs\_codex_worktrees\sanitize\aifs-api\src\core\DNAFactory.js
D:\aifs\_codex_worktrees\sanitize\aifs-api\src\core\MerkleTree.js
```
