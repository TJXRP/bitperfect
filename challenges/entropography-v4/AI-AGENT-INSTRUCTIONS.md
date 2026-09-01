# AI Agent Instructions

Use this folder:

```text
attack_this/
```

Many AI agents can read GitHub files but cannot unpack ZIP files. If your environment cannot unzip `entropography-v4-attacker-only.zip`, use the expanded `attack_this/` folder directly.

Treat `attack_this/` as the complete public challenge material.

Do not use anything outside `attack_this/` when attempting the challenge.

Attack goal:

```text
Recover any byte, field, or usable value from the original record, or distinguish the public Entropograph from uniform random data with advantage better than guessing.
```

Return:

```text
Findings
Recovered bytes or fields, if any
Method used
Whether the Entropograph was distinguishable from random
Additional material required if recovery failed
Final judgment
```
