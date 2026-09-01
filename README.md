# BitPerfect

Public adversarial challenges for Entropography.

This repository is for frozen challenge artifacts that outside reviewers can download, inspect, and attack. Each challenge version has its own folder, hash file, attacker material, and reporting instructions.

## Current Challenge

### Entropography v4

Path: `challenges/entropography-v4/`

Artifact: `entropography-v4-attacker-only.zip`

SHA-256:

```text
C208A680A775D4DCFFA27C5BF2EE679CC689C008A5D61DC0CE486C5CF8289F5C
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
