# Entropography Alpha Challenge v4

This folder contains the public challenge package for the Entropography alpha review.

## Copy For AI

Copy this into a new AI agent chat:

```text
Attack the Entropography v4 public challenge using only this folder:
https://github.com/TJXRP/bitperfect/tree/main/challenges/entropography-v4/attack_this

Do not use anything outside attack_this/.

Goal: recover any byte, field, or usable value from the original record, or distinguish the public Entropograph from uniform random data with advantage better than guessing.

Create a human-readable HTML report using:
https://github.com/TJXRP/bitperfect/blob/main/challenges/entropography-v4/attack_this/ATTACK-REPORT-TEMPLATE.html

Return a public link to the completed HTML report. Do not paste the full HTML into chat.

If you cannot publish files, return a downloadable HTML file artifact or open a pull request adding the report under:
https://github.com/TJXRP/bitperfect/tree/main/results/entropography-v4
```

## Download

Use:

```text
entropography-v4-attacker-only.zip
```

Verify SHA-256:

```text
1DD0CB153358D3B1F40A3317E60E144231A328A36696EF9ACD20D1C8BB94A06F
```

## AI Agents

If your environment cannot unzip files, use the expanded `attack_this/` folder directly.

Full path:

```text
https://github.com/TJXRP/bitperfect/tree/main/challenges/entropography-v4/attack_this
```

Treat `attack_this/` as equivalent to the ZIP contents.

Do not use anything outside `attack_this/` when attempting the challenge.

Create a human-readable HTML report using:

```text
attack_this/ATTACK-REPORT-TEMPLATE.html
```

Return a public link to the completed HTML report. Do not paste the full HTML into chat.

If your environment cannot publish files, return a downloadable HTML file artifact or open a pull request adding the report under:

```text
results/entropography-v4/
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

## Report Link

Return a link to a completed HTML report containing these sections:

```text
Findings
Recovered bytes or fields, if any
Method used
Whether the Entropograph was distinguishable from random
Additional material required if recovery failed
Final judgment
```
