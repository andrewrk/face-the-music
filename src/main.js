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

  var playerMaxSpeed = 5;
  var playerRunAcc = 0.25;
  var playerAirAcc = 0.15;
  var playerJumpVec = v(0,-6.5); //added ONCE
  var friction = 1.15;
  var grounded = false;
  var scroll = v(0, 0);
  
  var crowdSpeed = .2;
  
  //Enemies
  var spikeBalls = [];

  var crowdSpeed = 2;
  var directionFacing = 1;

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

    //Update crowd position
    crowd.pos.x += crowdSpeed;
    
    var pr = playerRect();
    if(rectCollision(pr,crowdRect)){
      //kill it
      playerPos.x = 99999;
    }
    
    //spike balls
    for(var i=0;i<spikeBalls.length; i++){
      var ball = spikeBalls[i];
      if(rectCollision(player,ball)){
        ball.sprite.delete();
        spikeBalls.splice(i,1);
        i--;
      }
      else{
        //move it!
        if(ball.type == "vert"){
          
        }
        else if(ball.type == "hor"){
          
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
    }
    
  
    

    //Player COLISION
    var newPlayerPos = playerPos.plus(playerVel.scaled(dx));
    grounded = false;
    for (var i = 0; i < platforms.length; i += 1) {
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
          if (left || right) {
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
    // clear canvas to black
    context.fillStyle = '#000000';
    context.fillRect(0, 0, engine.size.x, engine.size.y);

    // draw all sprites in batch
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
    switch (obj.name) {
      case 'Start':
        playerPos = v(pos.x + size.x / 2, pos.y + size.y);
        break;
      case 'Platform':
        var img = chem.resources.images[obj.properties.image];
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
          range: parseInt(obj.properties.range),
          speed: parseInt(obj.properties.speed),
          triggerOn: false
        });
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
