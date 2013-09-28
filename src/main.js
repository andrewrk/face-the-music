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
  var player = new chem.Sprite(ani.ship, {
    batch: batch,
  });
  var playerVel = v();
  var platforms = [];
  var fpsLabel = engine.createFpsLabel();

  engine.on('update', onUpdate);
  engine.on('draw', onDraw);

  loadMap();

  function onUpdate(dt, dx) {
    player.pos.add(playerVel);
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
        player.pos = pos;
        break;
      case 'Platform':
        platforms.push({
          pos: pos,
          size: size,
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
