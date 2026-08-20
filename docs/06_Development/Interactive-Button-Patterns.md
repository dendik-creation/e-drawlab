---
title: Interactive Button Patterns
---

# Interactive Button Patterns

How this codebase makes a Phaser button reliably tappable on both mouse and touch, and the bug class it exists to prevent. Read this before adding any new `setInteractive()` button with a hover/press tween — the failure mode here is silent (no error, no crash; the tap is simply swallowed) and only reproduces on a real touchscreen, so it is easy to ship and hard to catch in review.

## Prerequisite: input can reach the canvas at all

Two pieces of global setup make touch reach Phaser in the first place — without them, no per-button fix below matters:

- `#phaser-container { touch-action: none }` in `src/App.css`. Without it, Android Chromium runs every touch through scroll-vs-tap gesture arbitration before committing it as a pointer event; any finger jitter during the tap (near-universal on a real touchscreen) loses the coin flip and the tap is reclassified as a scroll, dropped with no JS error.
- `<meta name="viewport" content="... user-scalable=no">` in `index.html`, killing the legacy double-tap-zoom delay.

These are already in place project-wide. They only need revisiting if a *new* DOM element is layered over the canvas.

## The bug class: a touch tap can kill its own press tween

Every button here plays a short (~90ms) scale-down tween on `pointerdown`, and calls the button's actual action (`onPress()`) from that tween's `onComplete` — not directly in the `pointerdown` handler. That's the trap: **anything that reaches `tweens.killTweensOf(button)` while that tween is still in flight discards the `onComplete` before it runs, and the tap silently does nothing** — no error, the handler visibly "fired" if you log it, but the action never executes.

On desktop this never surfaces, because a mouse keeps hovering for the whole click — `pointerout` only arrives well after the press tween (and `onPress()`) already finished. Touch has no real hover: a tap can fire `pointerover`/`pointerout` in either order around `pointerdown`, well inside that same 90ms window. If the button's own `pointerover`/`pointerout` handlers call the same `scaleTo()`/`killTweensOf()` helper the press tween uses, one of them wins the race often enough to make the button feel broken on every real device while working every time in desktop testing.

This was diagnosed for real in `src/game/scenes/Home.ts`'s menu buttons: `console.warn`-based logging (see below) showed `pointerdown` firing on every tap, but the press tween's `onComplete` never running — proof the tween was being killed mid-flight, not that the tap wasn't registering.

## The fix: guard every path that can reach `killTweensOf`

Add a `pressed` flag, and check it inside the *shared* `scaleTo`/`setButtonScale` helper itself — not just at the call site that seems likely to race. Guarding only `pointerout` and missing `pointerover` (or vice versa) still leaves the other one able to kill the tween:

```ts
let pressed = false

const scaleTo = (multiplier: number, duration: number, ease: string) => {
  if (locked || pressed) return
  tweens.killTweensOf(button)
  tweens.add({ targets: button, scaleX: base * multiplier, scaleY: base * multiplier, duration, ease })
}

button.on('pointerover', () => scaleTo(HOVER_SCALE, HOVER_DURATION, 'Sine.easeOut'))
button.on('pointerout', () => scaleTo(1, HOVER_DURATION, 'Sine.easeOut'))
button.on('pointerdown', () => {
  if (locked || pressed) return
  pressed = true
  tweens.killTweensOf(button)
  tweens.add({
    targets: button,
    scaleX: base * PRESS_SCALE,
    scaleY: base * PRESS_SCALE,
    duration: PRESS_DOWN_DURATION,
    ease: 'Quad.easeOut',
    onComplete: () => {
      pressed = false
      onPress() // the actual action — only safe to call once the tween is guaranteed to have completed
      scaleTo(HOVER_SCALE, PRESS_UP_DURATION, 'Back.easeOut')
    },
  })
})
```

Live in this codebase: `src/game/scenes/Home.ts` (`attachButtonBehaviour`) and `src/game/desainSkema/uiKit.ts` (`attachButtonBehaviour`, shared by every Desain Skema step's nav icons, BGM toggle, palette-row select, the Lanjut button, and evaluasi's pill buttons). Both had this exact bug; both are now guarded this way.

### The alternative pattern: disable input synchronously instead

`src/game/scenes/Splash.ts`'s "Masuk Lab" button never hit this bug, via a different mechanism: it calls `button.disableInteractive()` **synchronously inside the `pointerdown` handler**, before starting the press tween. Once disabled, Phaser stops dispatching further pointer events to that object at all — so no later `pointerout` for the same touch gesture can ever reach it. This works when the button is a one-shot action that's about to leave the scene anyway (disabling it permanently is fine); it does *not* generalize to a button that needs to keep responding afterward (a persistent menu item, a toggle), which is why Home/uiKit use the `pressed`-flag pattern instead.

Pick one of the two per button, deliberately:
- **One-shot, scene-ending action** (a "start"/"enter" CTA that's about to navigate away for good) → `disableInteractive()` synchronously in `pointerdown`, before the tween.
- **Anything that stays on screen and interactive afterward** (menu items, toggles, nav icons, in-flow Lanjut/next buttons) → the `pressed` guard on every path through `scaleTo`.

## Diagnosing a "button doesn't respond on mobile" report

Don't guess. Reproduce with logging, because the failure is invisible otherwise:

1. Confirm the tap reaches Phaser at all: log in a scene-level `this.input.on('pointerdown', ...)`. If this never fires, the problem is upstream (CSS/touch-action, a DOM overlay stealing the event) — not this bug class.
2. Confirm the tap lands inside the target's hit area: `Phaser.Geom.Rectangle.Contains(button.getBounds(), pointer.worldX, pointer.worldY)`. Use `pointer.worldX/worldY` (post camera-zoom), not raw `pointer.x/y` — the hit test itself runs in world space.
3. Confirm the button's own `pointerdown` handler fires.
4. Confirm the press tween's `onComplete` actually runs (this is the one that exposed the bug — it silently didn't).

Use `console.warn`, not `console.log`, for on-device diagnosis: `index.html`'s `?debug=1` on-screen overlay only intercepts `warn`/`error`, and a phone usually has no attached devtools console. Strip the logging once the root cause is confirmed — it does not belong in a shipped build.

## Checklist for a new button

- [ ] Uses `src/game/desainSkema/uiKit.ts`'s `attachButtonBehaviour` if it's a Desain Skema step, or mirrors `Home.ts`'s pattern otherwise. Don't hand-roll a third copy.
- [ ] If it must be hand-rolled: every function that can call `tweens.killTweensOf(button)` is guarded by the same `pressed` flag the press tween sets — including `pointerover`, not just `pointerout`.
- [ ] The real action (`onPress()`) only ever runs from the press tween's `onComplete`, never assumed to run synchronously from `pointerdown`.
- [ ] If the button is a one-shot exit action instead, `disableInteractive()` is called synchronously in `pointerdown`, before the tween starts.
