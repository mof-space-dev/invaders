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

// 背景色チェンジ用の変数
let bgPalette = [];
let bgColIndex = 0;
let bgNextColIndex = 1;
let bgLerpFactor = 0;

// ネオンカラーパレット
const COLOR_CYAN    = [0, 243, 255];
const COLOR_MAGENTA = [255, 0, 127];
const COLOR_YELLOW  = [255, 211, 0];
const COLOR_GREEN   = [57, 255, 20];
const COLOR_PURPLE  = [189, 0, 255];

const BIOS_TEXT = [
  'RETRO-BIOS v2.1  (C) 1983? MofSoft Corp.',
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
  '  Primary HDD     : MegaDisk 20MB  [OK]',
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
  
  bgPalette = [
    color(20, 40, 90),   // 鮮やかなエレクトリックブルー
    color(70, 20, 80),   // サイバーネオンパープル
    color(80, 20, 40),   // アシッドマゼンタ
    color(15, 60, 60)    // 鮮烈なサイバーティール
  ];
  
  resetAll();
}

function draw() {
  // ★ ぶっ壊れ演出のための画面ブレ（シェイク）処理
  let offsetX = 0;
  let offsetY = 0;
  
  // PHASE 3以外で、ランダムに強い画面シェイクを発生させる
  if (phase < 3 && random(100) < 4) {
    offsetX = random(-8, 8);
    offsetY = random(-5, 5);
  }
  
  // 画面全体をブレさせる
  push();
  translate(offsetX, offsetY);

  // 背景ベース色の決定
  if (phase === 3) {
    updateBgColor();
  } else {
    // PHASE 3以外は基本ダーク、ただし稀にグリッチで背景が一瞬フラッシュする
    if (random(100) < 1.5) {
      background(random(40, 80), 10, random(40, 80)); // 壊れたシグナル風フラッシュ
    } else {
      background(10, 10, 20);
    }
  }

  // ★ ざらつき（グレインノイズ）のエフェクト
  push();
  blendMode(ADD); 
  strokeWeight(1);
  // PHASE 3より前はノイズ密度をさらに上げて「壊れかけ」感を強調
  let densityMultiplier = (phase < 3) ? 0.0015 : 0.0006;
  let noiseDensity = constrain(floor((width * height) * densityMultiplier), 150, 1200);
  
  for (let i = 0; i < noiseDensity; i++) {
    let x = random(width);
    let y = random(height);
    if (phase < 3) {
      // PHASE 3前はRGBがバラバラにバグったカラフルなデジタル砂嵐
      stroke(random(100, 255), random(50, 200), random(150, 255), random(25, 70));
    } else {
      // PHASE 3は上品で馴染むノイズ
      stroke(random(60, 120), random(60, 120), random(80, 160), random(20, 50));
    }
    point(x, y);
  }
  pop();

  // ★ PHASE 3までの限定エフェクト：水平方向の巨大なグリッチノイズバー
  if (phase < 3 && random(100) < 8) {
    push();
    blendMode(SCREEN);
    noStroke();
    fill(random(COLOR_MAGENTA), random(COLOR_CYAN), random(255), random(40, 90));
    let barY = random(height);
    let barH = random(5, 40);
    rect(0, barY, width, barH);
    pop();
  }

  // 各フェーズのメイン描画
  if (phase === 0) doBios();
  else if (phase === 1) doPressKey();
  else if (phase === 2) doTitle();
  else if (phase === 3) doInvaders();

  drawScanlines();
  
  pop(); // 画面ブレ（translate）の終了
  t++;
}

// 背景色をじんわり更新する関数
function updateBgColor() {
  bgLerpFactor += 0.015; 
  
  if (bgLerpFactor >= 1) {
    bgLerpFactor = 0;
    bgColIndex = bgNextColIndex;
    bgNextColIndex = (bgNextColIndex + 1) % bgPalette.length;
  }
  
  let currentBg = lerpColor(bgPalette[bgColIndex], bgPalette[bgNextColIndex], bgLerpFactor);
  background(currentBg);
}

// 発光（グロー）エフェクト付きテキスト
function neonText(str, x, y, r, g, b, alpha = 255, glowSize = 10) {
  push();
  // ★ PHASE 3前はテキスト自体も稀にバグらせる（文字を横に引き伸ばす）
  if (phase < 3 && random(100) < 0.5) {
    translate(random(-15, 15), 0);
  }
  drawingContext.shadowBlur = glowSize;
  drawingContext.shadowColor = `rgba(${r}, ${g}, ${b}, ${alpha / 255})`;
  fill(r, g, b, alpha);
  text(str, x, y);
  pop();
}

function drawScanlines() {
  noStroke();
  for (let y = 0; y < height; y += 4) {
    fill(0, 0, 0, (phase < 3) ? 85 : 65); // PHASE 3前は走査線を濃くしてCRTの故障感を演出
    rect(0, y, width, 1.8);
  }

  let g = drawingContext.createRadialGradient(
    width/2, height/2, height * 0.2,
    width/2, height/2, height * 1.0
  );
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.6, 'rgba(0, 0, 0, 0.1)'); 
  g.addColorStop(1, 'rgba(0,0,0,0.95)'); 
  drawingContext.fillStyle = g;
  drawingContext.fillRect(0, 0, width, height);
}

function doBios() {
  // グッチ感を出すためにタイマーをたまに狂わせる
  if (random(100) < 5) biosTimer += 2;
  else biosTimer++;
  
  if (biosTimer % 8 === 0 && biosIdx < BIOS_TEXT.length) {
    biosLines.push(BIOS_TEXT[biosIdx]);
    biosIdx++;
  }

  let fs = constrain(width * 0.025, 14, 20);
  let lh = fs * 1.5;
  let mx = width * 0.08;
  let my = height * 0.08;

  textSize(fs);
  textAlign(LEFT, TOP);

  for (let i = 0; i < biosLines.length; i++) {
    let line = biosLines[i];
    // ★ 稀に1行だけ文字を激しく明滅させるバグ
    let currentAlpha = (phase < 3 && random(100) < 2) ? random(50, 100) : 255;
    
    if (i === 0) {
      neonText(line, mx, my + i * lh, ...COLOR_CYAN, currentAlpha, 8);
    } else if (line.includes('[OK]') || line.includes(' OK')) {
      neonText(line, mx, my + i * lh, ...COLOR_GREEN, currentAlpha - 35, 4);
    } else if (line.includes('[--]') || line.includes('None')) {
      neonText(line, mx, my + i * lh, ...COLOR_MAGENTA, currentAlpha - 105, 0);
    } else {
      neonText(line, mx, my + i * lh, 200, 220, 255, currentAlpha - 55, 0);
    }
  }

  if (biosIdx >= BIOS_TEXT.length) {
    cursorBlink++;
    if (cursorBlink % 30 < 15) {
      neonText('_', mx, my + biosLines.length * lh, ...COLOR_GREEN);
    }
    if (cursorBlink > 45) {
      phase = 1; t = 0; cursorBlink = 0;
    }
  }
}

function doPressKey() {
  let fs = constrain(width * 0.025, 14, 20);
  let lh = fs * 1.5;
  let mx = width * 0.08;
  let my = height * 0.08;

  textSize(fs);
  textAlign(LEFT, TOP);
  for (let i = 0; i < BIOS_TEXT.length; i++) {
    neonText(BIOS_TEXT[i], mx, my + i * lh, 100, 120, 150, 100, 0);
  }

  cursorBlink++;
  let mfs = constrain(width * 0.03, 16, 24);
  textSize(mfs);
  textAlign(CENTER, CENTER);
  if (cursorBlink % 40 < 20) {
    neonText('PRESS ANY KEY TO SYSTEM BOOT', width / 2, height * 0.85, ...COLOR_CYAN, 255, 12);
  }

  if (cursorBlink > 120) {
    phase = 2; t = 0; cursorBlink = 0; titleAlpha = 0;
    initInvaders();
  }
}

function doTitle() {
  titleAlpha = min(titleAlpha + 5, 255);

  let fs = constrain(width * 0.07, 32, 70);
  textAlign(CENTER, CENTER);
  textSize(fs);
  textStyle(BOLD);
  
  // ★ タイトル文字も微妙にRGBがズレるようなグリッチをたまに入れる
  let titleX = width / 2;
  if (random(100) < 3) titleX += random(-10, 10);
  
  neonText('I N V A D E R S', titleX, height * 0.28, ...COLOR_MAGENTA, titleAlpha, 20);
  textStyle(NORMAL);

  textSize(fs * 0.35);
  neonText('== NEON GALAXIAN TABLE ==', width / 2, height * 0.42, ...COLOR_CYAN, titleAlpha, 10);

  let types = [
    { shape: 2, pts: '= 30 PTS', y: 0.52, col: COLOR_CYAN },
    { shape: 1, pts: '= 20 PTS', y: 0.62, col: COLOR_MAGENTA },
    { shape: 0, pts: '= 10 PTS', y: 0.72, col: COLOR_YELLOW },
  ];
  for (let tp of types) {
    push();
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = `rgba(${tp.col[0]}, ${tp.col[1]}, ${tp.col[2]}, ${titleAlpha / 255})`;
    fill(...tp.col, titleAlpha);
    // 敵のデモもたまに座標をバグらせる
    let enemyX = width / 2 - width * 0.1;
    if (random(100) < 2) enemyX += random(-5, 5);
    drawInvaderShape(enemyX, height * tp.y, tp.shape, fs * 0.5, 0, tp.col);
    pop();

    textSize(fs * 0.3);
    textAlign(LEFT, CENTER);
    neonText(tp.pts, width / 2 - width * 0.03, height * tp.y, 255, 255, 255, titleAlpha, 5);
  }

  textAlign(CENTER, CENTER);
  textSize(fs * 0.28);
  if (t % 60 < 30) {
    neonText('INSERT COIN TO PLAY', width / 2, height * 0.88, ...COLOR_YELLOW, titleAlpha, 10);
  }

  if (t > 150) {
    phase = 3; t = 0;
    invaderDir = 1; invaderTimer = 0; bulletTimer = 0;
    bullets = [];
    bgColIndex = 0;
    bgNextColIndex = 1;
    bgLerpFactor = 0;
  }
}

function doInvaders() {
  let fs = constrain(width * 0.025, 14, 22);
  textSize(fs);
  textAlign(LEFT, TOP);
  neonText('SCORE: 01,420', width * 0.06, height * 0.04, ...COLOR_CYAN, 255, 8);
  textAlign(RIGHT, TOP);
  neonText('HI-SCORE: 99,990', width * 0.94, height * 0.04, ...COLOR_MAGENTA, 255, 8);

  invaderTimer++;
  let speed = 45;
  if (invaderTimer % speed === 0) {
    let hitWall = false;
    for (let inv of invaders) {
      inv.x += invaderDir * width * 0.025;
      inv.frame = (inv.frame + 1) % 2;
      if (inv.x > width * 0.9 || inv.x < width * 0.1) hitWall = true;
    }
    if (hitWall) {
      invaderDir *= -1;
      for (let inv of invaders) inv.y += height * 0.035;
    }
  }

  let isz = constrain(width * 0.04, 18, 32);
  for (let inv of invaders) {
    let col = COLOR_CYAN;
    if (inv.type === 1) col = COLOR_MAGENTA;
    if (inv.type === 2) col = COLOR_YELLOW;

    push();
    drawingContext.shadowBlur = 12;
    drawingContext.shadowColor = `rgba(${col[0]}, ${col[1]}, ${col[2]}, 0.8)`;
    fill(...col);
    drawInvaderShape(inv.x, inv.y, inv.type, isz, inv.frame, col);
    pop();
  }

  push();
  drawingContext.shadowBlur = 15;
  drawingContext.shadowColor = `rgba(${COLOR_GREEN[0]}, ${COLOR_GREEN[1]}, ${COLOR_GREEN[2]}, 0.8)`;
  fill(...COLOR_GREEN);
  drawPlayer(player.x, player.y, isz * 1.2);
  pop();

  player.x += player.vx;
  if (player.x > width * 0.88) player.vx = -2.5;
  if (player.x < width * 0.12) player.vx = 2.5;

  bulletTimer++;
  if (bulletTimer % 40 === 0 && invaders.length > 0) {
    let shooter = invaders[floor(random(invaders.length))];
    bullets.push({ x: shooter.x, y: shooter.y, vy: 5, owner: 'inv' });
  }
  if (bulletTimer % 60 === 0) {
    bullets.push({ x: player.x, y: player.y - isz, vy: -8, owner: 'player' });
  }

  for (let i = bullets.length - 1; i >= 0; i--) {
    let b = bullets[i];
    b.y += b.vy;

    push();
    if (b.owner === 'inv') {
      drawingContext.shadowBlur = 10;
      drawingContext.shadowColor = `rgba(${COLOR_MAGENTA[0]}, ${COLOR_MAGENTA[1]}, ${COLOR_MAGENTA[2]}, 0.8)`;
      stroke(...COLOR_MAGENTA);
      strokeWeight(2.5);
      let wave = sin(b.y * 0.2) * 5;
      line(b.x + wave, b.y, b.x + wave, b.y + 12);
    } else {
      drawingContext.shadowBlur = 12;
      drawingContext.shadowColor = `rgba(${COLOR_GREEN[0]}, ${COLOR_GREEN[1]}, ${COLOR_GREEN[2]}, 0.9)`;
      stroke(220, 255, 220);
      strokeWeight(3);
      line(b.x, b.y, b.x, b.y + 14);
    }
    pop();

    if (b.y < 0 || b.y > height) bullets.splice(i, 1);
  }

  push();
  drawingContext.shadowBlur = 8;
  drawingContext.shadowColor = `rgba(${COLOR_PURPLE[0]}, ${COLOR_PURPLE[1]}, ${COLOR_PURPLE[2]}, 0.6)`;
  stroke(...COLOR_PURPLE);
  strokeWeight(2);
  line(width * 0.05, height * 0.9, width * 0.95, height * 0.9);
  pop();

  if (t > 450) { 
    phase = 0; t = 0;
    resetAll();
  }
}

function drawInvaderShape(x, y, type, sz, frame, col) {
  push();
  translate(x, y);
  noStroke();

  if (type === 0) {
    rect(-sz*0.5, -sz*0.3, sz, sz*0.5, 2);
    rect(-sz*0.2, -sz*0.5, sz*0.4, sz*0.2);
    let leg = frame === 0 ? sz*0.2 : sz*0.1;
    rect(-sz*0.4, sz*0.2, sz*0.2, leg);
    rect(sz*0.2, sz*0.2, sz*0.2, leg);
    fill(0, 0, 10, 120); 
    rect(-sz*0.25, -sz*0.1, sz*0.15, sz*0.1);
    rect(sz*0.1, -sz*0.1, sz*0.15, sz*0.1);
  } else if (type === 1) {
    ellipse(0, 0, sz*1.1, sz*0.7);
    let ant = frame === 0 ? sz*0.2 : sz*0.3;
    stroke(...col);
    strokeWeight(2);
    line(-sz*0.3, -sz*0.2, -sz*0.4, -ant);
    line(sz*0.3, -sz*0.2, sz*0.4, -ant);
    noStroke();
    fill(0, 0, 10, 120);
    ellipse(-sz*0.2, 0, sz*0.15, sz*0.15);
    ellipse(sz*0.2, 0, sz*0.15, sz*0.15);
  } else {
    rect(-sz*0.6, -sz*0.2, sz*1.2, sz*0.4, 4);
    rect(-sz*0.3, -sz*0.4, sz*0.6, sz*0.2);
    fill(0, 0, 10, 120);
    for (let i = -1; i <= 1; i += 2) {
      rect(i * sz * 0.25 - sz*0.05, -sz*0.1, sz*0.1, sz*0.2);
    }
  }
  pop();
}

function drawPlayer(x, y, sz) {
  push();
  translate(x, y);
  noStroke();
  triangle(-sz*0.6, sz*0.3, 0, -sz*0.5, sz*0.6, sz*0.3);
  fill(255, 255, 255);
  triangle(-sz*0.15, sz*0.1, 0, -sz*0.4, sz*0.15, sz*0.1);
  fill(...COLOR_GREEN);
  rect(-sz*0.4, -sz*0.1, sz*0.1, sz*0.3);
  rect(sz*0.3, -sz*0.1, sz*0.1, sz*0.3);
  pop();
}

function initInvaders() {
  invaders = [];
  let cols = 8, rows = 3;
  let sx = width * 0.18;
  let sy = height * 0.24;
  let gx = width * 0.09;
  let gy = height * 0.09;
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
  player = { x: width / 2, y: height * 0.82, vx: 2.5 };
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
