[x] make rally point when unit spawn fromo building
    → select a Barracks/Town Hall, right-click the ground: flag marker appears,
      trained units walk there automatically
[x] when double click grouped number, screen will go/focus to the group
    → press the group digit twice quickly (e.g. 1,1) to jump the camera to it
[x] upgrade graphic
    → three passes shipped: 24x24 units, 32x48 buildings, gear-tier recolors,
      chop animation, smoke, terrain decor
[x] make building more 3d and add animation
    → tall sprites with depth sorting + east cast shadow; animated: fluttering
      banners, breathing forge glow, blinking embers, spinning saw glint,
      flickering watch fire, twinkling gold veins
[x] improve sound affect, eg select npc, select unit, speak and shout their current status
    → chiptune voice barks: workers "hm?"/"okey-doke", soldiers "sir!"/"hup!",
      and a battle shout on attack orders; slight random pitch so they don't
      sound identical
[x] when smitch upgrade the weapon or amor, the existing unit or next production unit will name upgrade name. eg.noob spearman become trained spearman then legendary spearman, same as other unit type has level upgrade.
    → rankedUnitName() prefixes Trained/Veteran/Elite/Legendary from combined
      attack+armor level (0-4), shown in the HUD name for every unit kind
[x] refine gold mine structure, need show gold
    → selection panel shows "Gold remaining: N,NNN"; sprite gets a visible
      pile of ore spilling out of the dark entrance
[x] when laborer name to villager. when villager build the building, he need to stand at the building to build,cannot do lumbering or gold mine at the same time.
    → renamed to Villager in UI (internal id unchanged); buildings no longer
      self-construct — placing one sends selected workers into a new 'build'
      state that walks them to the site and hammers, progress only advances
      while a builder is adjacent, and the AI now assigns/retries builders
      for its own build-order buildings too
[x] make the selected unit able to move to desired place by clicking the mini map
    → right-click the minimap issues the same move/attack/harvest context
      order as right-clicking the main map (pixel→tile conversion via the
      canvas's bounding rect); left-click still recenters the camera unless
      an M/A order is armed, in which case left-click issues that order instead
[x] redesign the menu bar, side panel menu, need images to make it infomative, attractive menu and side bar
    → new hud/icons.ts rasterizes the game's own procedural sprites into
      icon/portrait <img> dataURLs (units, buildings, plus hand-drawn gold/
      lumber/food glyphs); resource bar, selection panel, and command card
      all swapped emoji for real art, sidebar gained framed section headers
      and grew to 220px
[x] village able to use resources to repair damage building → landed: right-click a damaged friendly building with villagers selected to repair it (2 hp/tick, hammering like construction); full repair costs 50% of the building's build cost, drained gradually, and pauses if you run out of gold/lumber. Coded by Gemini, verified in-browser.
[x] use shift to add unit in to group → landed: Shift+click/drag adds units to the current selection (shift-click a selected unit to drop it); Shift+1-9 appends the selection to that control group. Coded by Gemini 3.1 Pro, verified via real mouse events.
[x] villagers has weak attack ability → landed: villagers hit in melee while idle/walking now fight back with their 3-damage attack; busy villagers (mining/chopping/building/repairing) are never interrupted; A attack-move works for villagers too.
[x] add extra public gold mine → landed: every random skirmish map has a third contested gold mine at the map center on a guaranteed clearing — both you and the AI will mine it.
[x] tower can be upgrade → landed: "Tower Fortification" research at the Smithy (hotkey T): +4 tower damage and +1 range per level, 2 levels. AI doesn't get it. Old saves still load.
[] Low priority(wait my instruction): Orc campaign — 5 more missions playing as the Gharok Horde
[x] Touch/mobile controls — the game is desktop-mouse-only right now → landed as Phase 4b refinement (tablet-first): tap = select, drag = pan, 350ms long-press = context order, two-finger pan, ⛶ box-select toggle button (shows on touch devices only), minimap tap/hold, iOS pinch/overscroll suppression, bigger buttons on coarse pointers. Desktop mouse/keyboard unchanged. Designed w/ Gemini review, implemented by Sonnet agent, verified via Playwright touch emulation.
[] Low priority(wait my instruction): KV leaderboards — fastest mission-clear times, using the Cloudflare KV setup your site already has for visit counters