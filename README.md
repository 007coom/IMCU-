
# IMCU Terminal Ω - 部署与开发指南

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

---

## 5. 使用 Cloudflare Pages 构建网站 (Cloudflare 部署教程)

Cloudflare Pages 是一个极佳的静态网站托管服务，速度快且在全球（包括部分国内地区）访问体验较好。

### 步骤 1: 准备代码库
1. 确保你已经将本项目代码上传到了 **GitHub** 仓库。

### 步骤 2: 创建 Cloudflare Pages 项目
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
2. 在左侧菜单选择 **Workers & Pages**。
3. 点击 **Create Application** -> **Pages** -> **Connect to Git**。
4. 选择你的 GitHub 账号及本项目仓库。

### 步骤 3: 配置构建设置 (Build Settings)
在 "Set up builds and deployments" 页面，填写以下信息：

*   **Framework preset**: 选择 `Vite` (如果没有 Vite 选项，选择 None 也可以，只要命令正确)。
*   **Build command**: `npm run build`
*   **Build output directory**: `dist`

### 步骤 4: 配置环境变量 (Environment Variables)
在同一页面的 "Environment variables (advanced)" 部分：

1.  添加 **Node 版本变量** (非常重要，防止构建失败)：
    *   Variable name: `NODE_VERSION`
    *   Value: `18.17.0` (或更高)
2.  添加 **API Key** (如果你仍使用 Gemini):
    *   Variable name: `API_KEY`
    *   Value: `你的_KEY`
3.  如果你改用了 Spark Lite (见下文)，则添加 Spark 相关的 Key：
    *   `SPARK_APPID` / `SPARK_API_SECRET` / `SPARK_API_KEY`

### 步骤 5: 部署
点击 **Save and Deploy**。等待几分钟，你的网站就会上线了。

---

## 6. 接入国内大模型 (讯飞星火 Spark Lite) 开发指南

如果你希望彻底摆脱 VPN 限制，将后端的 Google Gemini 替换为国内的讯飞星火 (Spark Lite)，你需要修改代码逻辑。由于星火使用的是 WebSocket 鉴权，你需要进行以下代码重构。

### 准备工作
1. 去 [讯飞星火控制台](https://console.xfyun.cn/) 注册并创建应用，获取 `APPID`, `APISecret`, `APIKey`。
2. 安装加密库 (用于生成鉴权签名):
   ```bash
   npm install crypto-js
   npm install --save-dev @types/crypto-js
   ```

### 代码实现参考

你需要创建一个新的工具文件 `utils/sparkService.ts`，并替换 `components/AIXi001.tsx` 中的 Gemini 调用。

#### 1. 创建 Spark 服务 (`utils/sparkService.ts`)

```typescript
import CryptoJS from 'crypto-js';

// 配置信息 (建议从环境变量读取)
const APPID = "你的APPID";
const API_SECRET = "你的APISecret";
const API_KEY = "你的APIKey";

export const getSparkResponse = async (messages: {role: string, content: string}[]) => {
  const url = await getWebsocketUrl();
  
  return new Promise<string>((resolve, reject) => {
    const socket = new WebSocket(url);
    let fullText = "";

    socket.onopen = () => {
      const params = {
        header: { app_id: APPID, uid: "user" },
        parameter: {
          chat: { domain: "generalLite", temperature: 0.5, max_tokens: 1024 } // Spark Lite domain
        },
        payload: {
          message: { text: messages }
        }
      };
      socket.send(JSON.stringify(params));
    };

    socket.onmessage = (event) => {
      const res = JSON.parse(event.data);
      if (res.header.code !== 0) {
        socket.close();
        reject(res.header.message);
        return;
      }
      if (res.payload.choices.text) {
        const content = res.payload.choices.text[0].content;
        fullText += content;
      }
      if (res.header.status === 2) {
        socket.close();
        resolve(fullText);
      }
    };

    socket.onerror = (err) => reject(err);
  });
};

// 生成鉴权 URL
const getWebsocketUrl = (): Promise<string> => {
  return new Promise((resolve) => {
    const url = "wss://spark-api.xf-yun.com/v1.1/chat";
    const host = "spark-api.xf-yun.com";
    const date = new Date().toUTCString();
    
    const algorithm = "hmac-sha256";
    const headers = "host date request-line";
    const signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v1.1/chat HTTP/1.1`;
    
    const signatureSha = CryptoJS.HmacSHA256(signatureOrigin, API_SECRET);
    const signature = CryptoJS.enc.Base64.stringify(signatureSha);
    
    const authorizationOrigin = `api_key="${API_KEY}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`;
    const authorization = btoa(authorizationOrigin);
    
    resolve(`${url}?authorization=${authorization}&date=${encodeURI(date)}&host=${host}`);
  });
}
```

#### 2. 修改 AI 组件 (`components/AIXi001.tsx`)

你需要找到 `handleSendMessage` 和 `handleCommsSend` 函数，将 `aiClient.current.models.generateContent` 替换为上述的 `getSparkResponse`。

**示例修改:**

```typescript
// 引入 Spark 服务
import { getSparkResponse } from '../utils/sparkService';

// ... 在 handleSendMessage 内部 ...

try {
  // 转换历史记录格式以适配星火
  const sparkMessages = [
    { role: "system", content: systemPrompt }, // 星火部分版本支持 system，或将其拼接到第一条 user 消息
    ...chatHistory.map(m => ({
      role: m.role === 'model' ? 'assistant' : 'user',
      content: m.text
    })),
    { role: "user", content: userMsg }
  ];

  // 调用星火 API
  const text = await getSparkResponse(sparkMessages);
  
  setChatHistory(prev => [...prev, { role: 'model', text: text, timestamp: new Date().toLocaleTimeString() }]);
  // ...
}
```

### 限制说明
*   **流式传输 (Live)**: 讯飞星火的实时语音流处理方式与 Gemini Live API 完全不同，若要替换语音功能，需要重写整个音频处理逻辑。
*   **图片生成/识别**: Spark Lite 主要处理文本，图片功能需要调用其专门的 Image API，与 Gemini 的多模态接口不兼容。
