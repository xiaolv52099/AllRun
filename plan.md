# AllRun - macOS 剪切板管理器

## 项目概述

AllRun 是一款跨平台 macOS 剪切板管理桌面应用程序，支持文本、图片、文件的历史记录管理，并提供快捷指令功能，提升用户工作效率。

## 核心功能

### 1. 剪切板监听
- 监听系统复制/剪切事件
- 支持文本、图片、文件三种类型
- 使用轮询机制检测剪切板变化（100ms 间隔）

### 2. 历史记录
- 自动记录剪切板内容，保留最近 100 条
- 同一内容重复复制时累加 `copy_count`，不新增条目
- 数据结构：
```json
{
  "id": "uuid",
  "type": "text|image|file",
  "content": "文本内容或图片路径或文件路径",
  "copy_count": 1,
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z",
  "is_favorited": false,
  "remark": ""
}
```

### 3. 收藏功能
- 支持对文本类型条目收藏（点击星标图标）
- 收藏内容不自动删除
- 支持自定义备注名（双击备注区域编辑）
- 收藏条目在「收藏」Tab 中单独展示

### 4. 自动粘贴
- 点击或 Enter 选中文本条目后
- 自动将内容粘贴到弹窗打开前的鼠标光标所在位置
- 实现方式：
  1. 打开窗口时记录前台应用窗口
  2. 选择后恢复前台窗口焦点
  3. 写入剪切板内容
  4. 模拟 Cmd+V 粘贴

### 5. 图片存储
- 图片转为 WebP 格式存储（节省空间，质量 80%）
- 图片总存储上限 200MB
- 超出时按时间顺序清理最旧图片条目
- 支持预览（点击展开大图）

### 6. 文件展示
- 复制文件时，历史记录中展示：
  - 系统文件图标（通过 `nsfw` 或原生模块获取）
  - 文件名
  - 文件大小
- 不展示文件内容，仅记录文件路径

## 界面与交互

### 7. 全局快捷键唤起
- 默认 `Ctrl+1`（macOS: `Cmd+1`）唤起/隐藏主窗口
- 可在设置中自定义
- 使用 Electron globalShortcut API

### 8. 搜索功能
- 顶部搜索框自动聚焦
- 80ms 防抖处理
- 使用 fuse.js 实现模糊搜索
- 高亮匹配字符（黄色背景标记）

### 9. Tab 过滤
- 四个 Tab 快速切换：[全部] [文本] [收藏] [指令]
- 支持键盘快捷键切换（Cmd+1/2/3/4）

### 10. 键盘导航
- `↑` `↓` 方向键导航列表
- `Enter` 确认选中并粘贴
- `Escape` 关闭窗口
- `Tab` 在搜索框和列表间切换
- `Space` 切换收藏状态

### 11. 可调整大小
- 窗口支持拖拽调整大小
- 最小尺寸：360×400
- 关闭后记忆尺寸，下次打开恢复
- 存储在 config.json 中

### 12. 虚拟滚动
- 使用 react-window 渲染长列表
- 保证 1000 条数据下流畅滚动（60fps）
- 动态计算行高（图片类型更高）

## 快捷指令（AltRun 风格）

### 13. 指令配置
在 `commands.json` 中配置自定义快捷指令：

```json
[
  {
    "id": "cmd-001",
    "name": "打开下载目录",
    "type": "open_dir",
    "path": "~/Downloads",
    "shortcut": "Cmd+Shift+D"
  },
  {
    "id": "cmd-002",
    "name": "打开 GitHub",
    "type": "url",
    "url": "https://github.com",
    "shortcut": "Cmd+Shift+G"
  },
  {
    "id": "cmd-003",
    "name": "执行脚本",
    "type": "shell",
    "command": "echo {{selected_text}} >> ~/clipboard_log.txt",
    "shortcut": "Cmd+Shift+L"
  },
  {
    "id": "cmd-004",
    "name": "运行 Python 脚本",
    "type": "script",
    "path": "~/scripts/process.py",
    "shortcut": "Cmd+Shift+P"
  }
]
```

**指令类型说明：**
- `open_dir`: 打开指定目录（使用 `shell.openPath`）
- `url`: 打开网址（使用 `shell.openExternal`）
- `shell`: 执行 shell 命令，支持 `{{cwd}}`、`{{selected_text}}` 变量
- `script`: 执行脚本文件，根据扩展名自动选择解释器
  - `.sh` → bash
  - `.bat` → cmd (Windows)
  - `.ps1` → powershell (Windows)
  - `.py` → python3

## 设置界面

### 14. 设置弹窗
- 快捷键：`Cmd+,` 打开设置
- 设置项：

#### 通用设置
- [ ] 开机自启
- [ ] 历史保留天数（默认 30 天）
- [ ] 最大历史条数（默认 100 条）
- [ ] 图片存储上限（默认 200MB）

#### 快捷键设置
- 可视化录入修改所有快捷键
- 修改后实时生效，无需重启
- 快捷键冲突检测

#### 快捷指令编辑器
- 表格形式增删改指令
- 支持测试运行
- 导入/导出配置

## 数据存储

### 15. 文件结构
所有数据存储在 `app.getPath('userData')` 目录下：

```
~/Library/Application Support/allrun/
├── history.json        # 历史记录
├── favorites.json      # 收藏列表（同步 history 中的 is_favorited）
├── config.json         # 应用配置
├── commands.json       # 快捷指令
└── images/             # WebP 图片文件
    ├── img-xxx.webp
    └── ...
```

### 配置文件格式

**config.json:**
```json
{
  "window": {
    "width": 500,
    "height": 600
  },
  "shortcuts": {
    "toggleWindow": "Cmd+1",
    "openSettings": "Cmd+,"
  },
  "general": {
    "autoStart": false,
    "historyRetentionDays": 30,
    "maxHistoryItems": 100,
    "imageStorageLimitMB": 200
  }
}
```

## 打包部署

### 16. macOS DMG 打包
- 使用 electron-builder 打包
- 输出 DMG 安装包
- 支持代码签名（可选）
- 支持自动更新（可选）

## 技术栈

| 类别 | 技术选型 |
|------|----------|
| 框架 | Electron 28+ |
| UI 框架 | React 18+ |
| 语言 | TypeScript |
| 样式 | Tailwind CSS |
| 图标 | Lucide Icons |
| 虚拟滚动 | react-window |
| 图片处理 | sharp |
| 模糊搜索 | fuse.js |
| 自动粘贴 | @nut-tree/nut-js |
| 打包工具 | electron-builder |

## 项目结构

```
allrun/
├── electron/                 # Electron 主进程
│   ├── main.ts              # 主进程入口
│   ├── preload.ts           # 预加载脚本
│   ├── clipboard/           # 剪切板相关
│   │   ├── watcher.ts       # 剪切板监听
│   │   └── parser.ts        # 内容解析
│   ├── store/               # 数据存储
│   │   ├── history.ts       # 历史记录
│   │   ├── favorites.ts     # 收藏管理
│   │   └── config.ts        # 配置管理
│   ├── commands/            # 快捷指令
│   │   └── executor.ts      # 指令执行器
│   └── utils/               # 工具函数
│       ├── window.ts        # 窗口管理
│       └── shortcut.ts      # 快捷键管理
├── src/                     # React 渲染进程
│   ├── App.tsx              # 根组件
│   ├── components/          # UI 组件
│   │   ├── SearchBar.tsx    # 搜索栏
│   │   ├── TabBar.tsx       # Tab 导航
│   │   ├── HistoryList.tsx  # 历史列表
│   │   ├── HistoryItem.tsx  # 历史条目
│   │   ├── ImageViewer.tsx  # 图片查看器
│   │   └── Settings.tsx     # 设置弹窗
│   ├── hooks/               # 自定义 Hooks
│   │   ├── useHistory.ts    # 历史记录
│   │   ├── useSearch.ts     # 搜索功能
│   │   └── useKeyboard.ts   # 键盘导航
│   ├── stores/              # 状态管理
│   │   └── useStore.ts      # Zustand store
│   └── utils/               # 工具函数
│       └── highlight.ts     # 搜索高亮
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── electron-builder.json    # 打包配置
```

## 开发计划

见 `task.json` 文件

## 需求审查与任务状态（2026-03-14）

### 本次新增优化需求状态

- [x] a. 点击窗口外区域不关闭页面  
  状态：已满足。主进程没有 `blur/deactivate` 自动隐藏逻辑，窗口仅在 `Esc`、显式隐藏或快捷键切换时隐藏。

- [x] b. 指令分类支持 `↑/↓` 导航，`Enter` 执行  
  状态：已完成。`commands` Tab 新增键盘导航、选中滚动和 Enter 执行。

- [x] c. Tab 分类支持 `←/→` 切换  
  状态：已完成。全局监听左右键循环切换 `[全部|文本|收藏|指令]`。

- [x] d. 打开窗口时保留原应用上下文；选中文本后 `Enter` 粘贴到原光标位置  
  状态：已完成（macOS）。打开窗口前记录前台应用 PID；回车后执行：写入剪贴板 → 隐藏窗口 → 恢复前台应用 → 模拟 `Cmd+V`。

- [x] e. 在“全部”分类搜索时可命中快捷指令  
  状态：已完成。“全部 + 搜索”结果已合并历史记录与指令，支持键盘导航与 Enter 执行。

### 原始需求完成度审查（当前代码）

- [x] 1. 剪切板监听（文本/图片/文件）
- [x] 2. 历史记录（去重计数、上限裁剪）
- [ ] 3. 收藏备注完整交互（双击备注编辑 UI 未完成）
- [~] 4. 自动粘贴（文本已完成；图片/文件回贴未完成）
- [ ] 5. 图片 WebP 存储与容量淘汰未完成（当前为 base64 PNG 简化）
- [ ] 6. 文件图标/文件大小展示未完成（仅文件名与路径）
- [x] 7. 全局快捷键唤起与设置快捷键
- [x] 8. 搜索（模糊搜索、防抖；“全部”已可搜指令）
- [~] 9. Tab 键盘切换（已支持左右键；`Cmd+1/2/3/4` 未完成）
- [~] 10. 键盘导航（历史/指令已支持 `↑/↓/Enter/Esc`；`Tab` 焦点切换与 `Space` 收藏未完成）
- [x] 11. 窗口可调整大小与尺寸记忆
- [~] 12. 虚拟滚动（已接入；动态行高未完成）
- [x] 13. 指令增删改查与执行
- [~] 14. 设置弹窗（基础项完成；快捷键冲突检测未完成）
- [x] 15. 本地存储结构（history/favorites/config/commands）
- [~] 16. 打包部署（可打包；图标与签名配置仍需完善）
