# Amaze Go

Amaze Go 是一款使用 Phaser 3、TypeScript 和 Vite 开发的竖屏箭头消除益智游戏。玩家需要判断折线箭头的逃生方向，按正确顺序让所有折线飞出棋盘。

## 游戏规则

- 点击一条折线后，它会沿箭头方向逐格移动。
- 每个移动步骤都会在头部增加一格，并从尾部移除一格。
- 如果前进方向被其他折线占用，则消耗一滴水。
- 清除棋盘上的全部折线即可过关。
- 水滴全部耗尽时，本关失败。

## 功能

- 9:16 竖屏布局和响应式画布
- 高密度剪影关卡与关卡选择界面
- 折线逃生判定、碰撞检测和逐格飞出动画
- 三滴水、计时、提示、三星评价和本地进度存档
- AI 生成的循环背景音乐、点击、过关和失败音效
- 离线 Android WebView APK 打包工程
- Vitest 自动测试

## 技术栈

- [Phaser 3](https://phaser.io/)
- TypeScript
- Vite
- Vitest
- Android WebView + Gradle

## 本地运行

需要 Node.js 20 或更高版本。

```bash
npm install
npm run dev
```

浏览器打开终端显示的地址。推荐使用手机竖屏或浏览器移动设备模式。

## 测试与构建

```bash
npm test
npm run build
```

构建结果输出到 `dist/`。

## Android APK

项目包含一个离线 Android WebView 外壳。网页代码或资源更新后，先同步最新 Web 构建：

```bash
./scripts/sync-android-assets.sh
```

然后使用 Android Studio 自带的 JDK 构建 Debug APK：

```bash
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" \
ANDROID_HOME="$HOME/Library/Android/sdk" \
./android/gradlew -p android :app:assembleDebug --no-daemon
```

APK 输出位置：

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

安装到已连接的 Android 设备：

```bash
~/Library/Android/sdk/platform-tools/adb install -r \
  android/app/build/outputs/apk/debug/app-debug.apk
```

Windows 或 Linux 用户可以将 `JAVA_HOME` 和 `ANDROID_HOME` 替换为本机的 JDK 17/21 与 Android SDK 路径。

## 资源生成

仓库保留游戏运行所需的成品关卡和音频。原始音频候选、剪影中间文件、预览图和构建产物均由 `.gitignore` 排除，避免扩大仓库体积。

常用生成命令：

```bash
npm run silhouette:manifest
npm run silhouette:svg
npm run silhouette:process
npm run generate:levels
```

详细玩法和技术设计参见 [`docs/GAME_DESIGN.md`](docs/GAME_DESIGN.md)。剪影资源流程参见 [`docs/SILHOUETTE_LIBRARY_PLAN.md`](docs/SILHOUETTE_LIBRARY_PLAN.md)。

## 项目结构

```text
src/                 Phaser 游戏代码
public/audio/        游戏使用的成品音频
public/levels/       运行时关卡数据
assets/silhouettes/  剪影来源和生成配置
scripts/             关卡、剪影和 Android 资源脚本
android/             Android WebView 打包工程
docs/                游戏设计和资源流程文档
```

## 发布说明

- `npm run build` 和 Android Debug APK 构建均已验证。
- 发布前请根据需要补充仓库许可证，并确认第三方剪影素材对应的许可证文件。
- Debug APK 仅用于测试和侧载。发布到应用商店前，应配置正式签名、版本号和 Release 构建。
