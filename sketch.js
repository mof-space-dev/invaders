let phase = 0;
let t = 0;
let biosLines = [];
let biosIdx = 0;
let biosTimer = 0;
let cursorBlink = 0;
let invaders = [];
let bullets = [];
let player = {};
let invaderDir = 1;
let invaderTimer = 0;
let bulletTimer = 0;
let titleAlpha = 0;

const GREEN = [100, 220, 60];
const DIM   = [60, 130, 30];

const BIOS_TEXT = [
  'RETRO-BIOS v2.1  (C) 1983 MegaSoft Corp.',
  '',
  'CPU: MegaZ80  4.77 MHz',
  'FPU: None',
  '',
  'Memory Test:',
  '  0K  ...',
  '  64K OK',
  '  128K OK',
  '  256K OK',
  '  512K OK',
  '  640K OK',
  '',
  'Detecting Devices...',
  '  Primary HDD    : MegaDisk 20MB  [OK]',
  '  Floppy Drive A : 5.25"  360KB   [OK]',
  '  Floppy Drive B : None           [--]',
  '  Video Card     : CGA 320x200    [OK]',
  '  Sound Card     : None           [--]',
  '  Serial Port    : COM1           [OK]',
  '',
  'BIOS Check Complete.',
  'Loading OS...',
  '',
];

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont('monospace');
  resetAll();
}

function draw() {
  background(0);

  noStroke();
  for (let i = 0; i < 30; i++) {
    let x = random(width);
    let y = random(height);
    fill(random(0, 30), random(0, 30), random(0, 20), random(40, 100));
    rect(x, y, random(1, 3), random(1, 3));
  }

  if (phase === 0) doBios();
  else if (phase === 1) doPressKey();
  else if (phase === 2) doTitle();
  else if (phase === 3) doInvaders();

  drawScanlines();
  t++;
}

// ★ 本体色を255フル不透明・明るい緑に。にじみは極薄に。
function blokyText(str, x, y, alpha) {
  let a = alpha === undefined ? 255 : alpha;
  fill(120, 255, 80, 30 * (a / 255));
  text(str, x - 1, y);
  text(str, x + 1, y);
  fill(200, 255, 140, a); // ★ より明るく
  text(str, x, y);
}

function blokyTextColor(str, x, y, r, g, b, alpha) {
  let a = alpha === undefined ? 255 : alpha;
  fill(r, g, b, 30 * (a / 255));
  text(str, x - 1, y);
  text(str, x + 1, y);
  fill(r, g, b, a);
  text(str, x, y);
}

function drawScanlines() {
  noStroke();
  for (let y = 0; y < height; y += 3) {
    fill(0, 0, 0, 70);
    rect(0, y, width, 1.5);
  }

  for (let i = 0; i < 150; i++) {
    let x = random(width);
    let y = random(height);
    fill(80, 200, 40, random(8, 20));
    ellipse(x, y, random(3, 8), random(1, 3));
  }

  let g = drawingContext.createRadialGradient(
    width/2, height/2, height * 0.25,
    width/2, height/2, height * 0.9
  );
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.80)');
  drawingContext.fillStyle = g;
  drawingContext.fillRect(0, 0, width, height);
}

function doBios() {
  biosTimer++;
  if (biosTimer % 10 === 0 && biosIdx < BIOS_TEXT.length) {
    biosLines.push(BIOS_TEXT[biosIdx]);
    biosIdx++;
  }

  // ★ フォントサイズを大きめに（X投稿での視認性向上）
  let fs = constrain(width * 0.028, 14, 22);
  let lh = fs * 1.55;
  let mx = width * 0.06;
  let my = height * 0.06;

  textSize(fs);
  textAlign(LEFT, TOP);

  for (let i = 0; i < biosLines.length; i++) {
    let line = biosLines[i];
    if (i === 0) {
      // ★ タイトル行：黄緑でくっきり
      blokyTextColor(line, mx, my + i * lh, 240, 255, 100, 255);
    } else if (line.includes('[OK]') || line.includes(' OK')) {
      blokyText(line, mx, my + i * lh);
    } else if (line.includes('[--]') || line.includes('None')) {
      // ★ 暗色行も少し明るく
      blokyTextColor(line, mx, my + i * lh, 120, 180, 80, 240);
    } else {
      blokyText(line, mx, my + i * lh);
    }
  }

  if (biosIdx >= BIOS_TEXT.length) {
    cursorBlink++;
    if (cursorBlink % 30 < 15) {
      blokyText('_', mx, my + biosLines.length * lh);
    }
    if (cursorBlink > 60) {
      phase = 1; t = 0; cursorBlink = 0;
    }
  }
}

function doPressKey() {
  let fs = constrain(width * 0.028, 14, 22);
  let lh = fs * 1.55;
  let mx = width * 0.06;
  let my = height * 0.06;

  textSize(fs);
  textAlign(LEFT, TOP);
  for (let i = 0; i < BIOS_TEXT.length; i++) {
    // ★ 残留テキストも少し明るく（暗くしすぎない）
    blokyTextColor(BIOS_TEXT[i], mx, my + i * lh, 100, 180, 60, 210);
  }

  cursorBlink++;
  let mfs = constrain(width * 0.034, 16, 26);
  textSize(mfs);
  textAlign(CENTER, CENTER);
  if (cursorBlink % 40 < 20) {
    blokyText('Press any key to continue...', width / 2, height * 0.82);
  }

  if (cursorBlink > 160) {
    phase = 2; t = 0; cursorBlink = 0; titleAlpha = 0;
    initInvaders();
  }
}

function doTitle() {
  titleAlpha = min(titleAlpha + 4, 255);
  background(0);

  let fs = constrain(width * 0.065, 28, 60);
  textAlign(CENTER, CENTER);
  textSize(fs);
  textStyle(BOLD);
  blokyText('INVADERS', width / 2, height * 0.28, titleAlpha);
  textStyle(NORMAL);

  textSize(fs * 0.38);
  blokyTextColor('--- SCORE ADVANCE TABLE ---', width / 2, height * 0.42, 100, 200, 60, titleAlpha);

  let types = [
    { shape: 2, pts: '= 30 PTS', y: 0.52 },
    { shape: 1, pts: '= 20 PTS', y: 0.62 },
    { shape: 0, pts: '= 10 PTS', y: 0.72 },
  ];
  for (let tp of types) {
    fill(120, 220, 70, titleAlpha);
    noStroke();
    drawInvaderShape(width / 2 - width * 0.1, height * tp.y, tp.shape, fs * 0.55);
    textSize(fs * 0.32);
    textAlign(LEFT, CENTER);
    blokyText(tp.pts, width / 2 - width * 0.04, height * tp.y, titleAlpha);
  }

  textAlign(CENTER, CENTER);
  textSize(fs * 0.3);
  if (t % 60 < 30) {
    blokyText('PRESS ANY KEY', width / 2, height * 0.88, titleAlpha);
  }

  if (t > 180) {
    phase = 3; t = 0;
    invaderDir = 1; invaderTimer = 0; bulletTimer = 0;
    bullets = [];
  }
}

function doInvaders() {
  background(0);

  // ★ DEMO/HI-SCOREを大きく・明るく・影付きで視認性アップ
  let fs = constrain(width * 0.032, 15, 26);
  textSize(fs);

  // 影（黒）を1px下にずらして輪郭を強調
  fill(0, 0, 0, 200);
  textAlign(LEFT, TOP);
  text('DEMO: 0000', width * 0.05 + 1, height * 0.03 + 1);
  textAlign(RIGHT, TOP);
  text('HI-SCORE: 9999', width * 0.95 + 1, height * 0.03 + 1);

  // ★ 本文：白に近い明るい緑でくっきり
  textAlign(LEFT, TOP);
  blokyTextColor('DEMO: 0000', width * 0.05, height * 0.03, 180, 255, 120, 255);
  textAlign(RIGHT, TOP);
  blokyTextColor('HI-SCORE: 9999', width * 0.95, height * 0.03, 255, 220, 80, 255);

  invaderTimer++;
  let speed = 60;
  if (invaderTimer % speed === 0) {
    let hitWall = false;
    for (let inv of invaders) {
      inv.x += invaderDir * width * 0.03;
      inv.frame = (inv.frame + 1) % 2;
      if (inv.x > width * 0.88 || inv.x < width * 0.08) hitWall = true;
    }
    if (hitWall) {
      invaderDir *= -1;
      for (let inv of invaders) inv.y += height * 0.04;
    }
  }

  let isz = constrain(width * 0.045, 18, 36);
  for (let inv of invaders) {
    fill(90, 200, 50);
    noStroke();
    drawInvaderShape(inv.x, inv.y, inv.type, isz, inv.frame);
  }

  fill(90, 200, 50);
  noStroke();
  drawPlayer(player.x, player.y, isz * 1.2);
  player.x += player.vx;
  if (player.x > width * 0.85) player.vx = -2;
  if (player.x < width * 0.15) player.vx = 2;

  bulletTimer++;
  if (bulletTimer % 55 === 0 && invaders.length > 0) {
    let shooter = invaders[floor(random(invaders.length))];
    bullets.push({ x: shooter.x, y: shooter.y, vy: 4, owner: 'inv' });
  }
  if (bulletTimer % 80 === 0) {
    bullets.push({ x: player.x, y: player.y - isz, vy: -6, owner: 'player' });
  }

  for (let i = bullets.length - 1; i >= 0; i--) {
    let b = bullets[i];
    b.y += b.vy;
    stroke(90, 200, 50);
    strokeWeight(2);
    if (b.owner === 'inv') {
      line(b.x, b.y, b.x + sin(b.y * 0.3) * 4, b.y + 8);
    } else {
      line(b.x, b.y, b.x, b.y + 10);
    }
    if (b.y < 0 || b.y > height) bullets.splice(i, 1);
  }

  stroke(60, 130, 30);
  strokeWeight(1);
  line(width * 0.04, height * 0.88, width * 0.96, height * 0.88);

  if (t > 400) {
    phase = 0; t = 0;
    resetAll();
  }
}

function drawInvaderShape(x, y, type, sz, frame) {
  push();
  translate(x, y);
  noStroke();

  if (type === 0) {
    let w = sz, h = sz * 0.8;
    rect(-w/2, -h/2, w, h * 0.5);
    rect(-w*0.3, -h/2 - h*0.3, w*0.6, h*0.3);
    let legOff = frame === 0 ? sz * 0.15 : -sz * 0.15;
    rect(-w/2, h*0.1, w*0.25, h*0.35 + legOff);
    rect(-w*0.1, h*0.1, w*0.25, h*0.35 - legOff);
    rect(w*0.25, h*0.1, w*0.25, h*0.35 + legOff);
  } else if (type === 1) {
    let w = sz, h = sz * 0.7;
    ellipse(0, 0, w, h);
    let antOff = frame === 0 ? sz * 0.1 : -sz * 0.1;
    line(-w*0.3, -h/2, -w*0.5, -h/2 - sz*0.3 + antOff);
    line(w*0.3, -h/2, w*0.5, -h/2 - sz*0.3 - antOff);
    fill(0);
    ellipse(-w*0.2, -h*0.1, sz*0.15, sz*0.15);
    ellipse(w*0.2, -h*0.1, sz*0.15, sz*0.15);
    fill(90, 200, 50);
  } else {
    let w = sz * 1.1, h = sz * 0.5;
    ellipse(0, 0, w, h);
    ellipse(0, -h*0.4, w*0.5, h*0.8);
    fill(0);
    for (let i = -1; i <= 1; i++) {
      ellipse(i * w * 0.25, 0, sz * 0.12, sz * 0.12);
    }
    fill(90, 200, 50);
  }
  pop();
}

function drawPlayer(x, y, sz) {
  push();
  translate(x, y);
  noStroke();
  rect(-sz/2, -sz*0.3, sz, sz*0.4);
  rect(-sz*0.1, -sz*0.7, sz*0.2, sz*0.4);
  pop();
}

function initInvaders() {
  invaders = [];
  let cols = 8, rows = 3;
  let sx = width * 0.15;
  let sy = height * 0.22;
  let gx = width * 0.09;
  let gy = height * 0.1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      invaders.push({
        x: sx + c * gx,
        y: sy + r * gy,
        type: r,
        frame: 0
      });
    }
  }
  player = { x: width / 2, y: height * 0.84, vx: 2 };
}

function resetAll() {
  biosLines = [];
  biosIdx = 0;
  biosTimer = 0;
  cursorBlink = 0;
  titleAlpha = 0;
  bullets = [];
  initInvaders();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}