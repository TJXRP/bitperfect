# Entropography Alpha Challenge v4

This folder contains the public challenge package for the Entropography alpha review.

## Download

Use:

```text
entropography-v4-attacker-only.zip
```

Verify SHA-256:

```text
1F250759E308A50D871B30EC562C6ED6864C9260223F9D79EA5DFE02679CC270
```

## Rules

Use only the material inside `attack_this`.

Attack goal:

```text
Recover any byte, field, or usable value from the original record, or distinguish the public Entropograph from uniform random data with advantage better than guessing.
```

The package includes the public Entropograph, public metadata, the review specification, an attack prompt, and sanitized source files.

Entropographic Particle files are hex text encodings. Each particle decodes to 128 bytes.

The package does not include the original record, private anchors, authorization material, recovery nonce, secret salt, particle order mapping, padding metadata, or private verification material.

AI agents that cannot unzip files should use the expanded `attack_this/` folder directly. Treat `attack_this/` as equivalent to the ZIP contents.

## Report Format

Return:

```text
Findings
Recovered bytes or fields, if any
Method used
Whether the Entropograph was distinguishable from random
Additional material required if recovery failed
Final judgment
```
