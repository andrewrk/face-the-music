// the main source file which depends on the rest of your source files.
exports.main = 'src/main';

exports.spritesheet = {
  defaults: {
    delay: 0.05,
    loop: false,
    // possible values: a Vec2d instance, or one of:
    // ["center", "topleft", "topright", "bottomleft", "bottomright",
    //  "top", "right", "bottom", "left"]
    anchor: "center"
  },
  animations: {
    mobCloud1: {
      frames: "mob/mob_cloud_1.png",
    },
    "cursor/bass": {
      anchor: {x: 6, y: 2},
    },
    "cursor/drum": {
      anchor: {x: 6, y: 2},
    },
    "cursor/flyingv": {
      anchor: {x: 6, y: 2},
    },
    "cursor/mike": {
      anchor: {x: 6, y: 2},
    },
    clingingGroupie: {
      frames: "groupie",
      loop: true,
      anchor: {x: 100, y:50},
    },
    rockerHeadBanging: {
      frames: "rocker/rocker_headbang",
      loop: true,
      anchor: {x: 25, y: 8},
      delay: 0.2,
    },
    rockerWaving: {
      frames: "rocker/rocker_waving",
      loop: true,
      anchor: {x: 25, y: 8},
      delay: 0.2,
    },
    rockerMoshing: {
      frames: "rocker/rocker_mosh",
      loop: true,
      anchor: {x: 25, y: 8},
      delay: 0.2,
    },
    eargasmKneel: {
      delay: 0.4,
      frames: 'eargasm/eargasm_kneel',
      anchor: {x: 27, y: 50},
      loop: false,
    },
    eargasmText1: {
      frames: 'eargasm/texta',
    },
    eargasmText2: {
      frames: 'eargasm/textb',
    },
    eargasmText3: {
      frames: 'eargasm/textc',
    },
    eargasmText4: {
      frames: 'eargasm/textd',
    },
    roadieDeath: {
      frames: [
        "roadie/roadie_death_1.png",
        "roadie/roadie_death_2.png",
        "roadie/roadie_death_3.png",
        "roadie/roadie_death_4.png",
        "roadie/roadie_death_5.png",
        "roadie/roadie_death_6.png",
        "roadie/roadie_death_7.png",
        "roadie/roadie_death_8.png",
      ],
      anchor: {x: 25, y: 22},
      loop: false,
    },
    roadieRun: {
      frames: [
        "roadie/roadie_run_1.png",
        "roadie/roadie_run_2.png",
        "roadie/roadie_run_3.png",
        "roadie/roadie_run_4.png",
        "roadie/roadie_run_5.png",
        "roadie/roadie_run_6.png",
        "roadie/roadie_run_7.png",
        "roadie/roadie_run_8.png",
      ],
      anchor: {x: 25, y: 22},
      loop: true,
    },
    roadieIdle: {
      frames: [
        "roadie/roadie_idle_1.png",
        "roadie/roadie_idle_2.png",
        "roadie/roadie_idle_3.png",
      ],
      anchor: {x: 25, y: 22},
      loop: true,
      delay: 0.2,
    },
    roadieSlide: {
      frames: [
        "roadie/roadie_slide_1.png",
        "roadie/roadie_slide_2.png",
        "roadie/roadie_slide_3.png",
        "roadie/roadie_slide_4.png",
        "roadie/roadie_idle_1.png",
      ],
      anchor: {x: 25, y: 22},
      loop: false,
    },
    roadieJumpUp: {
      frames: [
        "roadie/roadie_jump_1.png",
        "roadie/roadie_jump_2.png",
        "roadie/roadie_jump_3.png",
      ],
      anchor: {x: 25, y: 22},
      loop: false,
    },
    roadieJumpDown: {
      frames: [
        "roadie/roadie_jump_4.png",
        "roadie/roadie_jump_5.png",
        "roadie/roadie_jump_6.png",
      ],
      anchor: {x: 25, y: 22},
      loop: false,
    },
    roadieHit: {
      frames: [
        "roadie/roadie_explosion_hit_1.png",
        "roadie/roadie_explosion_hit_2.png",
      ],
      anchor: {x: 25, y: 22},
      loop: false,
      delay: 0.2,
    },
    enemyRun: {
      frames: [
        "enemy/enemy_run_1.png",
        "enemy/enemy_run_2.png",
        "enemy/enemy_run_3.png",
        "enemy/enemy_run_4.png",
        "enemy/enemy_run_5.png",
        "enemy/enemy_run_6.png",
        "enemy/enemy_run_7.png",
        "enemy/enemy_run_8.png",
      ],
      anchor: {x: 25, y: 22},
      loop: true,
    },
    enemyIdle: {
      frames: [
        "enemy/enemy_idle_1.png",
      ],
      anchor: {x: 25, y: 22},
      loop: true,
      delay: 0.2,
    },
    enemySlide: {
      frames: [
        "enemy/enemy_slide_1.png",
        "enemy/enemy_slide_2.png",
        "enemy/enemy_slide_3.png",
        "enemy/enemy_slide_4.png",
        "enemy/enemy_idle_1.png",
      ],
      anchor: {x: 25, y: 22},
      loop: false,
    },
    enemyJumpUp: {
      frames: [
        "enemy/enemy_jump_1.png",
        "enemy/enemy_jump_2.png",
        "enemy/enemy_jump_3.png",
      ],
      anchor: {x: 25, y: 22},
      loop: false,
    },
    enemyJumpDown: {
      frames: [
        "enemy/enemy_jump_4.png",
        "enemy/enemy_jump_5.png",
        "enemy/enemy_jump_6.png",
      ],
      anchor: {x: 25, y: 22},
      loop: false,
    },
    attack_mic: {},
    attack_drum: {},
    attack_bass: {},
    skullAttack: {
      frames: [
        "skull/flaming_skull_1.png",
        "skull/flaming_skull_2.png",
      ],
      anchor: {x:12,y:32},
      loop: true,
      delay: 0.2,
    },
    weedSmoke: {
      frames: "smoke_weed_alt.png",
      anchor: 'topleft',
    },
    guitarBeam: {
      frames: [
        "laser_beam_1.png",
        "laser_beam_2.png",
      ],
      anchor: {x:0,y:24},
      loop: true,
      //delay: 0.1,
    },
    skullFloat: {
      frames: [
        "skull/flaming_skull_static_1.png",
        "skull/flaming_skull_static_2.png",
        "skull/flaming_skull_static_3.png",
      ],
      loop: true,
      delay: 0.15,
    },
  }
};
