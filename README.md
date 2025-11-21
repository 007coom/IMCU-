
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

## 4. 在中国部署与使用教程 (China Deployment Guide)

由于 Google Gemini API 服务在中国大陆地区被防火墙拦截，直接访问本项目会出现连接超时或错误。

### 核心原理
本项目是 **纯前端应用 (Client-side SPA)**。这意味着所有的 AI 请求都是直接从**您当前的浏览器**发往 Google 的服务器 (`generativelanguage.googleapis.com`)，而不是通过部署网站的服务器（如 Vercel 后端）转发。

因此，**仅仅将网站部署在海外服务器（如 Vercel）并不能解决中国用户的访问问题**，因为发起请求的是位于中国的用户浏览器。

### 解决方案 A：使用网络代理工具 (推荐)

这是最简单的方法。

1.  **全局代理**：确保您的设备（电脑或手机）开启了 VPN 或网络代理工具，并设置为**全局模式**，或者确保浏览器流量被规则代理到海外。
2.  **验证**：在浏览器中尝试访问 `https://generativelanguage.googleapis.com`。如果能看到 Google 的 404 页面或其他响应，说明连通性正常，应用即可正常使用。

### 解决方案 B：搭建 API 反向代理 (适合开发者)

如果您希望分享给没有代理工具的用户使用，您需要搭建一个“中转站”。

1.  **原理**：
    用户浏览器 -> 您的中转服务器 (Cloudflare/Nginx) -> Google Gemini API

2.  **修改代码**：
    您需要修改 `AIXi001.tsx` 和 `Surveillance.tsx` 中初始化 `GoogleGenAI` 的代码，修改 `baseUrl` 指向您的中转地址。
    *(注：Google GenAI SDK 默认不支持直接修改 Base URL，可能需要手动修改 SDK 包或使用 fetch 自行封装请求，这属于高级开发内容。)*

### 解决方案 C：使用 Vercel Rewrite (仅限 Vercel 部署)

您可以在 `vite.config.ts` 中配置代理（仅限本地开发），或在 Vercel 配置文件中设置 Rewrite 规则，但这通常用于后端转发。对于纯前端 React 应用，最稳妥的方案依然是 **方案 A**。

### 总结

对于绝大多数个人用户，**请开启 VPN/代理工具** 即可正常在中国使用本应用。
