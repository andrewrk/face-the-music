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

function startGame(map) {
  var batch = new chem.Batch();
  var player = new chem.Sprite(ani.dude, {
    batch: batch,
  });
  var playerVel = v(0,0);
  var platforms = [];
  var fpsLabel = engine.createFpsLabel();
  
  var playerMaxSpeed = 5; //running
  var playerRunAcc = .25; //added every frame until max speed)
  var plaerJumpVec = v(0,-5); //added ONCE
  var friction = 1.15;
  var grounded = false;
  

  engine.on('update', onUpdate);
  engine.on('draw', onDraw);

  loadMap();

  function onUpdate(dt, dx) {

    
    //CONTROLS
    var left = engine.buttonState(chem.button.KeyLeft) || engine.buttonState(chem.button.KeyA);
    var right = engine.buttonState(chem.button.KeyRight) || engine.buttonState(chem.button.KeyD);
    var jump = engine.buttonState(chem.button.KeyUp) || engine.buttonState(chem.button.KeyW) || engine.buttonState(chem.button.space);
    
    if (left) {
      playerVel.x -= playerRunAcc;
    }
    if (right) {
      playerVel.x += playerRunAcc;
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
      if(Math.abs(playerVel.x) < .25){
        playerVel.x = 0;
      }
      else{
        playerVel.scale(1/friction);
      }
    }
    
    player.pos.add(playerVel);//.scaled(dx));
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
