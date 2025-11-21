# IMCU Terminal Ω - 部署指南

本项目是一个基于 React 和 Google Gemini API 构建的复古科幻终端风格 Web 应用。

## 1. 本地运行 (电脑端)

### 前置要求
你需要安装 [Node.js](https://nodejs.org/) (建议版本 v18 或更高)。

### 安装步骤

1.  **下载代码**：将所有文件保存到一个文件夹中。
2.  **安装依赖**：打开终端（命令行），进入该文件夹，运行：
    ```bash
    npm install
    ```
3.  **配置 API Key**：
    在项目根目录下创建一个名为 `.env` 的文件，并填入你的 Google Gemini API Key：
    ```env
    API_KEY=你的_Google_Gemini_API_Key_粘贴在这里
    ```
    *注意：你可以从 [Google AI Studio](https://aistudio.google.com/) 获取 API Key。*

4.  **启动项目**：
    ```bash
    npm run dev
    ```
    运行后，终端会显示一个本地地址（通常是 `http://localhost:5173`），在浏览器中打开即可。

## 2. 部署到网络 (手机/公网访问)

要让手机也能访问，推荐使用 **Vercel** 或 **Netlify** 进行免费部署。

### 使用 Vercel 部署 (推荐)

1.  将你的代码上传到 **GitHub** 仓库。
2.  注册并登录 [Vercel](https://vercel.com)。
3.  点击 "Add New..." -> "Project"。
4.  选择你刚才上传的 GitHub 仓库。
5.  在 **Environment Variables** (环境变量) 部分：
    *   Key: `API_KEY`
    *   Value: `你的_Google_Gemini_API_Key`
6.  点击 **Deploy**。

部署完成后，Vercel 会给你一个网址（例如 `imcu-terminal.vercel.app`），你可以在任何电脑或手机的浏览器中访问这个网址。

## 3. 手机端体验优化

*   **全屏模式**：在手机 Safari (iOS) 或 Chrome (Android) 中打开网址后，点击分享/菜单按钮，选择“添加到主屏幕”。这样可以隐藏地址栏，获得类似原生 App 的沉浸式全屏体验。
*   **权限**：首次启动时，如果使用 AI 语音或摄像头功能，浏览器会请求麦克风或摄像头权限，请点击“允许”。

## 注意事项

*   **费用**：本项目使用 Google Gemini API。请关注 Google AI Studio 的计费规则（通常有免费层级，但在生产环境中使用可能需要付费）。
*   **安全性**：请勿将 `.env` 文件提交到公开的 GitHub 仓库中（本项目已配置忽略，但请务必小心保管你的 API Key）。