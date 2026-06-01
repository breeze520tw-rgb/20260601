let creatures = [];
let missiles = [];
let explosions = [];
const palette = ['#f8959b', '#fbc273', '#afd7ef', '#eed5c1', '#faf2ea'];
let lastSpawnTime = 0;
let score = 0;
let gameState = 'playing'; // 'playing' 或 'gameover'
let gameDuration = 30; // 遊戲總時間
let startTime;

function setup() {
  createCanvas(windowWidth, windowHeight);
  resetGame();
}

function draw() {
  background(0); // 背景顏色為黑色

  if (gameState === 'playing') {
    runGame();
  } else {
    showGameOver();
  }
}

function resetGame() {
  creatures = [];
  missiles = [];
  explosions = [];
  score = 0;
  gameState = 'playing';
  startTime = millis();
  lastSpawnTime = millis();
  // 初始產生 10 個物件
  for (let i = 0; i < 10; i++) {
    spawnCreature();
  }
}

function runGame() {
  let elapsedTime = (millis() - startTime) / 1000;
  let remainingTime = max(0, ceil(gameDuration - elapsedTime));

  // 每隔 5 秒產生一個物件，或當畫面沒有物件時立即產生，避免畫面空白
  if (millis() - lastSpawnTime > 5000 || creatures.length === 0) {
    spawnCreature();
    lastSpawnTime = millis();
  }

  // 更新與顯示粒子 (Creatures)
  for (let i = creatures.length - 1; i >= 0; i--) {
    let c = creatures[i];
    c.update();
    c.display();

    // 檢查與飛彈的碰撞
    for (let j = missiles.length - 1; j >= 0; j--) {
      let m = missiles[j];
      let d = dist(c.pos.x, c.pos.y, m.pos.x, m.pos.y);
      if (d < c.r + 5) {
        // 產生爆炸
        explosions.push(new Explosion(c.pos.x, c.pos.y, c.color));
        // 移除物件與飛彈
        creatures.splice(i, 1);
        missiles.splice(j, 1);
        score += 10;
        break; 
      }
    }
  }

  // 更新與顯示飛彈
  for (let i = missiles.length - 1; i >= 0; i--) {
    missiles[i].update();
    missiles[i].display();
    if (missiles[i].isOffScreen()) {
      missiles.splice(i, 1);
    }
  }

  // 更新與顯示爆炸特效
  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].update();
    explosions[i].display();
    if (explosions[i].isDead()) {
      explosions.splice(i, 1);
    }
  }

  // 繪製畫布中間的旋轉指標
  drawPointer();

  // 顯示分數與時間
  drawUI(remainingTime);

  // 檢查遊戲是否結束
  if (remainingTime <= 0) {
    gameState = 'gameover';
  }
}

function drawUI(timeLeft) {
  fill(255);
  noStroke();
  textSize(24);
  
  // 左上角分數
  textAlign(LEFT, TOP);
  text("Score: " + score, 20, 20);
  
  // 右上角時間
  textAlign(RIGHT, TOP);
  text("Time: " + timeLeft + "s", width - 20, 20);
}

function showGameOver() {
  push();
  fill(0, 150);
  rect(0, 0, width, height);
  
  textAlign(CENTER, CENTER);
  fill(255);
  textSize(64);
  text("GAME OVER", width / 2, height / 2 - 50);
  textSize(32);
  text("Final Score: " + score, width / 2, height / 2 + 10);
  
  // 繪製再玩一次按鈕
  fill(255);
  rectMode(CENTER);
  rect(width / 2, height / 2 + 80, 200, 50, 10);
  fill(0);
  text("PLAY AGAIN", width / 2, height / 2 + 80);
  pop();
}

function drawPointer() {
  push();
  translate(width / 2, height / 2);
  let angle = atan2(mouseY - height / 2, mouseX - width / 2);
  rotate(angle);
  fill(255);
  noStroke();
  // 繪製長方形（箭身）
  rect(0, -5, 30, 10);
  // 繪製三角形（箭頭）
  triangle(30, -12, 52, 0, 30, 12);
  pop();
}

function spawnCreature() {
  let r = random(50, 100);
  let x = random(r, width - r);
  let y = random(r, height - r);
  let col = color(random(palette));
  creatures.push(new Creature(x, y, r, col));
}

function mousePressed() {
  if (gameState === 'playing') {
    if (mouseButton === LEFT) {
      let angle = atan2(mouseY - height / 2, mouseX - width / 2);
      let m = new Missile(width / 2, height / 2, angle);
      missiles.push(m);
    }
  } else if (gameState === 'gameover') {
    // 檢查是否點擊重新開始按鈕 (按鈕範圍: width/2 +/- 100, height/2 + 80 +/- 25)
    if (mouseX > width / 2 - 100 && mouseX < width / 2 + 100 &&
        mouseY > height / 2 + 55 && mouseY < height / 2 + 105) {
      resetGame();
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

class Creature {
  constructor(x, y, r, col) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(random(0.5, 4)); // 移動速度不一樣
    this.r = r;
    this.color = col;
    this.petalCount = 10; // 星狀圓弧的瓣數
  }

  update() {
    this.pos.add(this.vel);

    // 邊界碰撞檢查
    if (this.pos.x < this.r || this.pos.x > width - this.r) this.vel.x *= -1;
    if (this.pos.y < this.r || this.pos.y > height - this.r) this.vel.y *= -1;
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);
    
    let d = dist(mouseX, mouseY, this.pos.x, this.pos.y);
    fill(this.color);
    noStroke();

    if (d < this.r * 2) {
      // 滑鼠靠近時變為圓圈
      ellipse(0, 0, this.r * 2);
    } else {
      // 繪製星狀圓弧外表
      beginShape();
      for (let a = 0; a < TWO_PI; a += 0.1) {
        let offset = map(sin(a * this.petalCount), -1, 1, -5, 5);
        let currR = this.r + offset;
        let x = currR * cos(a);
        let y = currR * sin(a);
        vertex(x, y);
      }
      endShape(CLOSE);
    }

    // 繪製眼睛（白色）
    fill(255);
    let eyeDist = this.r * 0.4;
    let eyeSize = this.r * 0.35;
    ellipse(-eyeDist, -this.r * 0.2, eyeSize, eyeSize);
    ellipse(eyeDist, -this.r * 0.2, eyeSize, eyeSize);

    // 繪製眼珠（黑色，隨滑鼠方向移動）
    fill(0);
    let pupilSize = eyeSize * 0.5;
    this.drawPupil(-eyeDist, -this.r * 0.2, pupilSize);
    this.drawPupil(eyeDist, -this.r * 0.2, pupilSize);

    // 繪製圓弧笑嘴
    noFill();
    stroke(0);
    strokeWeight(2);
    arc(0, this.r * 0.2, this.r * 0.6, this.r * 0.4, 0, PI);

    pop();
  }

  drawPupil(ex, ey, pSize) {
    // 計算相對於眼睛中心的滑鼠向量
    let angle = atan2(mouseY - (this.pos.y + ey), mouseX - (this.pos.x + ex));
    let maxOffset = pSize * 0.5;
    let px = ex + cos(angle) * maxOffset;
    let py = ey + sin(angle) * maxOffset;
    noStroke();
    ellipse(px, py, pSize, pSize);
  }
}

class Missile {
  constructor(x, y, angle) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.fromAngle(angle).mult(7);
  }

  update() {
    this.pos.add(this.vel);
  }

  display() {
    push();
    fill('#fec3a6');
    noStroke();
    ellipse(this.pos.x, this.pos.y, 10, 10);
    pop();
  }

  isOffScreen() {
    return (this.pos.x < 0 || this.pos.x > width || this.pos.y < 0 || this.pos.y > height);
  }
}

class Explosion {
  constructor(x, y, col) {
    this.pos = createVector(x, y);
    this.particles = [];
    this.lifespan = 255;
    for (let i = 0; i < 15; i++) {
      this.particles.push({
        v: p5.Vector.random2D().mult(random(1, 5)),
        p: createVector(0, 0),
        angle: random(TWO_PI),
        rotSpeed: random(-0.1, 0.1)
      });
    }
    this.color = col;
  }

  update() {
    this.lifespan -= 10;
    for (let p of this.particles) {
      p.p.add(p.v);
      p.angle += p.rotSpeed;
    }
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);
    fill(this.color.levels[0], this.color.levels[1], this.color.levels[2], this.lifespan);
    noStroke();
    for (let p of this.particles) {
      this.drawStar(p.p.x, p.p.y, 3, 8, 5, p.angle);
    }
    pop();
  }

  // 繪製五芒星的輔助函式
  drawStar(x, y, radius1, radius2, npoints, rotAngle) {
    let angle = TWO_PI / npoints;
    let halfAngle = angle / 2.0;
    beginShape();
    for (let a = rotAngle; a < TWO_PI + rotAngle; a += angle) {
      let sx = x + cos(a) * radius2;
      let sy = y + sin(a) * radius2;
      vertex(sx, sy);
      let sx2 = x + cos(a + halfAngle) * radius1;
      let sy2 = y + sin(a + halfAngle) * radius1;
      vertex(sx2, sy2);
    }
    endShape(CLOSE);
  }

  isDead() {
    return this.lifespan <= 0;
  }
}
