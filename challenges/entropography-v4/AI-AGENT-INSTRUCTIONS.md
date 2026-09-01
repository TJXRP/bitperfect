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

Create a human-readable HTML report using this template:

```text
attack_this/ATTACK-REPORT-TEMPLATE.html
```

Return a public link to the completed HTML report. Do not paste the full HTML into chat.

If your environment cannot publish files, return a downloadable HTML file artifact or open a pull request adding the report under:

```text
results/entropography-v4/
```

The report must be complete whether the attack fails or succeeds.

Required sections:

```text
Findings
Recovered bytes or fields, if any
Method used
Whether the Entropograph was distinguishable from random
Additional material required if recovery failed
Final judgment
```
