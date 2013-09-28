var chem = require("chem");
var v = chem.vec2d;
var ani = chem.resources.animations;
var canvas = document.getElementById("game");
var engine = new chem.Engine(canvas);
var tmx = require('chem-tmx');

engine.buttonCaptureExceptions[chem.button.KeyF5] = true;

engine.showLoadProgressBar();
engine.start();
canvas.focus();

var GRAVITY = 0.2;

function startGame(map) {
  var batch = new chem.Batch();
  var player = new chem.Sprite(ani.dude, {
    batch: batch,
  });
  var playerVel = v(0,0);
  var platforms = [];
  var fpsLabel = engine.createFpsLabel();

  var playerMaxSpeed = 5;
  var playerRunAcc = 0.25;
  var playerAirAcc = 0.15;
  var playerJumpVec = v(0,-6); //added ONCE
  var friction = 1.15;
  var grounded = false;


  engine.on('update', onUpdate);
  engine.on('draw', onDraw);

  loadMap();

  function onUpdate(dt, dx) {
    var newPlayerPos = player.pos.plus(playerVel);
    for (var i = 0; i < platforms.length; i += 1) {
      var platform = platforms[i];
      if (rectCollision(player, platform)) {
        var outVec = resolveMinDist(player, platform);
        if (Math.abs(outVec.x) > Math.abs(outVec.y)) {
          var xDiff = resolveX(outVec.x, player, platform);
          newPlayerPos.x += xDiff;
          playerVel.x = 0;
        } else {
          var yDiff = resolveY(outVec.y, player, platform);
          newPlayerPos.y += yDiff;
          playerVel.y = 0;
        }
        if (outVec.y < 0) {
          grounded = true;
        }
      }
    }
    player.pos = newPlayerPos;

    //CONTROLS
    var left = engine.buttonState(chem.button.KeyLeft) || engine.buttonState(chem.button.KeyA);
    var right = engine.buttonState(chem.button.KeyRight) || engine.buttonState(chem.button.KeyD);
    var jump = engine.buttonState(chem.button.KeyUp) || engine.buttonState(chem.button.KeyW) || engine.buttonState(chem.button.KeySpace);

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
  }

  function onDraw(context) {
    // clear canvas to black
    context.fillStyle = '#000000'
    context.fillRect(0, 0, engine.size.x, engine.size.y);

    // draw all sprites in batch
    batch.draw(context);

    // draw a little fps counter in the corner
    fpsLabel.draw(context);
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
        player.pos = v(pos.x + size.x / 2, pos.y + size.y);
        break;
      case 'Platform':
        platforms.push({
          pos: pos,
          size: size,
          sprite: new chem.Sprite(ani.platform, {
            batch: batch,
            pos: pos,
            scale: size.divBy(ani.platform.frames[0].size),
          }),
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
