# Entropography Alpha Challenge v4

This folder contains the public challenge package for the Entropography alpha review.

## Download

Use:

```text
entropography-v4-attacker-only.zip
```

Verify SHA-256:

```text
C780708F8AF8A157611CF6D2DAF4FE2A1E2D404FC3F1C61A91E1D977C0C46A1C
```

## AI Agents

If your environment cannot unzip files, use the expanded `attack_this/` folder directly.

Full path:

```text
https://github.com/TJXRP/bitperfect/tree/main/challenges/entropography-v4/attack_this
```

Treat `attack_this/` as equivalent to the ZIP contents.

Do not use anything outside `attack_this/` when attempting the challenge.

Return a human-readable HTML report using:

```text
attack_this/ATTACK-REPORT-TEMPLATE.html
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
