
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

export const getSparkUrl = async (apiSecret: string, apiKey: string): Promise<string> => {
  const host = "spark-api.xf-yun.com";
  const path = "/v1.1/chat"; // Spark Lite / General V1.1
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
  return `wss://${host}${path}?authorization=${authorization}&date=${encodeURI(date)}&host=${host}`;
};

export const sendSparkRequest = async (
  messages: { role: string; content: string }[], 
  config: SparkConfig,
  systemPrompt: string
): Promise<string> => {
  const url = await getSparkUrl(config.apiSecret, config.apiKey);
  
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    let fullText = "";
    
    // Transform messages: Spark places system prompt in payload or as first message
    // We will prepend system prompt as a user message with specific instruction for Lite compatibility
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
            domain: "general", // Spark Lite usually uses 'general' or 'generalLite'
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
      const res = JSON.parse(event.data);
      
      if (res.header.code !== 0) {
        socket.close();
        reject(`Spark Error (${res.header.code}): ${res.header.message}`);
        return;
      }

      if (res.payload && res.payload.choices && res.payload.choices.text) {
        const content = res.payload.choices.text[0].content;
        fullText += content;
      }

      if (res.header.status === 2) {
        socket.close();
        resolve(fullText);
      }
    };

    socket.onerror = (error) => {
      socket.close();
      reject("WebSocket Connection Error");
    };
    
    socket.onclose = (event) => {
        if (!fullText && event.code !== 1000) {
            // If closed without result and not normal closure
            // reject("Connection closed unexpectedly");
        }
    };
  });
};
