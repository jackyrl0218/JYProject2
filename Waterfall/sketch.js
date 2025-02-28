let font;
let dots = [];
let candidatePoints = [];
let step = 4;         // grid step for sampling text
let threshold = 50;   // brightness threshold for candidate dot

// Animation timings (in seconds) for text dots:
let T1 = 2;           // top -> target
let Tpause = 1;       // pause at target
let T2 = 2;           // target -> bottom
let totalTime = T1 + Tpause + T2;

// Offscreen graphics buffer for text sampling:
let pg;

// Bounding box for text (used for hover detection)
let textMinX, textMaxX, textMinY, textMaxY;

// Global flag for mouse hover over text area
let hoverActive = false;

// Arrays for extra dots:
let trailDots = [];   // extra dots near text, with random drift
let splashDots = [];  // water splash dots that fall from top to bottom

function preload() {
  font = loadFont('CormorantGaramond-BoldItalic.ttf');
}

function setup() {
  createCanvas(600, 600);
  // Use a white background
  background(255);
  
  // --- Create an offscreen graphics buffer to draw our two-line text ---
  pg = createGraphics(600, 600);
  pg.pixelDensity(1);
  pg.background(0);
  pg.textFont(font);
  pg.textSize(200);
  pg.textAlign(CENTER, CENTER);
  pg.fill(255);
  // Two centered lines: "water" and "fall"
  pg.text("Water", width / 2, height / 3);
  pg.text("Fall", width / 2, 2 * height / 3);
  
  // --- Sample the offscreen graphics for candidate dot positions ---
  pg.loadPixels();
  for (let y = 0; y < pg.height; y += step) {
    for (let x = 0; x < pg.width; x += step) {
      let c = pg.get(x, y); // returns [r, g, b, a]
      if (brightness(c) > threshold) {
        candidatePoints.push({ x: x, y: y });
      }
    }
  }
  
  // --- Compute the bounding box of the text area ---
  textMinX = width;
  textMaxX = 0;
  textMinY = height;
  textMaxY = 0;
  for (let pt of candidatePoints) {
    if (pt.x < textMinX) textMinX = pt.x;
    if (pt.x > textMaxX) textMaxX = pt.x;
    if (pt.y < textMinY) textMinY = pt.y;
    if (pt.y > textMaxY) textMaxY = pt.y;
  }
  
  // --- Compute global min/max X for arrival delay based on horizontal center ---
  let minX = width;
  let maxX = 0;
  for (let pt of candidatePoints) {
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
  }
  let centerX = width / 2;
  let maxDist = max(centerX - minX, maxX - centerX);
  
  // --- Create a Dot object for each candidate point (for text formation) ---
  for (let pt of candidatePoints) {
    // Dots closer to center arrive sooner.
    let arrivalDelay = 0.5 * (abs(pt.x - centerX) / maxDist);
    // Top position: start above canvas.
    let xTop = pt.x;
    let yTop = random(-150, -50);
    // Middle (target) position: from sampled point.
    let xMid = pt.x;
    let yMid = pt.y;
    // Bottom position: fall off canvas.
    let xBot = pt.x;
    let yBot = height + random(50, 150);
    dots.push(new Dot(xTop, yTop, xMid, yMid, xBot, yBot, arrivalDelay));
  }
  
  noStroke();
}

function draw() {
  // --- Use a partially transparent white background for a subtle trailing effect ---
  background(255, 30);
  
  // --- Update hover flag if mouse is inside text bounding box ---
  if (mouseX >= textMinX && mouseX <= textMaxX &&
      mouseY >= textMinY && mouseY <= textMaxY) {
    hoverActive = true;
  } else {
    hoverActive = false;
  }
  
  // --- Update and display text dots ---
  let t = (millis() / 1000) % totalTime;
  for (let dot of dots) {
    dot.updateAndShow(t);
  }
  
  // --- Spawn extra random trail dots (near text) ---
  if (random(1) < 0.2) {  // increased spawn rate
    trailDots.push(new TrailDot(random(width), random(height/3, 2*height/3)));
  }
  
  // --- Update and display the trail dots ---
  for (let i = trailDots.length - 1; i >= 0; i--) {
    trailDots[i].update();
    trailDots[i].show();
    if (trailDots[i].isFinished()) {
      trailDots.splice(i, 1);
    }
  }
  
  // --- Spawn water splash dots that fall from the top ---
  if (random(1) < 0.3) {  // higher spawn rate for splash dots
    splashDots.push(new SplashDot(random(width), -10));
  }
  
  // --- Update and display the splash dots ---
  for (let i = splashDots.length - 1; i >= 0; i--) {
    splashDots[i].update();
    splashDots[i].show();
    if (splashDots[i].isFinished()) {
      splashDots.splice(i, 1);
    }
  }
}

// -------------------
// Dot class for text-formed dots
// -------------------
class Dot {
  constructor(xTop, yTop, xMid, yMid, xBot, yBot, arrivalDelay) {
    this.xTop = xTop;
    this.yTop = yTop;
    this.xMid = xMid;
    this.yMid = yMid;
    this.xBot = xBot;
    this.yBot = yBot;
    this.arrivalDelay = arrivalDelay;
    this.dotSize = random(3, 6);
    // Extra random drift parameters.
    this.driftFactor = random(1, 3);
    this.driftPhase = random(TWO_PI);
  }
  
  updateAndShow(t) {
    let x, y;
    
    // --- PHASE 1: Top -> Target ---
    if (t < T1) {
      if (t < this.arrivalDelay) {
        x = this.xTop;
        y = this.yTop;
      } else {
        let timeSoFar = t - this.arrivalDelay;
        let duration = T1 - this.arrivalDelay;
        let p = constrain(timeSoFar / duration, 0, 1);
        x = lerp(this.xTop, this.xMid, p);
        y = lerp(this.yTop, this.yMid, p);
      }
    }
    // --- PHASE 2: Pause at target ---
    else if (t < T1 + Tpause) {
      x = this.xMid;
      y = this.yMid;
    }
    // --- PHASE 3: Target -> Bottom ---
    else {
      let t2 = t - (T1 + Tpause);
      if (t2 < this.arrivalDelay) {
        x = this.xMid;
        y = this.yMid;
      } else {
        let timeSoFar = t2 - this.arrivalDelay;
        let duration = T2 - this.arrivalDelay;
        let p = constrain(timeSoFar / duration, 0, 1);
        x = lerp(this.xMid, this.xBot, p);
        y = lerp(this.yMid, this.yBot, p);
      }
    }
    
    // --- Add fluid wiggle and extra random drift ---
    let noiseX = noise(this.xMid * 0.01 + frameCount * 0.01, this.yMid * 0.01);
    let noiseY = noise(this.yMid * 0.01 + frameCount * 0.01, this.xMid * 0.01);
    let offsetX = map(noiseX, 0, 1, -2, 2);
    let offsetY = map(noiseY, 0, 1, -2, 2);
    
    let extraDrift = sin(frameCount * 0.05 + this.driftPhase) * this.driftFactor;
    
    let finalX = x + offsetX + extraDrift;
    let finalY = y + offsetY;
    
    // --- Blue gradient color based on the dot's x position ---
    let greenVal = map(this.xMid, 0, width, 50, 150);
    let blueVal = map(this.xMid, 0, width, 180, 255);
    let dotColor = color(0, greenVal, blueVal, 200);
    fill(dotColor);
    
    // --- On hover, repulse near the mouse and render as waterdrop shape ---
    let repulsionThreshold = 80;
    let d = dist(finalX, finalY, mouseX, mouseY);
    if (hoverActive && d < repulsionThreshold) {
      let repulseMag = map(d, 0, repulsionThreshold, 20, 0);
      let angle = atan2(finalY - mouseY, finalX - mouseX);
      finalX += repulseMag * cos(angle);
      finalY += repulseMag * sin(angle);
      ellipse(finalX, finalY, this.dotSize, this.dotSize * 1.5);
    } else {
      ellipse(finalX, finalY, this.dotSize);
    }
  }
}

// -------------------
// TrailDot class for extra random dots near the text (with random drift)
// -------------------
class TrailDot {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = random(2, 4);
    this.speedY = random(1, 3);
    this.alpha = 200;
    this.drift = random(-1, 1);
  }
  
  update() {
    this.y += this.speedY;
    this.x += this.drift;
    this.alpha -= 2;
  }
  
  show() {
    fill(0, 150, 255, this.alpha);
    ellipse(this.x, this.y, this.size);
  }
  
  isFinished() {
    return this.alpha <= 0 || this.y > height + 10;
  }
}

// -------------------
// SplashDot class for water splash dots that fall from the top to bottom
// -------------------
class SplashDot {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = random(3, 6);
    this.speedY = random(2, 5);
    this.alpha = 220;
    this.drift = random(-1.5, 1.5);
  }
  
  update() {
    this.y += this.speedY;
    this.x += this.drift;
    this.alpha -= 1.5;
  }
  
  show() {
    // Use a slightly different blue for splashes.
    fill(0, 130, 255, this.alpha);
    ellipse(this.x, this.y, this.size);
  }
  
  isFinished() {
    return this.alpha <= 0 || this.y > height + 10;
  }
}
