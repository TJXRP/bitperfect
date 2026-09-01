# BitPerfect

Public adversarial challenges for Entropography.

This repository is for frozen challenge artifacts that outside reviewers can download, inspect, and attack. Each challenge version has its own folder, hash file, attacker material, and reporting instructions.

## Current Challenge

### Entropography v4

Path: `challenges/entropography-v4/`

Artifact: `entropography-v4-attacker-only.zip`

SHA-256:

```text
C780708F8AF8A157611CF6D2DAF4FE2A1E2D404FC3F1C61A91E1D977C0C46A1C
```

The challenge package contains the public Entropograph, public metadata, a reconstruction specification, sanitized source for review, and the attack prompt. It does not contain the original record, private anchors, authorization material, recovery nonce, salt, particle mapping, padding metadata, or private verification material.

## Victory Condition

Recover any previously undisclosed byte, field, or value from the original record, or provide a reproducible distinguisher showing the public Entropographic Particles are distinguishable from uniform random data with advantage better than guessing.

## Reporting

Reports should include:

- the exact artifact hash attacked
- tools and methods used
- whether any protected data was recovered
- the exact reproducible method for any successful recovery or distinguisher

## Status

The first public package is staged under `challenges/entropography-v4/`.
