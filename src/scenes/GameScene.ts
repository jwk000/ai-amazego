import Phaser from "phaser";
import { directionVector, isInsideBounds } from "../core/grid";
import type { ArrowLine, GridPoint } from "../core/types";
import { GameState } from "../gameplay/GameState";
import { advanceLineOneGrid, evaluateMove, isLineOutside } from "../gameplay/MoveEvaluator";
import { calculateStars } from "../gameplay/ScoreCalculator";
import { recordWin } from "../gameplay/SaveData";
import { generateLevel } from "../level/LevelGenerator";
import { getEscapableLines } from "../level/LevelSolver";

const DESIGN_WIDTH = 1080;
const DESIGN_HEIGHT = 1920;
const LINE_COLORS = [0x765943, 0xe58b72, 0x5f9e92, 0x7c73b5, 0xd49b35, 0x4d87bd];

export class GameScene extends Phaser.Scene {
  private levelNumber = 1;
  private state!: GameState;
  private boardGraphics!: Phaser.GameObjects.Graphics;
  private lineGraphics = new Map<string, Phaser.GameObjects.Graphics>();
  private hitAreas = new Map<string, Phaser.GameObjects.Zone>();
  private levelText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private remainingText!: Phaser.GameObjects.Text;
  private waterDrops: Phaser.GameObjects.Container[] = [];
  private hintButton!: Phaser.GameObjects.Container;
  private boardOrigin = new Phaser.Math.Vector2();
  private cellSize = 52;
  private busy = false;
  private overlay?: Phaser.GameObjects.Container;
  private timerEvent?: Phaser.Time.TimerEvent;

  constructor() {
    super("game");
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#f6eddc");
    this.createPaperBackground();
    this.createHeader();
    this.startLevel(1);
  }

  private createPaperBackground(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(0xf7eedc, 1);
    graphics.fillRoundedRect(22, 22, DESIGN_WIDTH - 44, DESIGN_HEIGHT - 44, 42);
    graphics.lineStyle(3, 0xd5bd91, 0.6);
    graphics.strokeRoundedRect(22, 22, DESIGN_WIDTH - 44, DESIGN_HEIGHT - 44, 42);

    const random = new Phaser.Math.RandomDataGenerator(["paper"]);
    graphics.fillStyle(0x9d7d55, 0.035);
    for (let index = 0; index < 700; index += 1) {
      graphics.fillCircle(random.between(30, 1050), random.between(30, 1890), random.realInRange(0.6, 1.6));
    }
  }

  private createHeader(): void {
    this.add.text(72, 94, "‹", {
      fontFamily: "Arial Rounded MT Bold, sans-serif",
      fontSize: "92px",
      color: "#715743",
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.levelText = this.add.text(DESIGN_WIDTH / 2, 96, "关卡 1", {
      fontFamily: "Arial Rounded MT Bold, PingFang SC, sans-serif",
      fontSize: "56px",
      fontStyle: "bold",
      color: "#cf8a19",
    }).setOrigin(0.5);

    const settings = this.add.container(982, 96);
    const gear = this.add.graphics();
    gear.lineStyle(8, 0x715743, 1);
    gear.strokeCircle(0, 0, 34);
    gear.strokeCircle(0, 0, 12);
    settings.add(gear).setSize(88, 88).setInteractive({ useHandCursor: true });

    const divider = this.add.graphics();
    divider.lineStyle(4, 0xdac7a2, 1);
    divider.lineBetween(52, 184, 1028, 184);

    this.timerText = this.add.text(540, 255, "00:00", {
      fontFamily: "Arial Rounded MT Bold, sans-serif",
      fontSize: "35px",
      color: "#8b715a",
    }).setOrigin(0.5);

    this.remainingText = this.add.text(940, 255, "剩余 0", {
      fontFamily: "PingFang SC, sans-serif",
      fontSize: "31px",
      color: "#8b715a",
    }).setOrigin(1, 0.5);
  }

  private startLevel(levelNumber: number): void {
    this.levelNumber = Math.max(1, levelNumber);
    this.clearLevelObjects();
    const level = generateLevel(this.levelNumber);
    this.state = new GameState(level);
    this.levelText.setText(`关卡 ${this.levelNumber}`);
    this.fitBoard();
    this.createWaterHud();
    this.drawBoard();
    this.createLineObjects();
    this.createTools();
    this.refreshHud();
    this.state.resetTimer();
    this.timerEvent = this.time.addEvent({
      delay: 250,
      loop: true,
      callback: () => {
        if (this.busy || this.overlay) return;
        this.state.updateTimer();
        this.timerText.setText(this.formatTime(this.state.elapsedSeconds));
      },
    });
  }

  private clearLevelObjects(): void {
    this.timerEvent?.destroy();
    this.overlay?.destroy();
    this.overlay = undefined;
    this.boardGraphics?.destroy();
    this.lineGraphics.forEach((graphics) => graphics.destroy());
    this.hitAreas.forEach((zone) => zone.destroy());
    this.lineGraphics.clear();
    this.hitAreas.clear();
    this.waterDrops.forEach((drop) => drop.destroy());
    this.waterDrops = [];
    this.hintButton?.destroy();
    this.children.list.filter((child) => child.getData("level-tool")).forEach((child) => child.destroy());
    this.busy = false;
  }

  private fitBoard(): void {
    const board = this.state.level.board;
    const availableWidth = 900;
    const availableHeight = 1120;
    this.cellSize = Math.floor(Math.min(64, availableWidth / Math.max(1, board.width - 1), availableHeight / Math.max(1, board.height - 1)));
    this.cellSize = Math.max(38, this.cellSize);
    const boardWidth = (board.width - 1) * this.cellSize;
    const boardHeight = (board.height - 1) * this.cellSize;
    this.boardOrigin.set((DESIGN_WIDTH - boardWidth) / 2, 360 + (availableHeight - boardHeight) / 2);
  }

  private createWaterHud(): void {
    for (let index = 0; index < 3; index += 1) {
      const container = this.add.container(95 + index * 78, 255);
      const drop = this.add.graphics();
      drop.fillStyle(0x4ca7ea, 1);
      drop.fillCircle(0, 12, 25);
      drop.fillTriangle(0, -34, -22, 7, 22, 7);
      const shine = this.add.graphics();
      shine.fillStyle(0xffffff, 0.55);
      shine.fillCircle(-9, 2, 5);
      container.add([drop, shine]);
      this.waterDrops.push(container);
    }
  }

  private drawBoard(): void {
    this.boardGraphics = this.add.graphics();
    for (const key of this.state.level.board.cells) {
      const [x, y] = key.split(",").map(Number);
      const world = this.toWorld({ x, y });
      this.boardGraphics.fillStyle(0xbba787, 0.28);
      this.boardGraphics.fillCircle(world.x, world.y, Math.max(2.5, this.cellSize * 0.065));
    }
  }

  private createLineObjects(): void {
    for (const line of this.state.lines) {
      const graphics = this.add.graphics();
      graphics.setData("line-id", line.id);
      this.lineGraphics.set(line.id, graphics);
      this.redrawLine(line);

      const zone = this.add.zone(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT).setOrigin(0);
      zone.setInteractive(new Phaser.Geom.Rectangle(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT), (_area, x, y) =>
        this.distanceToLine(line, x, y) <= Math.max(24, this.cellSize * 0.42));
      zone.on("pointerdown", () => this.handleLineTap(line.id));
      this.hitAreas.set(line.id, zone);
    }
  }

  private redrawLine(line: ArrowLine, offset = new Phaser.Math.Vector2()): void {
    const graphics = this.lineGraphics.get(line.id);
    if (!graphics) return;
    graphics.clear();
    const visible = line.points.filter((point) => isInsideBounds(point, this.state.level.board.width, this.state.level.board.height));
    if (visible.length === 0) return;

    const color = line.color || LINE_COLORS[0];
    const width = Math.max(8, this.cellSize * 0.16);
    graphics.lineStyle(width + 6, 0xffffff, 0.38);
    this.strokeVisiblePath(graphics, line.points, offset);
    graphics.lineStyle(width, color, 1);
    this.strokeVisiblePath(graphics, line.points, offset);

    const head = line.points[0];
    if (isInsideBounds(head, this.state.level.board.width, this.state.level.board.height)) {
      const world = this.toWorld(head).add(offset);
      this.drawArrowHead(graphics, world.x, world.y, line.direction, color);
    }
  }

  private strokeVisiblePath(graphics: Phaser.GameObjects.Graphics, points: readonly GridPoint[], offset: Phaser.Math.Vector2): void {
    let drawing = false;
    for (const point of points) {
      const inside = isInsideBounds(point, this.state.level.board.width, this.state.level.board.height);
      if (!inside) {
        drawing = false;
        continue;
      }
      const world = this.toWorld(point).add(offset);
      if (!drawing) {
        graphics.beginPath();
        graphics.moveTo(world.x, world.y);
        drawing = true;
      } else {
        graphics.lineTo(world.x, world.y);
      }
    }
    if (drawing) graphics.strokePath();
  }

  private drawArrowHead(graphics: Phaser.GameObjects.Graphics, x: number, y: number, direction: ArrowLine["direction"], color: number): void {
    const vector = directionVector(direction);
    const size = this.cellSize * 0.31;
    const sideX = -vector.y;
    const sideY = vector.x;
    const tipX = x + vector.x * size;
    const tipY = y + vector.y * size;
    const backX = x - vector.x * size * 0.55;
    const backY = y - vector.y * size * 0.55;
    graphics.fillStyle(color, 1);
    graphics.fillTriangle(
      tipX, tipY,
      backX + sideX * size * 0.68, backY + sideY * size * 0.68,
      backX - sideX * size * 0.68, backY - sideY * size * 0.68,
    );
  }

  private async handleLineTap(lineId: string): Promise<void> {
    if (this.busy || this.overlay) return;
    const line = this.state.lines.find((candidate) => candidate.id === lineId);
    if (!line) return;
    const result = evaluateMove(line, this.state.lines, this.state.level.board.width, this.state.level.board.height);
    this.busy = true;

    if (result.canEscape) {
      await this.animateEscape(line);
      this.state.removeLine(line.id);
      this.lineGraphics.get(line.id)?.destroy();
      this.hitAreas.get(line.id)?.destroy();
      this.lineGraphics.delete(line.id);
      this.hitAreas.delete(line.id);
      this.refreshHud();
      this.busy = false;
      if (this.state.lines.length === 0) this.showVictory();
    } else {
      await this.animateBlocked(line, result.blockerPoint, result.blockerId);
      this.state.loseWater();
      this.refreshHud();
      this.busy = false;
      if (this.state.water === 0) this.showFailure();
    }
  }

  private async animateEscape(line: ArrowLine): Promise<void> {
    const maxFrames = line.points.length + this.state.level.board.width + this.state.level.board.height + 4;
    for (let frame = 0; frame < maxFrames; frame += 1) {
      advanceLineOneGrid(line);
      this.redrawLine(line);
      if (isLineOutside(line, this.state.level.board.width, this.state.level.board.height)) break;
      await this.delay(Math.max(48, 88 - this.levelNumber));
    }
  }

  private async animateBlocked(line: ArrowLine, blockerPoint: GridPoint, blockerId: string): Promise<void> {
    const vector = directionVector(line.direction);
    const offset = new Phaser.Math.Vector2(vector.x * this.cellSize * 0.22, vector.y * this.cellSize * 0.22);
    this.redrawLine(line, offset);
    this.highlightBlocker(blockerPoint, blockerId);
    this.cameras.main.shake(120, 0.0025);
    await this.delay(150);
    this.redrawLine(line);
    await this.delay(120);
  }

  private highlightBlocker(point: GridPoint, blockerId: string): void {
    const world = this.toWorld(point);
    const flash = this.add.graphics();
    flash.fillStyle(0xf15c5c, 0.55);
    flash.fillCircle(world.x, world.y, this.cellSize * 0.3);
    const blocker = this.lineGraphics.get(blockerId);
    if (blocker) blocker.setAlpha(0.45);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 1.8,
      duration: 340,
      onComplete: () => {
        flash.destroy();
        blocker?.setAlpha(1);
      },
    });
  }

  private createTools(): void {
    const button = this.createRoundButton(540, 1638, "?", "提示");
    button.setData("level-tool", true);
    button.setInteractive(new Phaser.Geom.Circle(0, 0, 72), Phaser.Geom.Circle.Contains);
    button.on("pointerdown", () => this.showHint());
    this.hintButton = button;
  }

  private createRoundButton(x: number, y: number, icon: string, label: string): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const shadow = this.add.graphics();
    shadow.fillStyle(0x8c704d, 0.18);
    shadow.fillCircle(0, 10, 70);
    const circle = this.add.graphics();
    circle.fillStyle(0xffffff, 1);
    circle.fillCircle(0, 0, 70);
    circle.lineStyle(3, 0xeadbc1, 1);
    circle.strokeCircle(0, 0, 70);
    const iconText = this.add.text(0, -7, icon, {
      fontFamily: "Arial Rounded MT Bold, sans-serif",
      fontSize: "70px",
      fontStyle: "bold",
      color: "#765943",
    }).setOrigin(0.5);
    const labelText = this.add.text(0, 98, label, {
      fontFamily: "PingFang SC, sans-serif",
      fontSize: "28px",
      color: "#8b715a",
    }).setOrigin(0.5);
    container.add([shadow, circle, iconText, labelText]);
    container.setSize(144, 144);
    return container;
  }

  private showHint(): void {
    if (this.busy || this.overlay) return;
    const escapable = getEscapableLines(this.state.lines, this.state.level.board.width, this.state.level.board.height);
    const targetId = this.state.level.solution.find((id) => escapable.includes(id)) ?? escapable[0];
    const graphics = targetId ? this.lineGraphics.get(targetId) : undefined;
    if (!graphics) return;
    this.tweens.killTweensOf(graphics);
    this.tweens.add({ targets: graphics, alpha: 0.25, duration: 220, yoyo: true, repeat: 4 });
  }

  private refreshHud(): void {
    this.remainingText.setText(`剩余 ${this.state.lines.length}`);
    this.waterDrops.forEach((drop, index) => {
      const active = index < this.state.water;
      if (!active && drop.alpha > 0.2) {
        this.tweens.add({ targets: drop, alpha: 0.12, scale: 1.7, duration: 260, ease: "Back.easeIn" });
      } else if (active) {
        drop.setAlpha(1).setScale(1);
      }
    });
  }

  private showVictory(): void {
    this.state.updateTimer();
    const stars = calculateStars(this.state.elapsedSeconds, this.state.water, this.state.level.difficulty.parTimeSeconds);
    recordWin(this.levelNumber, stars, this.state.elapsedSeconds);
    this.overlay = this.createOverlay(0xfffbf3);
    const card = this.createCard(540, 900, 820, 790);
    this.overlay.add(card);
    const title = this.add.text(540, 620, "过关啦！", {
      fontFamily: "Arial Rounded MT Bold, PingFang SC, sans-serif",
      fontSize: "78px",
      fontStyle: "bold",
      color: "#cf8a19",
    }).setOrigin(0.5);
    this.overlay.add(title);

    for (let index = 0; index < 3; index += 1) {
      const star = this.add.star(380 + index * 160, 770, 5, 34, 76, index < stars ? 0xf7bd3b : 0xd9cfbd, 1);
      star.setStrokeStyle(7, 0xffffff, 0.8).setScale(0);
      this.overlay.add(star);
      this.tweens.add({ targets: star, scale: 1, delay: 180 + index * 170, duration: 420, ease: "Back.easeOut" });
    }

    const stats = this.add.text(540, 940, `用时  ${this.formatTime(this.state.elapsedSeconds)}\n剩余水滴  ${this.state.water}\n标准时间  ${this.formatTime(this.state.level.difficulty.parTimeSeconds)}`, {
      fontFamily: "PingFang SC, sans-serif",
      fontSize: "38px",
      color: "#765943",
      align: "center",
      lineSpacing: 22,
    }).setOrigin(0.5);
    this.overlay.add(stats);
    this.overlay.add(this.createActionButton(540, 1195, "下一关", () => this.startLevel(this.levelNumber + 1)));
    this.overlay.add(this.createTextButton(540, 1325, "重玩本关", () => this.startLevel(this.levelNumber)));
  }

  private showFailure(): void {
    this.overlay = this.createOverlay(0xf7eee3);
    this.overlay.add(this.createCard(540, 900, 820, 650));
    const title = this.add.text(540, 680, "差一点！", {
      fontFamily: "Arial Rounded MT Bold, PingFang SC, sans-serif",
      fontSize: "78px",
      fontStyle: "bold",
      color: "#c56c50",
    }).setOrigin(0.5);
    const progress = Math.round((1 - this.state.lines.length / this.state.level.lines.length) * 100);
    const subtitle = this.add.text(540, 860, `已经清除 ${progress}%\n再试一次，一定可以！`, {
      fontFamily: "PingFang SC, sans-serif",
      fontSize: "38px",
      color: "#765943",
      align: "center",
      lineSpacing: 18,
    }).setOrigin(0.5);
    this.overlay.add([title, subtitle, this.createActionButton(540, 1090, "再来一次", () => this.startLevel(this.levelNumber))]);
  }

  private createOverlay(color: number): Phaser.GameObjects.Container {
    const container = this.add.container(0, 0).setDepth(100);
    const shade = this.add.rectangle(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT, 0x4b3729, 0.36).setOrigin(0);
    shade.setInteractive();
    const glow = this.add.circle(540, 900, 540, color, 0.09);
    container.add([shade, glow]);
    return container;
  }

  private createCard(x: number, y: number, width: number, height: number): Phaser.GameObjects.Graphics {
    const card = this.add.graphics();
    card.fillStyle(0x6a503a, 0.16);
    card.fillRoundedRect(x - width / 2 + 10, y - height / 2 + 18, width, height, 48);
    card.fillStyle(0xfffbf3, 1);
    card.fillRoundedRect(x - width / 2, y - height / 2, width, height, 48);
    card.lineStyle(4, 0xe7d3ae, 1);
    card.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 48);
    return card;
  }

  private createActionButton(x: number, y: number, label: string, callback: () => void): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const background = this.add.graphics();
    background.fillStyle(0xd79828, 1);
    background.fillRoundedRect(-250, -64, 500, 128, 62);
    background.fillStyle(0xffffff, 0.16);
    background.fillRoundedRect(-225, -48, 450, 38, 22);
    const text = this.add.text(0, 0, label, {
      fontFamily: "Arial Rounded MT Bold, PingFang SC, sans-serif",
      fontSize: "48px",
      fontStyle: "bold",
      color: "#ffffff",
    }).setOrigin(0.5);
    container.add([background, text]).setSize(500, 128).setInteractive({ useHandCursor: true });
    container.on("pointerdown", callback);
    return container;
  }

  private createTextButton(x: number, y: number, label: string, callback: () => void): Phaser.GameObjects.Text {
    const text = this.add.text(x, y, label, {
      fontFamily: "PingFang SC, sans-serif",
      fontSize: "34px",
      color: "#8b715a",
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    text.on("pointerdown", callback);
    return text;
  }

  private distanceToLine(line: ArrowLine, localX: number, localY: number): number {
    let best = Number.POSITIVE_INFINITY;
    for (let index = 1; index < line.points.length; index += 1) {
      const start = this.toWorld(line.points[index - 1]);
      const end = this.toWorld(line.points[index]);
      const nearest = Phaser.Geom.Line.GetNearestPoint(new Phaser.Geom.Line(start.x, start.y, end.x, end.y), new Phaser.Math.Vector2(localX, localY));
      best = Math.min(best, Phaser.Math.Distance.Between(nearest.x, nearest.y, localX, localY));
    }
    return best;
  }

  private toWorld(point: GridPoint): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(this.boardOrigin.x + point.x * this.cellSize, this.boardOrigin.y + point.y * this.cellSize);
  }

  private formatTime(seconds: number): string {
    const whole = Math.max(0, Math.floor(seconds));
    return `${String(Math.floor(whole / 60)).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`;
  }

  private delay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => this.time.delayedCall(milliseconds, resolve));
  }
}
