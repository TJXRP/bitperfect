# BitPerfect

Public adversarial challenges for Entropography.

This repository is for frozen challenge artifacts that outside reviewers can download, inspect, and attack. Each challenge version has its own folder, hash file, attacker material, and reporting instructions.

## Current Challenge

### Entropography v4

Path: `challenges/entropography-v4/`

Artifact: `entropography-v4-attacker-only.zip`

SHA-256:

```text
EF4CBC72E859242256E96EFC1D63689878302020F79D0D87990EA9B9B451A3D9
```

The attacker package contains the public Entropograph, public metadata, a reconstruction specification, sanitized source for review, and the attack prompt. It does not contain the original record, private anchors, authorization material, recovery nonce, salt, particle mapping, padding metadata, or private verification material.

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
