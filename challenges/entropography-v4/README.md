# Entropography Alpha Challenge v4

This folder contains the public attacker package for the Entropography alpha review.

## Download

Use:

```text
entropography-v4-attacker-only.zip
```

Verify SHA-256:

```text
EF4CBC72E859242256E96EFC1D63689878302020F79D0D87990EA9B9B451A3D9
```

## Rules

Use only the material inside `attacker_state`.

Attack goal:

```text
Recover any byte, field, or usable value from the original record, or distinguish the public Entropograph from uniform random data with advantage better than guessing.
```

The package includes the public Entropograph, public metadata, the review specification, an attack prompt, and sanitized source files.

Entropographic Particle files are hex text encodings. Each particle decodes to 128 bytes.

The package does not include the original record, private anchors, authorization material, recovery nonce, secret salt, particle order mapping, padding metadata, or private verification material.

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
