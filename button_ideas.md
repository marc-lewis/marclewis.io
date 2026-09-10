# Button ideas

The wall gets secret buttons. Most buttons start the minefield as they do now; a handful of specials are scattered through the wall, and each one fires its own effect when clicked. A tiny registry in the JS (`button id -> effect`) keeps them plug-and-play, and a `special` flag keeps them out of mine placement and out of the island, so the game stays fair.

Effort tags: **S** = an evening or less, **M** = a focused day, **L** = a proper mini-project.

## The four you named

**1. Ripple wave, the middle button — S**
The wall already knows how to leap; a ripple is just the load wipe with the origin moved. On click, every button re-runs its pop (leap + extruded side) with a delay proportional to its distance from the clicked button. The infrastructure exists; this is mostly deleting code you already have. After the wave passes, the wall returns to rest.

**2. Rickroll — S now, M once audio exists**
Two flavours. (a) The button goes straight to the Never Gonna Give You Up video on YouTube - brutal, zero dependencies, extremely on-brand for a site whose only exit is elsewhere. (b) Later, once you've found your sounds: the wall dances, buttons bouncing in rhythm while it plays. Recommend (a) now and the upgrade later.

**3. Colour change — S**
Everything paints from a single `--ink` variable, so a theme flip is one line. Options: cycle through palettes (dark mode with a near-black page; blueprint blue; terminal green) or full inversion. Could be repeatable rather than one-shot, each click advancing to the next theme.

**4. Arkanoid — L**
The wall becomes the brick field: the visible buttons are bricks, a paddle follows the mouse along the bottom, click to launch, three balls, and hitting a brick plays the pop-out animation and removes it. Clearing the field or losing your last ball both end the only way anything ends on this site: LinkedIn. The physics is plain AABB (the button rectangles are already absolutely positioned), so collisions are cheap; the real cost is the game loop and the ball/paddle handling.

## Quick wins

**5. The honest button — S**
Exactly one button in the wall behaves like it's the old site again: press-in animation, then straight to LinkedIn. The joke: you found the only button that does what every button used to do.

**6. Earthquake — S**
The sheet shakes for a second, buttons rattle on random short delays, and a couple end up rotated a degree or two afterwards - cracked bricks. The wall settles slightly wrong, forever.

**7. Mirror flip — S**
The whole sheet flips horizontally with a smooth transition: the tilt leans the other way and every "linkedin" reads backwards. Click it again to flip back.

**8. Zoom exit — S**
The camera zooms into the clicked button until it fills the viewport (transform-origin on the button, scale the field up over a second), then LinkedIn. The most cinematic possible "get outta here".

**9. The 2015 overlay — S/M**
Clicking a button fades in the original site over the wall: the plain white page, the name, the one centred linkedin button, exactly as it lived. Clicking that button goes to LinkedIn; clicking anywhere else dissolves the overlay back into the wall.

## Medium

**10. Gravity drop — M**
Every button falls to the bottom of the viewport and lands in a heap (transform-only, random delays, a small bounce on landing). A second click anywhere re-runs the load wave to rebuild the wall. Spectacular payoff for the cost.

**11. Flee the cursor — M**
The wall gets nervous: buttons within ~100px of the pointer slide away and spring back when you leave. Cheap because the buttons are layout islands; it's just pointermove maths and transforms.

**12. Whack-a-mole — M**
Ten seconds: random buttons leap and you must click them mid-air to bonk them back down. The one idea here that needs new chrome - a small floating score counter - since the page currently shows nothing.

**13. Cheat button — S (reuses the game's own logic)**
Instantly solves the minefield: flags every mine and opens the rest in a fast ripple using the existing reveal code, then the win state runs as normal - the board flips, and you're off to LinkedIn. The board was never the point.

**14. Breathing wall — S/M**
A toggle: the whole wall undulates gently forever, each button bobbing on a distance-based sine phase (the ripple maths, looped, low amplitude). Ambient mode.

## Big

**15. Snake — L**
The island becomes the board: snake and food light up by inverting buttons, arrow keys or swipe to steer, and the brick bond makes steering gloriously weird. Death by wall or by self ends, of course, at LinkedIn.

**16. Pachinko - L**
The distance between all the buttons increases and balls fall from the top right of the screen and fall down between the buttons. It's physics now. Maybe you can rotate the board somehow, by pressing arrow keys or clicking and dragging, or maybe some buttons appear.

## Design questions to settle first

1. **Do specials start the game?** Recommend no: a special click fires its effect and leaves the field hidden; the minefield only initiates from a plain button. Otherwise a ripple click would also fade the ring.
2. **Repeatable or one-shot?** Recommend: state effects (colour, mirror, breathing) repeat or toggle; journeys (rickroll, arkanoid, zoom, honest button) are one-shot per page load.
3. **Fixed positions or scattered?** The middle button is a deliberate gift - guessable. The rest could be seeded randomly each load, or fixed so people can tell each other where to look.
4. **Should specials have a tell?** No tell is funnier (pure stumble), but a subtle one on hover - a slightly delayed depress, say - rewards the curious. Your call.
5. **Mobile:** effects needing pointer precision (arkanoid paddle, flee-the-cursor) need touch fallbacks or should fire only on desktop.

## If I were picking a first batch

Ripple (1), honest button (5), colour cycle (3), earthquake (6), cheat (13). Two showpieces, two jokes, one gift - all small effort, no new page chrome, and none of them break the minefield. Then gravity drop (10) as the next spectacle, and save Arkanoid for when you want the big one.

---

The full brainstorm, 400 ideas more, numbered on from 16, lives in `button_ideas_big_list.md`.
