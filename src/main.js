var chem = require("chem");
var v = chem.vec2d;
var ani = chem.resources.animations;
var canvas = document.getElementById("game");
var engine = new chem.Engine(canvas);
var tmx = require('chem-tmx');

canvas.style.cursor = "none";

engine.buttonCaptureExceptions[chem.button.KeyF5] = true;

engine.showLoadProgressBar();
engine.start();
canvas.focus();

var GRAVITY = 0.2;
var MAX_CROWD_X_DIST = engine.size.x / 2 + 400;
var crowdBehaviors = ['idle', 'hug'];

function startGame(map) {
  var levelBatch = new chem.Batch();
  var staticBatch = new chem.Batch();
  var foregroundBatch = new chem.Batch();
  var playerEntity = {
    getWantedAnimation: getPlayerAnimation,
    pos: v(),
    vel: v(),
    size: v(15, 57),
    sprite: new chem.Sprite(ani.roadieIdle, {
      batch: foregroundBatch,//levelBatch,
      zOrder: 2,
    }),
    grounded: false,
    left: false,
    right: false,
    jump: false,
    dying: false,
    maxSpeed: 5,
    runAcc: 0.25,
    airAcc: 0.15,
    jumpVec: v(0, -6.8),
    directionFacing: 1,
    knockBackTime: 0,
    hugs: 0, // how many are dragging you down
  };
  var rockAniList = [
    ani.rockerHeadBanging,
    ani.rockerWaving,
    ani.rockerMoshing,
  ];
  var eargasmTextAniList = [
    ani.eargasmText1,
    ani.eargasmText2,
    ani.eargasmText3,
    ani.eargasmText4,
  ];
  var crosshairSprite = new chem.Sprite(ani['cursor/mike'], {
    batch: staticBatch,
  });
  var platforms = [];
  var fpsLabel = engine.createFpsLabel();
  var crowdLivesLabel = new chem.Label("crowd lives: 100", {
    pos: v(10, engine.size.y - 10),
    batch: staticBatch,
    font: "16px sans-serif",
    textAlign: "start",
    fillStyle: "#ffffff",
  });

  var friction = 1.15;
  var scroll = v(0, 0);

  //Enemies
  var spikeBalls = [];
  var weedClouds = [];
  var decorations = [];

  var projectiles = [];

  var bgImg = chem.resources.images['background.png'];
  var bgCrowd = chem.resources.images['background_crowd_loop.png'];
  var groundImg = chem.resources.images['ground_dry_dirt.png'];
  var maxScrollX = null;
  var groundY = engine.size.y - groundImg.height;

  var crowd = new chem.Sprite(ani.mobCloud1, {
    batch: levelBatch,
    pos: v(0*100, groundY),
    zOrder: 1,
  });
  var crowdLives = 100;
  var crowdRect = {pos: crowd.pos, size: v(50,900)};
  var crowdSpeed = 0.8;
  var crowdRotationSpeed = Math.PI / 400;
  var crowdDeathRadius = 320;
  var crowdPeople = [];
  var maxCrowdPeople = 5;
  var crowdPeopleCooldown = 5;
  var crowdPeopleCooldownAmt = 5;

  var weaponIndex = 0;
  var weapons = [
    {
      name: "microphone",
      animation: ani.attack_mic,
      reload: 0,
      reloadAmt: 0.5,
      projectileSpeed: 10,
      projectileLife: 1,
      projectileDamage: 1,
      tripleShot: false,
      cursor: 'cursor/mike',
    },
    {
      name: "bass",
      animation: ani.attack_bass,
      reload: 0,
      reloadAmt: 0.75,
      projectileSpeed: 6,
      projectileLife: 0.9,
      projectileDamage: 1.5,
      cursor: 'cursor/bass',
    },
    {
      name: "guitar",
      reload: 0,
      reloadAmt: 1.0,
      cursor: 'cursor/flyingv',
    },
    {
      name: "drums",
      animation: ani.attack_drum,
      reload: 0,
      reloadAmt: 0.4,
      projectileSpeed: 9,
      projectileLife: 1,
      projectileDamage: 1,
      cursor: 'cursor/drum',
    }
  ];

  var fxList = [];

  var beam = null;
  var beamLife = 0;
  var beamDamage = 0.1//0.05;

  updateCursor();

  engine.on('update', onUpdate);
  engine.on('draw', onDraw);
  engine.on('mousemove', onMouseMove);

  loadMap();

  function updateCursor() {
    var currentWeapon = weapons[weaponIndex];
    crosshairSprite.setAnimation(ani[currentWeapon.cursor]);
  }

  function playerRect() {
    return {
      pos: playerEntity.pos,
      size: playerEntity.size,
    };
  }

  function playerHeadRect() {
    return{
      pos: playerEntity.pos,
      size: v(15,15),
    }
  }

  function onUpdate(dt, dx) {
    //CONTROLS
    playerEntity.left = engine.buttonState(chem.button.KeyLeft) || engine.buttonState(chem.button.KeyA);
    playerEntity.right = engine.buttonState(chem.button.KeyRight) || engine.buttonState(chem.button.KeyD);
    playerEntity.jump = engine.buttonState(chem.button.KeyUp) || engine.buttonState(chem.button.KeyW) || engine.buttonState(chem.button.KeySpace);

    if (engine.buttonJustPressed(chem.button.KeyY)) {
      spawnCrowdPerson();
    }

    //Switch Weapons
    if (engine.buttonJustPressed(chem.button.KeyShift) || engine.buttonJustPressed(chem.button.MouseRight)) {
      weaponIndex = (weaponIndex + 1) % weapons.length;
      updateCursor();
    }

    //Update crowd position
    crowd.pos.x += crowdSpeed;
    crowd.rotation += crowdRotationSpeed;

    if (playerEntity.pos.x - crowd.pos.x > MAX_CROWD_X_DIST) {
      crowd.pos.x = playerEntity.pos.x - MAX_CROWD_X_DIST;
    }

    //crowd vs human
    if (playerEntity.pos.distance(crowd.pos) < crowdDeathRadius) {
      playerDie();
    }


    //WEED cloud collision
    var inAnyWeedCloud = false;
    for(var i=0;i<weedClouds.length;i++){
      var cloud = weedClouds[i];
      var cloudRect = {pos: cloud.pos.plus(v(100,30)), size: v(230,100)};

      if(rectCollision(playerHeadRect(),cloud)) {
        inAnyWeedCloud = true;
      }
    }
    playerEntity.maxSpeed = inAnyWeedCloud ? 2.5 : 5;

    weaponUpdate(dt);
    spikeBallUpdate(dt, dx);
    updateProjectiles(dt, dx);
    updateBeam(dt, dx);
    updateCrowdPeople(dt, dx);
    updateFx(dt, dx);

    doCollision(playerEntity, dt, dx);

    scroll = playerEntity.pos.minus(engine.size.scaled(0.5));
    if (scroll.x < 0) scroll.x = 0;
    scroll.y = 0;
    maxScrollX = map.width*map.tileWidth - engine.size.x / 2;
    if (scroll.x > maxScrollX) scroll.x = maxScrollX;

    doControlsAndPhysics(playerEntity, dt, dx);

    crowdLivesLabel.text = "Crowd lives: " + Math.floor(crowdLives);
  }

  function getCrowdPersonAnimation(crowdPerson) {
    if (crowdPerson.eargasm) {
      debugger
    } else if (crowdPerson.knockBackTime > 0) {
      debugger
    } else if (crowdPerson.hugging) {
      return ani.clingingGroupie;
    } else if (crowdPerson.grounded) {
      if (Math.abs(crowdPerson.vel.x) > 0) {
        if (crowdPerson.left && crowdPerson.vel.x <= 0 || crowdPerson.right && crowdPerson.vel.x >= 0) {
          return ani.enemyRun;
        } else {
          return ani.enemySlide;
        }
      } else if (crowdPerson.pos.distance(playerEntity.pos) < crowdPerson.rockDist) {
        return crowdPerson.rockAni;
      } else {
        return ani.enemyIdle;
      }
    } else if (playerEntity.vel.y < 0) {
      return ani.enemyJumpUp;
    } else {
      return ani.enemyJumpDown;
    }
  }

  function getPlayerAnimation() {
    if (playerEntity.dying) {
      return ani.roadieDeath;
    } else if (playerEntity.knockBackTime > 0) {
      return ani.roadieHit;
    } else if (playerEntity.grounded) {
      if (Math.abs(playerEntity.vel.x) > 0) {
        if (playerEntity.left&&playerEntity.vel.x<=0 || playerEntity.right&&playerEntity.vel.x>=0) {
          return ani.roadieRun;
        } else {
          return ani.roadieSlide;
        }
      } else {
        return ani.roadieIdle;
      }
    } else if (playerEntity.vel.y < 0) {
      return ani.roadieJumpUp;
    } else {
      return ani.roadieJumpDown;
    }
  }

  function updateProjectiles(dt, dx) {
    for (var i = 0; i < projectiles.length; i += 1) {
      var projectile = projectiles[i];
      projectile.sprite.pos.add(projectile.vel.scaled(dx));
      projectile.life -= dt;

      forEachHittableThing(checkHitRect, checkHitCircle);

      if (projectile.life <= 0) {
        projectiles[i].sprite.delete();
        projectiles.splice(i,1);
        i--;
      }
    }

    function checkHitRect(rect, isPlatform) {
      if (projectile.life <= 0) return false;
      var projectileRect = {
        pos: projectile.sprite.pos.minus(projectile.sprite.size.scaled(0.5)),
        size: projectile.sprite.size,
      };
      
      if(isPlatform && projectile.bulletType === "bass"){
        
      }else if (rectCollision(projectileRect, rect)) {
        projectile.life = 0;
        return projectile.damage;
      }
      return 0;
    }
    function checkHitCircle(circle) {
      if (projectile.life <= 0) return false;
      if (circle.pos.distance(projectile.sprite.pos) < circle.radius) {
        projectile.life = 0;
        return projectile.damage;
      }
      return 0;
    }
  }

  function updateBeam(dt, dx) {
    if (!beam) return;

    beamLife -= dt;
    if (beamLife <= 0) {
      beam.delete();
      beam = null;
      return;
    }

    var origPoint = playerEntity.pos.offset(6, 10);
    var aimVec = engine.mousePos.plus(scroll).minus(origPoint).normalize();

    beam.pos = origPoint;

    var beamLength = 1024;
    var endPoint = origPoint.plus(v.unit(beam.rotation).scaled(beamLength));
    forEachHittableThing(checkHitRect, checkHitCircle);

    var angleDiff = angleSubtract(aimVec.angle(),beam.rotation);
    var minDiff = Math.PI/90;

    if(angleDiff > minDiff){
      beam.rotation += 0.005 * dx;
    }else if(angleDiff < -minDiff){
      beam.rotation -= 0.005 * dx;
    }

    function checkHitRect(rect) {
      return lineIntersectsRect(origPoint, endPoint, rect) ? beamDamage : 0;
    }

    function checkHitCircle(circle) {
      return lineIntersectsCircle(origPoint, endPoint, circle) ? beamDamage : 0;
    }
  }

  function startHug(crowdPerson) {
    if (crowdPerson.hugging) return;
    crowdPerson.hugging = true;
    playerEntity.hugs += 1;
    crowdPerson.sprite.setAnimation(ani.clingingGroupie);
    crowdPerson.sprite.setFrameIndex(0);
    crowdPerson.sprite.setZOrder(3);
  }

  function updateFx(dt, dx) {
    for (var i = 0; i < fxList.length; i += 1) {
      var fx = fxList[i];

      fx.life -= dt;
      if (fx.life <= 0) {
        fx.sprite.delete();
        fxList.splice(i, 1);
        i--;
        continue;
      }

      if (fx.vel) {
        fx.sprite.pos.add(fx.vel.scaled(dx));
      }
    }
  }

  function updateCrowdPeople(dt, dx) {
    if (crowdPeopleCooldown <= 0) {
      if (crowdPeople.length < maxCrowdPeople) {
        crowdLives -= 1;
        spawnCrowdPerson();
        crowdPeopleCooldown = crowdPeopleCooldownAmt;
      }
    } else {
      crowdPeopleCooldown -= dt;
    }

    for (var i = 0; i < crowdPeople.length; i += 1) {
      var person = crowdPeople[i];
      var target = person.target;
      var closeDist = person.behavior === 'hug' ? 0 : person.rockDist;
      person.right = target.pos.x - person.pos.x > closeDist;
      person.left = target.pos.x - person.pos.x < -closeDist;
      if (person.jumper) {
        person.jump = person.pos.y - target.pos.y > 50;
      }

      if (person.behavior === 'hug' && person.pos.distance(playerEntity.pos) < 25 &&
          !playerEntity.dying)
      {
        startHug(person);
      }
      if (person.hugging) {
        if (playerEntity.dying) {
          person.hugging = false;
          person.sprite.setZOrder(0);
        } else {
          person.pos = playerEntity.pos.offset(10, 20);
          doSpritePos(person);
        }
      } else {
        checkCollidePersonWithPlayer(person);
        doCollision(person, dt, dx);
        doControlsAndPhysics(person, dt, dx);
      }

      if (crowd.pos.x > person.pos.x + 300) {
        crowdPeople.splice(i, 1);
        person.sprite.delete();
        i -= 1;
      }
    }
  }

  function checkCollidePersonWithPlayer(person) {
    if (!rectCollision(playerRect(), person)) return;

    var normal = playerEntity.pos.minus(person.pos).normalize();
    var rv = playerEntity.vel.minus(person.vel);
    var velAlongNormal = rv.dot(normal);
    if (velAlongNormal > 0) return;
    var e = 0.80;
    var j = -(1 + e) * velAlongNormal;
    var personMass = 1;
    var playerMass = 1;
    j /= 1 / personMass + 1 / playerMass;
    var impulse = normal.scale(j);
    person.vel.sub(impulse.scaled(1 / personMass));
    playerEntity.vel.add(impulse.scaled(1 / playerMass));
  }

  function spawnCrowdPerson() {
    var crowdPerson = {
      getWantedAnimation: getCrowdPersonAnimation,
      sprite: new chem.Sprite(ani.enemyIdle, {
        batch: levelBatch,
        zOrder: 0,
        pos: crowd.pos.clone(),
      }),
      maxSpeed: 2 + Math.random() * 4,
      pos: crowd.pos.clone(),
      vel: v(),
      left: false,
      right: false,
      jump: false,
      jumper: !!Math.floor(Math.random() * 2),
      grounded: false,
      target: null,
      size: playerEntity.size,
      dying: false,
      runAcc: 0.25,
      airAcc: 0.15,
      jumpVec: v(0, -1 * (3 + Math.random() * 4)),
      directionFacing: 1,
      knockBackTime: 0,
      health: 2,
      behavior: null,
      rockAni: randomRockAni(),
      rockDist: Math.random() * 200,
    };

    assignCrowdPersonTarget(crowdPerson);
    assignRandomBehavior(crowdPerson);

    crowdPeople.push(crowdPerson);
  }

  function randomRockAni() {
    return rockAniList[Math.floor(Math.random() * rockAniList.length)];
  }

  function assignRandomBehavior(crowdPerson) {
    var index = Math.floor(Math.random() * crowdBehaviors.length);
    crowdPerson.behavior = crowdBehaviors[index];
  }

  function assignCrowdPersonTarget(crowdPerson) {
    var rand = Math.random();
    if (rand < 0.3333) {
      crowdPerson.target = randomNpc();
    }
    if (!crowdPerson.target) {
      crowdPerson.target = playerEntity;
    }
  }

  function randomNpc() {
    var randIndex = Math.floor(Math.random() * crowdPeople.length);
    return crowdPeople[randIndex];
  }

  function doControlsAndPhysics(entity, dt, dx) {
    var hugCount = entity.hugs || 0;
    var hugDrag = Math.pow(0.5, hugCount);

    if (entity.left && !entity.dying) {
      if(entity.grounded)
        entity.vel.x -= entity.runAcc * hugDrag;
      else
        entity.vel.x -= entity.airAcc * hugDrag;
    }
    if (entity.right && !entity.dying) {
      if(entity.grounded)
        entity.vel.x += entity.runAcc * hugDrag;
      else
        entity.vel.x += entity.airAcc * hugDrag;
    }
    if (entity.jump && !entity.dying) {
      if(entity.grounded){
        entity.vel.add(entity.jumpVec.scaled(hugDrag));
        entity.grounded = false;
      }
    }

    //check MAX SPEED
    if(entity.vel.x < -entity.maxSpeed){
        entity.vel.x = -entity.maxSpeed;
    }
    if(entity.vel.x > entity.maxSpeed){
      entity.vel.x = entity.maxSpeed;
    }

    //Apply FRICTION
    if(entity.grounded && ((!entity.left && !entity.right) || entity.dying)){
      if(Math.abs(entity.vel.x) < 0.25){
        entity.vel.x = 0;
      } else{
        entity.vel.scale(1/friction);
      }
    }

    // gravity
    entity.vel.y += GRAVITY * dx;

    entity.knockBackTime -= dt;
    var wantedAni = entity.getWantedAnimation(entity);
    if (entity.sprite.animation !== wantedAni) {
      entity.sprite.setAnimation(wantedAni);
      entity.sprite.setFrameIndex(0);
    }

    if (entity.knockBackTime <= 0) {
      entity.directionFacing = sign(entity.vel.x) || entity.directionFacing;
    }

    doSpritePos(entity, dt, dx);
  }

  function doSpritePos(entity, dt, dx) {
    entity.sprite.scale.x = entity.directionFacing;
    entity.sprite.pos = entity.pos.clone();
    // compensate for offset
    if (entity.directionFacing < 0) {
      entity.sprite.pos.x += entity.size.x;
    }
  }

  function doCollision(entity, dt, dx) {
    var newPos = entity.pos.plus(entity.vel.scaled(dx));
    entity.grounded = false;
    var newPr = {pos: newPos, size: entity.size};
    for (var i = 0; i < platforms.length; i += 1) {
      var platform = platforms[i];
      if (rectCollision(newPr, platform)) {
        var outVec = resolveMinDist(newPr, platform);
        if (Math.abs(outVec.x) > Math.abs(outVec.y)) {
          var xDiff = resolveX(outVec.x, newPr, platform);
          newPos.x += xDiff;
          entity.vel.x = 0;
        } else {
          var yDiff = resolveY(outVec.y, newPr, platform);
          newPos.y += yDiff;
          entity.vel.y = 0;
        }
        newPr = {pos: newPos, size: entity.size};
        if (outVec.y < 0) {
          entity.grounded = true;
        }
      }
    }
    if (newPos.y + entity.size.y >= groundY) {
      newPos.y = groundY - entity.size.y;
      entity.vel.y = 0;
      entity.grounded = true;
    }
    entity.pos = newPos;
  }

  function testYouWin() {
    if (crowdLives <= 0 && crowdPeople.length === 0) {
      youWin();
    }
  }

  function youWin() {
    console.log("you win");
  }

  function forEachHittableThing(checkRect, checkCircle) {
    var i;
    var damage = checkCircle({pos: crowd.pos, radius: crowdDeathRadius});
    if (damage) {
      var before = crowdLives;
      crowdLives -= damage;
      var diff = Math.floor(before) - Math.floor(crowdLives);
      if (crowdLives <= 0) {
        crowdLives = 0;
        testYouWin();
        return;
      }
      for (i = 0; i < diff; i += 1) {
        spawnCrowdPerson();
      }
    }
    
    //skulls
    for (i = 0; i < spikeBalls.length; i += 1) {
      var ball = spikeBalls[i];

      var ballRect = {
        pos: ball.pos.plus(v(-12,-32)),
        size: v(24,65),
      };
      damage = checkRect(ballRect);
      if (damage) {
        ball.health -= damage;
        if (ball.health <= 0) {
          ball.sprite.delete();
          spikeBalls.splice(i,1);
          i--;
        }
      }
    }
    
    //crowd
    for(i=0; i<crowdPeople.length;i++){
      var person = crowdPeople[i];

      person.health -= checkRect(person);

      if(person.health <= 0){
        if (person.hugging) {
          playerEntity.hugs -= 1;
        }
        omgEargasm(person);
        crowdPeople.splice(i,1);
        i--;
      }
    }
    
    //platforms
    for(i=0; i<platforms.length;i++){
       checkRect(platforms[i], true);
    }
  }

  function omgEargasm(person) {
    person.sprite.setAnimation(ani.eargasmKneel);
    person.sprite.setFrameIndex(0);
    person.sprite.setZOrder(2);
    var life = 1.5;
    fxList.push({
      life: life,
      sprite: person.sprite,
    });
    fxList.push({
      life: life,
      vel: v(0, -0.5),
      sprite: new chem.Sprite(randomEargasmTextAni(), {
        batch: levelBatch,
        pos: person.sprite.pos.offset(0, -30),
        zOrder: 2,
      }),
    });
  }

  function randomEargasmTextAni() {
    return eargasmTextAniList[Math.floor(Math.random() * eargasmTextAniList.length)];
  }

  function spikeBallUpdate(dt, dx) {
    //spike balls
    for(var i=0;i<spikeBalls.length; i++){
      var ball = spikeBalls[i];

      var ballRect = {
            pos: ball.pos.plus(v(-12,-32)),
            size: v(24,65)
      }


      //check against player
      if(rectCollision(playerRect(),ballRect)){
        applyKnockBack();
        ball.sprite.delete();
        spikeBalls.splice(i,1);
        i--;
        continue;
      }

      //move it!
      if(ball.type == "vertical"){
        var center = ball.startVec.y-ball.range;
        ball.period += ball.speed*Math.PI/180;
        
        ball.pos.y = center + ball.range*Math.cos(ball.period);
      }
      else if(ball.type == "horizontal"){
        var center = ball.startVec.x-ball.range;
        ball.period += ball.speed*Math.PI/180;
        
        ball.pos.x = center + ball.range*Math.cos(ball.period);
      }
      else if(ball.type == "rotate"){
      
        var center = ball.startVec.plus(v(-ball.range,0));
        ball.period += ball.speed*Math.PI/180;
        
        ball.pos.x = center.x + ball.range*Math.cos(ball.period);
        ball.pos.y = center.y + ball.range*Math.sin(ball.period);
        
        //ball.pos = center;//.plus(v.unit(ball.period).scale(ball.range/2));*/
      }
      else if(ball.type === "seek"){
        if(ball.triggerOn){
          var directionVec = playerEntity.pos.minus(ball.pos);
          ball.pos.add(directionVec.normalize().scaled(ball.speed));
        }
        else{
          var distFromPlayer = playerEntity.pos.minus(ball.pos).length();

          if(distFromPlayer < ball.range) //&& yDist < 50)
            ball.triggerOn = true;
        }
      }
      else if(ball.type == "attack"){
        if(ball.triggerOn){
          ball.pos.x -= ball.speed;
        }
        else{
          var xDist = Math.abs(ball.pos.x - playerEntity.pos.x);

          if(xDist < engine.size.x/2 + 20) //&& yDist < 50)
            ball.triggerOn = true;
        }
      }
      
    }
  }

  function applyKnockBack() {
    playerEntity.vel.x = playerEntity.directionFacing * -6;
    playerEntity.vel.y = -1;
    playerEntity.knockBackTime = 0.4;
  }

  function weaponUpdate(dt) {
    var currentWeapon = weapons[weaponIndex];
    if (currentWeapon.reload <= 0) {
      if (engine.buttonState(chem.button.MouseLeft) && !playerEntity.dying) {
        var origPoint = playerEntity.pos.offset(6, 10);
        var aimVec = engine.mousePos.plus(scroll).minus(origPoint).normalize();

        if(currentWeapon.name === 'microphone'){
          //Microphone
          projectiles.push({
            sprite: new chem.Sprite(currentWeapon.animation, {
              batch: levelBatch,
              pos: aimVec.scaled(10).plus(origPoint),
              rotation: aimVec.angle(),
            }),
            vel: aimVec.scaled(currentWeapon.projectileSpeed).plus(playerEntity.vel),
            life: currentWeapon.projectileLife,
            damage: currentWeapon.projectileDamage,
            bulletType: "microphone",
          });

          if(currentWeapon.tripleShot){
            var angle2 = aimVec.angle()+Math.PI/8;
            var angle3 = angle2-Math.PI/4;
            var aimVec2 = v.unit(angle2);
            var aimVec3 = v.unit(angle3);

            //add a TRIPLE SHOT
            projectiles.push({
              sprite: new chem.Sprite(currentWeapon.animation, {
                batch: levelBatch,
                pos: aimVec2.scaled(10).plus(origPoint),
                rotation: aimVec2.angle(),
              }),
              vel: aimVec2.scaled(currentWeapon.projectileSpeed).plus(playerEntity.vel),
              life: currentWeapon.projectileLife,
              damage: currentWeapon.projectileDamage,
              bulletType: "microphone",
            });

            projectiles.push({
              sprite: new chem.Sprite(currentWeapon.animation, {
                batch: levelBatch,
                pos: aimVec3.scaled(10).plus(origPoint),
                rotation: aimVec3.angle(),
              }),
              vel: aimVec3.scaled(currentWeapon.projectileSpeed).plus(playerEntity.vel),
              damage: currentWeapon.projectileDamage,
              bulletType: "microphone",
            });
          }
        }else if(currentWeapon.name === 'bass'){
          projectiles.push({
            sprite: new chem.Sprite(currentWeapon.animation, {
              batch: levelBatch,
              pos: aimVec.scaled(10).plus(origPoint),
              rotation: aimVec.angle(),
            }),
            vel: aimVec.scaled(currentWeapon.projectileSpeed).plus(playerEntity.vel),
            life: currentWeapon.projectileLife,
            damage: currentWeapon.projectileDamage,
            bulletType: "bass",
          });
        }else if(currentWeapon.name === 'guitar' && !beam && playerEntity.hugs === 0){
          //GUITAR
          beam = new chem.Sprite(ani.guitarBeam, {
                  batch: levelBatch,
                  pos: aimVec.scaled(10).plus(origPoint),
                  rotation: aimVec.angle(),
          });
          beamLife = 0.750;
        }else if(currentWeapon.name === 'drums'){
          //var aimVec = v(1,-1).normalize();
          var angle = 0;

          for(var i=0; i<16; i++){
            angle = i*Math.PI/8
            aimVec = v.unit(angle);
            projectiles.push({
              sprite: new chem.Sprite(currentWeapon.animation, {
                batch: levelBatch,
                pos: aimVec.scaled(10).plus(origPoint),
                rotation: aimVec.angle(),
              }),
              vel: aimVec.scaled(currentWeapon.projectileSpeed).plus(playerEntity.vel),
              life: currentWeapon.projectileLife,
              damage: currentWeapon.projectileDamage,
              bulletType: "drums",
            });
          }
        }

        currentWeapon.reload = currentWeapon.reloadAmt;
      }
    } else {
      currentWeapon.reload -= dt;
    }
  }

  function onDraw(context) {
    var bgOffsetX = scroll.x / maxScrollX * (bgImg.width - engine.size.x);
    context.drawImage(bgImg, bgOffsetX, 0, engine.size.x, bgImg.height, 0, 0, engine.size.x, bgImg.height);

    var crowdOffsetX = (scroll.x * 0.8) % bgCrowd.width;
    context.translate(-crowdOffsetX, 0);
    context.drawImage(bgCrowd, 0, engine.size.y - groundImg.height - bgCrowd.height);
    context.drawImage(bgCrowd, bgCrowd.width, engine.size.y - groundImg.height - bgCrowd.height);

    context.setTransform(1, 0, 0, 1, 0, 0); // load identity
    context.translate(-scroll.x, -scroll.y);
    levelBatch.draw(context);

    var groundOffsetX = scroll.x % groundImg.width;
    context.setTransform(1, 0, 0, 1, 0, 0); // load identity
    context.translate(-groundOffsetX, 0);
    context.drawImage(groundImg, 0, engine.size.y - groundImg.height);
    context.drawImage(groundImg, groundImg.width, engine.size.y - groundImg.height);

    context.setTransform(1, 0, 0, 1, 0, 0); // load identity
    context.translate(-scroll.x, -scroll.y);
    foregroundBatch.draw(context);

    // static
    context.setTransform(1, 0, 0, 1, 0, 0); // load identity
    staticBatch.draw(context);
    fpsLabel.draw(context);
  }

  function playerDie() {
    playerEntity.dying = true;
  }

  function onMouseMove(pos, button) {
    crosshairSprite.pos = pos.clone();
  }

  function loadMap() {
    map.layers.forEach(function(layer) {
      if (layer.type === 'object') {
        layer.objects.forEach(loadMapObject);
      }
    });
  }

  function loadMapObject(obj) {
    var pos = v(obj.x, obj.y);
    var size = v(obj.width, obj.height);
    var img = chem.resources.images[obj.properties.image];
    switch (obj.name) {
      case 'Start':
        playerEntity.pos = v(pos.x + size.x / 2, pos.y + size.y);
        break;
      case 'Platform':
        var platform = {
          pos: pos,
          size: size,
        };
        if(img != null){
          platform.sprite = new chem.Sprite(chem.Animation.fromImage(img), {
            batch: levelBatch,
            pos: pos,
            scale: size.divBy(v(img.width, img.height)),
          });
        }else{
          platform.sprite = null;
        }
        platforms.push(platform);
        break;
      case 'Skull':
        var animation = obj.type === 'attack' ? ani.skullAttack : ani.skullFloat;
        var spikeBall = {
            pos: pos,
            health: 1,
            size: size,
            sprite: new chem.Sprite(animation, {
              batch: levelBatch,
              pos: pos,
            }),
            type: obj.type,
            range: parseInt(obj.properties.range, 10),
            speed: parseFloat(obj.properties.speed, 10),
            triggerOn: false,
            startVec: pos.clone(),
            period: 0,
        };
        if(obj.type === 'seek'){
          spikeBall.health = 3;
        }else if(obj.type === 'idle'){
          spikeBall.health = 1;
        }else{
          spikeBall.health = 1.5;
        }
        spikeBalls.push(spikeBall);
        break;
      case 'Weed':
        weedClouds.push({
          pos: pos,
          size: size,
          sprite: new chem.Sprite(ani.weedSmoke, {
            batch: levelBatch,
            pos: pos,
            zOrder: 3,
            scale: size.divBy(v(ani.weedSmoke.frames[0].size.x, ani.weedSmoke.frames[0].size.y)),//v(2,2),
          }),
        });
        break;
      case 'Decoration':
        var fg = !!obj.properties.fg;
        var batch = fg ? foregroundBatch : levelBatch;
        decorations.push(new chem.Sprite(chem.Animation.fromImage(img), {
          batch: batch,
          pos: pos,
          zOrder: parseInt(obj.properties.zOrder || 0, 10),
          alpha: parseFloat(obj.properties.opacity || 1, 10),
          scale: size.divBy(v(img.width, img.height)),
        }));
        break;
    }
  }
}

chem.resources.on('ready', function() {
  tmx.load(chem, "level.tmx", function(err, map) {
    if (err) throw err;
    startGame(map);
  });
});

function sign(n) {
  if (n < 0) {
    return -1;
  } else if (n > 0) {
    return 1;
  } else {
    return 0;
  }
}

function rectCollision(rect1, rect2) {
  return !(rect1.pos.x >= rect2.pos.x + rect2.size.x || rect1.pos.y >= rect2.pos.y + rect2.size.y ||
           rect2.pos.x >= rect1.pos.x + rect1.size.x || rect2.pos.y >= rect1.pos.y + rect1.size.y ||
           rect1.pos.x + rect1.size.x < rect2.pos.x || rect1.pos.y + rect1.size.y < rect2.pos.y ||
           rect2.pos.x + rect2.size.x < rect1.pos.x || rect2.pos.y + rect2.size.y < rect1.pos.y);
}

function resolveX(xSign, dynamicRect, staticRect) {
  if (xSign < 0) {
    return staticRect.pos.x - (dynamicRect.pos.x + dynamicRect.size.x);
  } else {
    return staticRect.pos.x + staticRect.size.x - dynamicRect.pos.x + 1;
  }
}

function resolveY(ySign, dynamicRect, staticRect) {
  if (ySign < 0) {
    return staticRect.pos.y - (dynamicRect.pos.y + dynamicRect.size.y);
  } else {
    return staticRect.pos.y + staticRect.size.y - dynamicRect.pos.y + 1;
  }
}

function angleSubtract(left, right){
  var delta = left - right;
  if(delta > Math.PI) delta -= 2*Math.PI;
  if(delta < -Math.PI) delta += 2*Math.PI;
  return delta;
}

function resolveMinDist(rect1, rect2) {
  var minDist = Infinity;
  var outVec;

  var dist1 = Math.abs(rect1.pos.x - (rect2.pos.x + rect2.size.x));
  if (dist1 < minDist) {
    minDist = dist1;
    outVec = v(1, 0);
  }

  dist1 = Math.abs(rect1.pos.x + rect1.size.x - rect2.pos.x);
  if (dist1 < minDist) {
    minDist = dist1;
    outVec = v(-1, 0);
  }

  dist1 = Math.abs(rect1.pos.y - (rect2.pos.y + rect2.size.y));
  if (dist1 < minDist) {
    minDist = dist1;
    outVec = v(0, 1);
  }

  dist1 = Math.abs(rect1.pos.y + rect1.size.y - rect2.pos.y);
  if (dist1 < minDist) {
    minDist = dist1;
    outVec = v(0, -1);
  }

  return outVec;
}


function lineIntersectsRect(startPt, endPt, rect) {
  var x1 = startPt.x;
  var y1 = startPt.y;
  var x2 = endPt.x;
  var y2 = endPt.y;
  var minX = rect.pos.x;
  var minY = rect.pos.y;
  var maxX = rect.pos.x + rect.size.x;
  var maxY = rect.pos.y + rect.size.y;

  // Completely outside.
  if ((x1 <= minX && x2 <= minX) || (y1 <= minY && y2 <= minY) ||
      (x1 >= maxX && x2 >= maxX) || (y1 >= maxY && y2 >= maxY))
  {
    return false;
  }


  var m = (y2 - y1) / (x2 - x1);

  var y = m * (minX - x1) + y1;
  if (y > minY && y < maxY) return true;

  y = m * (maxX - x1) + y1;
  if (y > minY && y < maxY) return true;

  var x = (minY - y1) / m + x1;
  if (x > minX && x < maxX) return true;

  x = (maxY - y1) / m + x1;
  if (x > minX && x < maxX) return true;

  return false;
}

function lineIntersectsCircle(startPos, endPos, circle) {
  var d = endPos.minus(startPos);
  var f = endPos.minus(circle.pos);
  var a = d.dot(d);
  var b = 2 * f.dot(d);
  var c = f.dot(f) - circle.radius * circle.radius;
  var discriminant = b * b - 4 * a * c;
  return (discriminant >= 0);
}
