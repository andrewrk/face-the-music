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

function startGame(map) {
  var levelBatch = new chem.Batch();
  var staticBatch = new chem.Batch();
  var player = new chem.Sprite(ani.roadieIdle, {
    batch: levelBatch,
  });
  var playerPos = v();
  var playerSize = v(15, 57);
  var crowd = new chem.Sprite(ani.platform,{
    batch: levelBatch,
    pos: v(20,0),
    scale: v(50,900).divBy(ani.platform.frames[0].size)
  });
  var crowdRect = {pos: crowd.pos, size: v(50,900)};
  var crosshairSprite = new chem.Sprite(ani.crosshair, {
    batch: staticBatch,
  });
  var playerVel = v(0,0);
  var platforms = [];
  var fpsLabel = engine.createFpsLabel();

  var playerStartSpeed = 5;
  var playerMaxSpeed = playerStartSpeed;
  var playerRunAcc = 0.25;
  var playerAirAcc = 0.15;
  var playerJumpVec = v(0,-6.5); //added ONCE
  var friction = 1.15;
  var grounded = false;
  var scroll = v(0, 0);

  var crowdSpeed = 0.2;

  //Enemies
  var spikeBalls = [];
  var weedClouds = [];
  var decorations = [];

  var projectiles = [];

  var directionFacing = 1;

  var bgImg = chem.resources.images['background.png'];
  var maxScrollX = null;

  var mikeReloadAmt = 0.3//0.1;
  var mikeReload = 0;
  var mikeProjectileSpeed = 10;//6;
  
  var tripleShot = true;
  var currentWeapon = 'drums';

  engine.on('update', onUpdate);
  engine.on('draw', onDraw);
  engine.on('mousemove', onMouseMove);

  loadMap();

  function playerRect() {
    return {
      pos: playerPos,
      size: playerSize,
    };
  }

  function onUpdate(dt, dx) {
    //CONTROLS
    var left = engine.buttonState(chem.button.KeyLeft) || engine.buttonState(chem.button.KeyA);
    var right = engine.buttonState(chem.button.KeyRight) || engine.buttonState(chem.button.KeyD);
    var jump = engine.buttonState(chem.button.KeyUp) || engine.buttonState(chem.button.KeyW) || engine.buttonState(chem.button.KeySpace);
    var shift = engine.buttonJustPressed(chem.button.KeyShift);
    
    if(shift){
      if(currentWeapon == 'microphone'){
        currentWeapon = 'drums';
      }
      else if(currentWeapon == 'drums'){
        currentWeapon = 'microphone';
      }
    }

    //Update crowd position
    crowd.pos.x += crowdSpeed;

    var pr = playerRect();
    if(rectCollision(pr,crowdRect)){
      //kill it
      playerPos.x = 99999;
      return;
    }
    
    //WEED cloud collision
    for(var i=0;i<weedClouds.length;i++){
      var cloud = weedClouds[i];
      var cloudRect = {pos: cloud.pos.plus(v(100,30)), size: v(230,100)};
      
      if(rectCollision(player,cloudRect) && playerMaxSpeed == 5){
        playerMaxSpeed = 2.5;
      }
      else{
        if(playerMaxSpeed == 2.5)
          playerMaxSpeed = playerStartSpeed;
      }
    }


    if (mikeReload <= 0) {
      if (engine.buttonState(chem.button.MouseLeft)) {
        var aimVec = engine.mousePos.plus(scroll).minus(playerPos).normalize();

        if(currentWeapon == 'microphone'){
          //Microphone        
          projectiles.push({
            sprite: new chem.Sprite(ani.soundwave, {
              batch: levelBatch,
              pos: aimVec.scaled(10).plus(playerPos.offset(0, 0)),
              rotation: aimVec.angle(),
            }),
            vel: aimVec.scaled(mikeProjectileSpeed).plus(playerVel),
          });
          
          if(tripleShot){
            var angle2 = aimVec.angle()+Math.PI/8;
            var angle3 = angle2-Math.PI/4;
            var aimVec2 = v(Math.cos(angle2),Math.sin(angle2));
            var aimVec3 = v(Math.cos(angle3),Math.sin(angle3));
          
            //add a TRIPLE SHOT
            projectiles.push({
              sprite: new chem.Sprite(ani.soundwave, {
                batch: levelBatch,
                pos: aimVec2.scaled(10).plus(playerPos.offset(0, 0)),
                rotation: aimVec2.angle(),
              }),
              vel: aimVec2.scaled(mikeProjectileSpeed).plus(playerVel),
            });

            projectiles.push({
              sprite: new chem.Sprite(ani.soundwave, {
                batch: levelBatch,
                pos: aimVec3.scaled(10).plus(playerPos.offset(0, 0)),
                rotation: aimVec3.angle(),
              }),
              vel: aimVec3.scaled(mikeProjectileSpeed).plus(playerVel),
            });/**/
          }
        }
        else if(currentWeapon == 'guitar'){
          
        }
        else if(currentWeapon == 'drums'){
          //var aimVec = v(1,-1).normalize();
          var angle = 0;
          
          for(var i=0;i<16;i++){
            angle = i*Math.PI/8
            aimVec = v(Math.cos(angle),Math.sin(angle));
            projectiles.push({
              sprite: new chem.Sprite(ani.soundwave, {
                batch: levelBatch,
                pos: aimVec.scaled(10).plus(playerPos.offset(0, 0)),
                rotation: aimVec.angle(),
              }),
              vel: aimVec.scaled(mikeProjectileSpeed).plus(playerVel),
            });
          }
        }
        
        mikeReload = mikeReloadAmt;
      }
    } else {
      mikeReload -= dt;
    }
    
    //spike balls
    var i;
    for(i=0;i<spikeBalls.length; i++){
      var ball = spikeBalls[i];

      var ballRect = {
            pos: ball.pos.plus(v(-12,-32)),
            size: v(24,65)
      }
      
      var ballColliding = false;
      
      
      
      if(rectCollision(player,ballRect)){
        ball.sprite.delete();
        spikeBalls.splice(i,1);
        i--;
        ballColliding = true;
      }
      else{
        //move it!
        if(ball.type == "vertical"){
        }
        else if(ball.type == "horizontal"){
        }
        else if(ball.type == "rotate"){
        }
        else if(ball.type == "attack"){
          if(ball.triggerOn){
            ball.pos.x -= ball.speed;
          }
          else{
            var xDist = Math.abs(ball.pos.x - playerPos.x);
            var yDist = Math.abs(ball.pos.y - playerPos.y);

            if(xDist < engine.size.x) //&& yDist < 50)
              ball.triggerOn = true;
          }
        }
      }
      
      if(!ballColliding){
        for (j = 0; j < projectiles.length; j += 1) {
          if(rectCollision(ballRect,projectiles[j].sprite)){
            ball.sprite.delete();
            spikeBalls.splice(i,1);
            i--;
            
            projectiles[j].sprite.delete();
            projectiles.splice(j,1);
            break;
          }
        }
      }
    }
    
    for (i = 0; i < projectiles.length; i += 1) {
      var projectile = projectiles[i];
      projectile.sprite.pos.add(projectile.vel.scaled(dx));
      
      /*if(projectile.sprite.pos.minus(playerPos).length > 1){
        projectiles[i].sprite.delete();
        projectiles.splice(i,1);
        i--;
      }*/
    }
    
    console.log(projectiles);




    //Player COLISION
    var newPlayerPos = playerPos.plus(playerVel.scaled(dx));
    grounded = false;
    for (i = 0; i < platforms.length; i += 1) {
      var platform = platforms[i];
      if (rectCollision(pr, platform)) {
        var outVec = resolveMinDist(pr, platform);
        if (Math.abs(outVec.x) > Math.abs(outVec.y)) {
          var xDiff = resolveX(outVec.x, pr, platform);
          newPlayerPos.x += xDiff;
          playerVel.x = 0;
        } else {
          var yDiff = resolveY(outVec.y, pr, platform);
          newPlayerPos.y += yDiff;
          playerVel.y = 0;
        }
        if (outVec.y < 0) {
          grounded = true;
        }
      }
    }
    playerPos = newPlayerPos;

    scroll = playerPos.minus(engine.size.scaled(0.5));
    if (scroll.x < 0) scroll.x = 0;
    scroll.y = 0;
    maxScrollX = map.width - engine.size.x / 2;
    if (scroll.x > maxScrollX) scroll.x = maxScrollX;

    if (left) {
      if(grounded)
        playerVel.x -= playerRunAcc;
      else
        playerVel.x -= playerAirAcc;
    }
    if (right) {
      if(grounded)
        playerVel.x += playerRunAcc;
      else
        playerVel.x += playerAirAcc;
    }
    if (jump) {
      if(grounded){
        playerVel.add(playerJumpVec);
        grounded = false;
      }
    }

    //check MAX SPEED
    if(playerVel.x < -playerMaxSpeed){
        playerVel.x = -playerMaxSpeed;
    }
    if(playerVel.x > playerMaxSpeed){
      playerVel.x = playerMaxSpeed;
    }

    //Apply FRICTION
    if(grounded && !left && !right){
      if(Math.abs(playerVel.x) < 0.25){
        playerVel.x = 0;
      }
      else{
        playerVel.scale(1/friction);
      }
    }

    // gravity
    playerVel.y += GRAVITY * dx;

    var wantedAni = getPlayerAnimation();
    if (player.animation !== wantedAni) {
      player.setAnimation(wantedAni);
      player.setFrameIndex(0);
    }

    directionFacing = sign(playerVel.x) || directionFacing;
    player.scale.x = directionFacing;
    player.pos = playerPos.clone();
    // compensate for offset
    if (directionFacing < 0) {
      player.pos.x += playerSize.x;
    }

    function getPlayerAnimation() {
      if (grounded) {
        if (Math.abs(playerVel.x) > 0) {
          if (left&&playerVel.x<=0 || right&&playerVel.x>=0) {
            return ani.roadieRun;
          } else {
            return ani.roadieSlide;
          }
        } else {
          return ani.roadieIdle;
        }
      } else if (playerVel.y < 0) {
        return ani.roadieJumpUp;
      } else {
        return ani.roadieJumpDown;
      }
    }

  }

  function onDraw(context) {
    var offsetX = scroll.x / maxScrollX * (bgImg.width - engine.size.x);
    context.drawImage(bgImg, offsetX, 0, engine.size.x, bgImg.height, 0, 0, engine.size.x, engine.size.y);


    // draw all sprites in batch
    context.setTransform(1, 0, 0, 1, 0, 0); // load identity
    context.translate(-scroll.x, -scroll.y); // load identity
    levelBatch.draw(context);

    // static
    context.setTransform(1, 0, 0, 1, 0, 0); // load identity
    staticBatch.draw(context);
    fpsLabel.draw(context);
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
        playerPos = v(pos.x + size.x / 2, pos.y + size.y);
        break;
      case 'Platform':
        platforms.push({
          pos: pos,
          size: size,
          sprite: new chem.Sprite(chem.Animation.fromImage(img), {
            batch: levelBatch,
            pos: pos,
            scale: size.divBy(v(img.width, img.height)),
          }),
        });
        break;
      case 'Skull':
        spikeBalls.push({
          pos: pos,
          size: size,
          sprite: new chem.Sprite(ani.skullAttack, {
            batch: levelBatch,
            pos: pos,
          }),
          type: obj.type,
          range: parseInt(obj.properties.range, 10),
          speed: parseInt(obj.properties.speed, 10),
          triggerOn: false,
        });
        break;
      case 'Weed':
        weedClouds.push({
          pos: pos,
          size: size,
          sprite: new chem.Sprite(ani.weedSmoke, {
            batch: levelBatch,
            pos: pos,
          }),
        });
        break;
      case 'Decoration':
        decorations.push(new chem.Sprite(chem.Animation.fromImage(img), {
          batch: levelBatch,
          pos: pos,
          zOrder: parseInt(obj.properties.zOrder || 0, 10),
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
