
// Helper to encode text to Uint8Array
const textEncoder = new TextEncoder();

// Base64 encoding helper
const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export interface SparkConfig {
  appId: string;
  apiSecret: string;
  apiKey: string;
}

export interface SparkEndpoint {
  url: string;
  domain: string;
}

export type SparkVersion = 'v1.1' | 'v2.1' | 'v3.1' | 'v3.5' | 'v4.0';

export const SPARK_ENDPOINTS: Record<SparkVersion, SparkEndpoint> = {
  'v1.1': { url: "wss://spark-api.xf-yun.com/v1.1/chat", domain: "lite" },        // Lite (Updated to 'lite')
  'v2.1': { url: "wss://spark-api.xf-yun.com/v2.1/chat", domain: "generalv2" },   // V2.0
  'v3.1': { url: "wss://spark-api.xf-yun.com/v3.1/chat", domain: "generalv3" },   // Pro
  'v3.5': { url: "wss://spark-api.xf-yun.com/v3.5/chat", domain: "generalv3.5" }, // Max
  'v4.0': { url: "wss://spark-api.xf-yun.com/v4.0/chat", domain: "4.0Ultra" }     // Ultra
};

export const getSparkUrl = async (apiSecret: string, apiKey: string, serviceUrl: string): Promise<string> => {
  const urlObj = new URL(serviceUrl);
  const host = urlObj.host;
  const path = urlObj.pathname;
  const date = new Date().toUTCString();
  
  // 1. Construct signature origin
  const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`;

  // 2. HMAC-SHA256 Signature using Web Crypto API
  const keyData = textEncoder.encode(apiSecret);
  const messageData = textEncoder.encode(signatureOrigin);
  
  const cryptoKey = await window.crypto.subtle.importKey(
    "raw", 
    keyData, 
    { name: "HMAC", hash: "SHA-256" }, 
    false, 
    ["sign"]
  );
  
  const signatureBuffer = await window.crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    messageData
  );
  
  const signature = arrayBufferToBase64(signatureBuffer);

  // 3. Construct Authorization header
  const algorithm = "hmac-sha256";
  const headers = "host date request-line";
  const authorizationOrigin = `api_key="${apiKey}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`;
  const authorization = btoa(authorizationOrigin);

  // 4. Build final URL
  return `${serviceUrl}?authorization=${authorization}&date=${encodeURI(date)}&host=${host}`;
};

export const sendSparkRequest = async (
  messages: { role: string; content: string }[], 
  config: SparkConfig,
  systemPrompt: string,
  endpoint: SparkEndpoint
): Promise<string> => {
  
  try {
    const url = await getSparkUrl(config.apiSecret, config.apiKey, endpoint.url);
  
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(url);
      let fullText = "";
      let hasError = false;

      // Connection Timeout
      const timeoutId = setTimeout(() => {
        if (socket.readyState !== WebSocket.CLOSED) {
          socket.close();
          hasError = true;
          reject("Connection Timed Out (30s limit)");
        }
      }, 30000);

      // Transform messages: Spark places system prompt in payload or as first message
      const payloadMessages = [
          { role: "user", content: systemPrompt }, 
          ...messages
      ];

      socket.onopen = () => {
        const params = {
          header: {
            app_id: config.appId,
            uid: "user_imcu_terminal"
          },
          parameter: {
            chat: {
              domain: endpoint.domain,
              temperature: 0.5,
              max_tokens: 2048
            }
          },
          payload: {
            message: {
              text: payloadMessages
            }
          }
        };
        socket.send(JSON.stringify(params));
      };

      socket.onmessage = (event) => {
        try {
          const res = JSON.parse(event.data);
          
          if (res.header.code !== 0) {
            socket.close();
            hasError = true;
            // Pass detailed error for debugging, including domain
            reject(`Spark Error (${res.header.code}): ${res.header.message} [Requested Domain: ${endpoint.domain}]`);
            return;
          }

          if (res.payload && res.payload.choices && res.payload.choices.text) {
            const content = res.payload.choices.text[0].content;
            fullText += content;
          }

          // Status 2 means generation complete
          if (res.header.status === 2) {
            clearTimeout(timeoutId);
            socket.close();
            resolve(fullText);
          }
        } catch (e) {
            console.error("Error parsing Spark response:", e);
        }
      };

      socket.onerror = (error) => {
        clearTimeout(timeoutId);
        hasError = true;
        socket.close();
        reject("WebSocket Connection Error - Check Console or Network status.");
      };
      
      socket.onclose = (event) => {
          clearTimeout(timeoutId);
          if (!fullText && !hasError) {
              // If closed without result but also without explicit error frame (e.g. network drop)
              reject("Connection closed unexpectedly without response.");
          } else if (fullText && !hasError && event.code !== 1000) {
              // If we got text but connection dropped weirdly, still resolve with what we have
              resolve(fullText);
          }
      };
    });
  } catch (e) {
    return Promise.reject(e);
  }
};
