---
title: Content Architecture
status: Proposed
---

# Content Architecture

`Status: Proposed` — this is a **proposed schema**, not an existing one. Decision: [[ADR-003-Content-As-Data]]. The content register (what exists, what is missing) is [[Content-Inventory]].

## The separation

| Application code | Educational content |
| --- | --- |
| Scene state machine, renderers, UI primitives | Circuits, slot maps, task parameters |
| Validation *algorithms* | Validation *parameters* (values, tolerances, ranges) |
| Scoring *engine* | Scoring *configuration* (points, thresholds) |
| Quiz *component* | Questions, options, keys, explanations |
| Audio *controller* | Which asset plays where, at what volume |
| Feedback *choreography* | Educational failure texts |

Reason: REQ-NF-012 and G-7 — a teacher changes a resistor value, a load current or a question without a developer. Also practical: as [[Question-Bank]] shows, several content items are still unwritten while the mechanics are fully specified. Code cannot wait for content, and content cannot wait for a release.

## Pack structure

```text
content/
  pack.json                 manifest: id, version, locale, checksums
  standards.json            paper sizes, line thickness, etiket fields, instruments
  circuits/
    c1-led-tunggal.json
    c2-led-seri.json
    c3-led-paralel.json
  tasks/
    stage2-*.json           copper weight, load, board, pads, tolerance
    stage3-*.json           PCB dims, standoff, component height, wall, clearance
  items/
    stage1.json  stage2.json  stage3.json  reflective.json
  feedback.json             reason code -> educational text
  scoring.json              points, meter penalties, star bands, badge threshold
  media.json                asset manifest with sizes and licences
```

## Schemas (proposed)

### Circuit — Stage 1

```json
{
  "id": "c2-led-seri",
  "title": "Rangkaian 2 LED Seri",
  "source": "Approved Revision — STAGE 1",
  "supply": { "type": "battery", "volts": 5 },
  "components": [
    { "ref": "R1", "type": "resistor", "ohms": 100 },
    { "ref": "LED1", "type": "led", "polarised": true },
    { "ref": "LED2", "type": "led", "polarised": true }
  ],
  "slots": [
    { "id": "s1", "accepts": "resistor", "ref": "R1", "x": 0.30, "y": 0.40 },
    { "id": "s2", "accepts": "led", "ref": "LED1", "orientation": "anode-left", "x": 0.50, "y": 0.40 },
    { "id": "s3", "accepts": "led", "ref": "LED2", "orientation": "anode-left", "x": 0.68, "y": 0.40 }
  ],
  "topology": "series",
  "explanation": "R1 menurunkan tegangan 2V sehingga tersisa tegangan kerja 3V…",
  "distractors": ["capacitor", "transistor"]
}
```

Slot coordinates are normalised (0–1) against the A4 sheet so they survive [[Responsive-Design]] scaling.

### Stage 2 task

```json
{
  "id": "stage2-halogen",
  "source": "Approved Revision — STAGE 2",
  "load": { "label": "Lampu halogen 12V/60W", "volts": 12, "watts": 60 },
  "currentA": 5,
  "copperWeight": "1oz",
  "factorMmPerA": 1.0,
  "targetWidthMm": 5.0,
  "toleranceMm": null,
  "signalFloorMm": 0.8,
  "cornerRule": "45",
  "pads": [{ "ref": "R1", "x": 0.2, "y": 0.3 }],
  "requiredNets": [["R1", "D1"]]
}
```

`toleranceMm: null` is deliberate — it is genuinely undecided ([[Stage-2-PCB-Trace-Width]]). The schema records the hole instead of inventing a number.

### Stage 3 task

```json
{
  "id": "stage3-sensor",
  "source": "Approved Revision — STAGE 3",
  "pcb": { "lengthMm": 60, "widthMm": 40, "thicknessMm": 1.6 },
  "tallestComponentMm": 18,
  "standoffMm": 5,
  "clearanceMm": 1.5,
  "topClearanceMm": 2.4,
  "wallThicknessMm": 2,
  "learnerControls": ["length", "width", "height"]
}
```

Required values are computed by the engine from these inputs using the formulas in [[Stage-3-Casing-Dimensions]] — never stored as answers, so a changed input cannot silently disagree with a stale expected value.

### Assessment item

Defined once in [[Feature-Quiz-Engine]] §Item contract.

### Feedback text

```json
{
  "LED_REVERSED": {
    "title": "Polaritas LED terbalik",
    "text": "Anoda LED harus menghadap ke sisi positif…",
    "severity": "error",
    "meterPenalty": 20
  }
}
```

## Validation and versioning

- Every pack is validated against JSON Schema at build time (CI gate) **and** at app startup — a class must never meet a malformed pack mid-lesson ([[UI-States]]).
- `pack.version` is semver. Progress records store the `contentVersion` they were created under ([[Data-Architecture]]); a major bump invalidates in-progress runs rather than scoring them against changed rules.
- Every content object carries a `source` field with the same vocabulary as [[Requirements-Matrix]]. Traceability survives into the running product.
- `audience: "teacher"` marks keys and explanations — [[Feature-Quiz-Engine]].

## Media

`media.json` lists every asset with path, bytes and licence. It drives three things: service-worker precaching ([[PWA-Architecture]]), the 25 MB build gate ([[ADR-007-Asset-Budget]]) and the on-screen attribution (REQ-F-026). The register itself is [[Media-Asset-Register]].

## Related

- [[Content-Inventory]] · [[Data-Architecture]] · [[Application-Architecture]] · [[ADR-003-Content-As-Data]]
