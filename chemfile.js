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
    platform: {
      anchor: 'topleft',
    },
    crosshair: {},
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
        "roadie/roadie_run_7.png",
        "roadie/roadie_run_6.png",
        "roadie/roadie_run_5.png",
        "roadie/roadie_run_4.png",
        "roadie/roadie_run_3.png",
        "roadie/roadie_run_2.png",
      ],
      anchor: {x: 25, y: 22},
      loop: true,
    },
    roadieIdle: {
      frames: "roadie/roadie_idle_1.png",
      anchor: {x: 25, y: 22},
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
    skullAttack: {
      frames: [
        "skull/flaming_skull_1.png",
        "skull/flaming_skull_2.png",        
      ],
      loop: true,
      delay: 0.2,
    }
  }
};
