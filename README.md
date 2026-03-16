# AllRun

AllRun 是一款支持 macOS + Windows 的剪切板效率工具，支持历史记录管理、收藏备注、图片预览复制、快捷指令执行、独立设置窗口与多语言切换。

## 技术架构

### 架构分层

- Main Process（Electron，`electron/main.cjs`）
  - 创建主窗口与设置窗口、注册全局快捷键、监听系统剪切板、处理 IPC、执行命令与打包运行入口。
- Preload（`electron/preload.cjs`）
  - 通过 `contextBridge` 暴露安全 API（`window.electronAPI`）给渲染进程。
- Renderer（React + TypeScript，`src/`）
  - UI、搜索、Tab 切换、列表导航、设置页面、状态管理（Zustand）。
- Local Store（`electron/store/*.cjs`）
  - `history.json` / `favorites.json` / `commands.json` / `config.json` 本地持久化。

### 关键技术栈

- Electron 28
- React 18 + TypeScript
- Zustand（状态管理）
- Fuse.js（模糊搜索）
- react-window（虚拟列表）
- Tailwind CSS（样式）
- electron-builder（打包）

## 运行环境

- Node.js >= 18
- npm >= 9
- macOS（建议 12+，Apple Silicon / Intel）
- Windows（建议 Windows 10 / 11）

建议授予系统辅助权限（尤其在 macOS 上，用于更稳定的前台应用切回与自动粘贴体验）。

## 安装与启动

```bash
npm install
npm run dev
```

`npm run dev` 会执行：

- `dev:preflight`：清理 5173 端口和历史残留 dev 进程
- `dev:vite`：启动 Vite（固定 `5173`）
- `dev:electron`：启动 Electron 桌面窗口

注意：这是桌面应用，调试请以 Electron 弹窗为准，不要把浏览器页面当成最终运行形态。

## 功能说明

### 1. 窗口与快捷键

- 全局快捷键显示/隐藏主窗口（默认 `CommandOrControl+1`，即 `Cmd+1` / `Ctrl+1`）
- 快捷键打开设置窗口（默认 `CommandOrControl+,`，即 `Cmd+,` / `Ctrl+,`）
- 主界面与设置界面为独立窗口
- 设置窗口支持鼠标拖拽边缘缩放，关闭后保持上次尺寸
- 标题栏提供关闭按钮（mac 风格）和设置按钮
- 每次窗口打开会重置为 `全部` Tab、清空搜索并重置选中项

### 2. 剪切板历史

- 自动监听文本、图片、文件
- 相同内容会累加复制次数，不重复入库
- 支持单条删除、清空历史（保留收藏）
- 文本项支持双击快速执行复制/粘贴动作
- 记录时间展示（相对时间）

### 3. Tab 与搜索

- Tab 默认顺序：`全部 / 指令 / 文本 / 收藏 / 图片`
- 支持拖拽自定义 Tab 顺序（持久化保存）
- `全部 + 搜索` 会合并展示历史项和指令项
- `全部 + 搜索` 中会优先展示指令项
- Fuse.js 模糊搜索，80ms 防抖
- 搜索命中高亮（橙色）
- 收藏备注支持搜索与高亮

### 4. 键盘导航

- `↑/↓`：列表导航
- `↑` 在第一项会循环到最后一项
- `↓` 在最后一项会循环到第一项
- `Enter`：执行当前选中项（图片 Tab 不触发 Enter 执行）
- `Esc`：隐藏窗口
- `←/→`：切换 Tab（在搜索框焦点下同样支持）

### 5. 图片能力

- 图片单独 Tab 展示
- 列表点击打开预览弹层
- 预览中支持一键复制图片到剪切板

### 6. 收藏与备注

- 文本可收藏/取消收藏
- 收藏页支持备注展示与编辑（行内编辑、保存/取消）
- 收藏项中时间与备注同一行紧凑展示
- 收藏页支持拖拽排序（持久化保存）

### 7. 快捷指令

支持类型：

- `open_dir`：打开目录
- `url`：打开网址
- `shell`：执行 shell 命令
- `script`：执行脚本

支持变量（shell 命令）：

- `{{cwd}}`
- `{{selected_text}}`
- `{{参数名}}`（当配置了 Bash 参数定义时）

参数交互：

- 对配置了 Bash 参数定义的 shell 指令，首次 `Enter` 会弹窗输入参数
- 再次 `Enter` 执行并使参数生效
- 支持按空格顺序输入：`值1 值2`
- 支持命名输入：`参数名=值`

指令可在“指令”Tab管理，也支持在“全部”Tab搜索后直接执行。
- 指令 Tab 支持拖拽排序（持久化保存）

### 8. 设置页

- 设置页为独立窗口，风格与主界面一致
- 通用设置：开机启动、历史容量、主题风格、语言
- 快捷键设置：可修改全局快捷键
- 指令设置：增删改、测试执行
- 支持退出 AllRun

语言支持：

- 简体中文（默认）
- 繁体中文
- English
- 한국어
- 日本語

## 数据目录

用户数据保存在：

- macOS：`~/Library/Application Support/allrun/`
- Windows：`%APPDATA%/allrun/`

主要文件：

- `history.json`
- `favorites.json`
- `commands.json`
- `config.json`

## 跨平台适配计划（已执行）

### 阶段 1：兼容性分析

- 审计主进程平台相关逻辑（窗口唤起、自动粘贴、剪贴板文件格式）
- 审计开发与打包脚本（`dev`、图标、`electron-builder`）
- 审计命令执行器在 Windows 下的解释器与路径处理

### 阶段 2：开发改造

- 主进程：
  - 保持 macOS 现有效果不变（AppleScript 前台切回、自动粘贴、Dock 隐藏）
  - 新增 Windows 粘贴分支（`Ctrl+V` 发送）
  - 窗口视觉效果配置改为仅在 macOS 启用
- 剪贴板：
  - 新增共享文件路径解析模块，兼容 macOS `public.file-url` 与 Windows `FileNameW/FileName`
- 指令执行：
  - 统一 `~` 路径展开（兼容 `HOME/USERPROFILE`）
  - 脚本执行器补齐 Windows 参数（`cmd /c`、`powershell -File`）
- 工具链：
  - `dev:electron` 改为跨平台命令
  - `dev-preflight` 增加 Windows 分支
  - 图标脚本支持跨平台生成 `icon.ico`

### 阶段 3：验证与打包

- 静态检查：
  - `npm run lint`
  - `npx tsc --noEmit`
- 打包验证：
  - `npm run icon:generate`
  - `npm run build`（macOS DMG）
  - `npm run build:win:dir`（Windows 目录包）
  - `npm run build:win`（Windows NSIS 安装包）

## 测试与质量检查

项目当前未配置单元测试框架，建议至少执行以下检查：

```bash
npm run lint
npx tsc --noEmit
```

建议手工回归：

- 主窗口唤起/隐藏与快捷键
- 设置窗口唤起、关闭、缩放与尺寸持久化
- 各 Tab 搜索与键盘导航
- 文本自动粘贴与图片复制
- 收藏备注编辑
- 指令执行、参数弹窗、参数替换与删除
- 语言切换（简中/繁中/英文/韩文/日文）

## 调试指南

### 开发调试

```bash
npm run dev
```

- 主进程日志：终端输出
- 渲染进程日志：Electron DevTools（开发模式默认打开）

### 常见调试点

- 无法启动 Vite：确认 5173 端口是否被占用（`dev:preflight` 会自动尝试清理）
- 浏览器能开但桌面功能不可用：说明未在 Electron 中调试
- 自动粘贴异常：检查系统辅助功能权限

## 打包与发布

### 1) 生成图标资源（建议先执行）

```bash
npm run icon:generate
```

生成：

- `build/icon.icns`
- `build/icon.png`
- `build/icons/*`

### 2) 打包指令

```bash
# 仅打包目录（不生成安装包）
npm run build:dir

# 仅打包 macOS
npm run build:mac

# 仅打包 Windows（NSIS 安装包）
npm run build:win

# 仅打包 Windows 目录（无安装器）
npm run build:win:dir

# 当前平台默认打包
npm run build
```

默认产物目录：`release/`

常见产物：

- `release/AllRun-1.0.0-arm64.dmg`
- `release/AllRun-1.0.0.dmg`
- `release/mac-arm64/AllRun.app`
- `release/mac/AllRun.app`
- `release/AllRun Setup 1.0.0.exe`
- `release/win-unpacked/`
- `release/win-arm64-unpacked/`

### 3) 安装启动

- macOS：
  - 打开对应架构的 `.dmg`
  - 拖拽 `AllRun.app` 到 `Applications`
  - 首次可通过右键“打开”放行未签名应用

- Windows：
  - 运行 `AllRun Setup 1.0.0.exe`
  - 选择安装目录并完成安装
  - 首次运行若被系统拦截，请在“更多信息”中选择继续运行

## 许可证

MIT
