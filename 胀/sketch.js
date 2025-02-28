
var canvasWidth = 600;
var canvasHeight = 600;


var counter = 0;
var img;
var trailLayer; // Graphics buffer for the gradient trail

function preload() {
  
  img = loadImage('a.jpg');
}

function setup() {
  
  createCanvas(canvasWidth, canvasHeight);
  trailLayer = createGraphics(canvasWidth, canvasHeight);
  trailLayer.pixelDensity(1); 
}

function draw() {
  
  background(255);
  
  
  trailLayer.noStroke();
  trailLayer.fill(255, 50); 
  trailLayer.rect(0, 0, canvasWidth, canvasHeight);
  
  
  let gradientRadius = 125;
  
  // Define a dynamic center color based on mouse position
  let centerColor = color(
    map(mouseX, 0, canvasWidth, 0, 255),
    map(mouseY, 0, canvasHeight, 0, 255),
    200
  );
  
 
  drawRadialGradient(trailLayer, mouseX, mouseY, gradientRadius, centerColor, color(255));
  
 
  image(trailLayer, 0, 0);
  
  
  drawTiles(0, 0, canvasWidth, canvasHeight, 4);
  
  counter += 0.02; // Slowly update counter for dynamic noise values
}


function drawRadialGradient(pg, x, y, radius, centerColor, edgeColor) {
  pg.noStroke();
  // Draw many concentric circles from the outside in.
  for (let r = radius; r > 0; r--) {
    let inter = map(r, 0, radius, 1, 0);
    let c = lerpColor(centerColor, edgeColor, inter);
    pg.fill(c);
    pg.ellipse(x, y, r * 2, r * 2);
  }
}

// Returns a smoothly biased ratio based on the mouse's position within the tile.
function smoothBiasedRatio(mouseCoord, tileStart, tileSize, defaultRatio) {
  if (mouseCoord >= tileStart && mouseCoord <= tileStart + tileSize) {
    let relPos = (mouseCoord - tileStart) / tileSize;
    // Remap relative position to a target ratio: 0.8 at one edge and 0.2 at the other.
    let targetRatio = map(relPos, 0, 1, 0.8, 0.2);
    let smoothingFactor = 0.5;
    return lerp(defaultRatio, targetRatio, smoothingFactor);
  }
  return defaultRatio;
}

function drawTiles(x, y, w, h, step) {
  // Base case: when recursion ends, draw the corresponding image portion.
  if (step <= 0) {
    image(img, x, y, w, h);
    return;
  }
  
  // Use Perlin noise to determine a default split ratio.
  var n = noise(x / canvasWidth * TAU, y / canvasHeight * TAU, counter);
  
  if (step % 2 === 0) {
    // Horizontal split (dividing along x)
    let ratio = n;
    if (mouseX >= x && mouseX <= x + w) {
      ratio = smoothBiasedRatio(mouseX, x, w, n);
    }
    let splitX = x + w * ratio;
    drawTiles(x, y, splitX - x, h, step - 1);
    drawTiles(splitX, y, (x + w) - splitX, h, step - 1);
  } else {
    // Vertical split (dividing along y)
    let ratio = n;
    if (mouseY >= y && mouseY <= y + h) {
      ratio = smoothBiasedRatio(mouseY, y, h, n);
    }
    let splitY = y + h * ratio;
    drawTiles(x, y, w, splitY - y, step - 2);
    drawTiles(x, splitY, w, (y + h) - splitY, step - 1);
  }
}
