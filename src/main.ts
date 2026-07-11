import Phaser from "phaser";
import "./styles/main.css";
import { GameScene } from "./scenes/GameScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "app",
  width: 1080,
  height: 1920,
  backgroundColor: "#f6eddc",
  scene: [GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1080,
    height: 1920,
  },
  render: {
    antialias: true,
    roundPixels: true,
  },
  input: {
    activePointers: 2,
  },
};

new Phaser.Game(config);
