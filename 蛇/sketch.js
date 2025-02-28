/* 
  This sketch displays fixed text ("蛇") forming a snake-like chain that follows the mouse.
  Additionally, colorful fireworks are displayed in the background.
  Canvas size is fixed at 600px x 600px.
*/

let startColor;
let endColor;
let params = {
  strokeColor: '#ffffff',        // Outline color
  startColor: '#ff3456',         // Start gradient color
  endColor: '#ffffff',           // End gradient color
  backgroundColor: [245, 245, 245, 100], // Background color (rgba)
  segNum: 100,                   // Number of segments for snake text
  textSpacing: 10,               // Spacing between segments
  fontSize: 70,                  // Text size
  text: "蛇"                     // Fixed text content
};

let x, y;

// Fireworks variables
let fireworks = [];

class Spark {
  constructor(x, y, col) {
    this.pos = createVector(x, y);
    let angle = random(TWO_PI);
    let speed = random(2, 6);
    this.vel = p5.Vector.fromAngle(angle).mult(speed);
    this.acc = createVector(0, 0.1); // gravity
    this.lifespan = 255;
    this.col = col;
  }
  
  update() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.lifespan -= 4;
  }
  
  done() {
    return this.lifespan < 0;
  }
  
  show() {
    noStroke();
    fill(red(this.col), green(this.col), blue(this.col), this.lifespan);
    ellipse(this.pos.x, this.pos.y, 4);
  }
}

class Firework {
  constructor() {
    this.pos = createVector(random(width), height);
    this.vel = createVector(0, random(-12, -8));
    this.acc = createVector(0, 0.2);
    this.exploded = false;
    this.sparks = [];
    this.col = color(random(255), random(255), random(255));
  }
  
  update() {
    if (!this.exploded) {
      this.vel.add(this.acc);
      this.pos.add(this.vel);
      if (this.vel.y >= 0) {
        this.explode();
      }
    }
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      this.sparks[i].update();
      if (this.sparks[i].done()) {
        this.sparks.splice(i, 1);
      }
    }
  }
  
  explode() {
    this.exploded = true;
    let numSparks = int(random(20, 50));
    for (let i = 0; i < numSparks; i++) {
      this.sparks.push(new Spark(this.pos.x, this.pos.y, this.col));
    }
  }
  
  done() {
    return this.exploded && this.sparks.length === 0;
  }
  
  show() {
    if (!this.exploded) {
      noStroke();
      fill(255);
      ellipse(this.pos.x, this.pos.y, 4);
    }
    for (let spark of this.sparks) {
      spark.show();
    }
  }
}

// Snake-like text segment code
function setup() {
  createCanvas(600, 600);
  textSize(params.fontSize);
  // Use your loaded font; ensure it's properly included (e.g., via a font file)
  textFont('FZXingKai');
  textStyle(BOLD);
  
  updateColors();
  setupArrays(params.segNum);
}

function setupArrays(num) {
  x = new Array(num);
  y = new Array(num);
  for (let i = 0; i < num; i++) {
    x[i] = 0;
    y[i] = 0;
  }
}

function updateColors() {
  startColor = color(params.startColor);
  endColor = color(params.endColor);
}

function segment(x, y, a, i) {
  let currentColor = lerpColor(startColor, endColor, i / (params.segNum - 1));
  push();
  translate(x, y);
  rotate(a);
  fill(currentColor);
  stroke(params.strokeColor);
  strokeWeight(2);
  textSize(params.fontSize);
  text(params.text, 0, 0);
  pop();
}

function draw() {
  // Draw background
  let bgColor = color(params.backgroundColor);
  background(bgColor);
  
  // Update and display fireworks in the background
  if (random() < 0.05) { // chance to spawn a new firework
    fireworks.push(new Firework());
  }
  for (let i = fireworks.length - 1; i >= 0; i--) {
    fireworks[i].update();
    fireworks[i].show();
    if (fireworks[i].done()) {
      fireworks.splice(i, 1);
    }
  }
  
  // Optional fixed message in the center (decorative)
  let message = "2025\nHAPPY\nCHINESE\nNEWYEAR!";
  textAlign(CENTER, CENTER);
  textSize(46);
  fill(0);
  text(message, width / 2, height / 2);
  
  // Snake-like text segments following the mouse
  let angle = atan2(mouseY - y[0], mouseX - x[0]);
  x[0] = mouseX - cos(angle) * params.textSpacing;
  y[0] = mouseY - sin(angle) * params.textSpacing;
  
  for (let i = 1; i < params.segNum; i++) {
    angle = atan2(y[i - 1] - y[i], x[i - 1] - x[i]);
    x[i] = x[i - 1] - cos(angle) * params.textSpacing;
    y[i] = y[i - 1] - sin(angle) * params.textSpacing;
  }
  
  for (let i = params.segNum - 1; i >= 0; i--) {
    segment(x[i], y[i], angle, i);
  }
}
