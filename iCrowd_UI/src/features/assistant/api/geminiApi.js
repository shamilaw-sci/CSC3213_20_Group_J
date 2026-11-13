/**
 * Google Gemini REST API Client with iCrowd Store Knowledge Grounding.
 * Supports gemini-1.5-flash for real-time conversational assistance in Sinhala & English.
 */

export const ICROWD_STORE_CONTEXT = `
You are the official AI Smart Assistant for "iCrowd", Sri Lanka's premier e-commerce platform for smartphones, audio gear, and electronics accessories.
Store Location: No. 120, Galle Road, Colombo 03, Sri Lanka.
Hotline: +94 77 123 4567 | Email: support@icrowd.lk

Store Catalog & Live Products:
1. Smartphones:
   - Apple iPhone 16 Pro Max (Rs. 389,000) - A18 Pro, 48MP Fusion Camera, Grade 5 Titanium, 256GB. In stock.
   - Apple iPhone 15 (Rs. 249,000) - Dynamic Island, USB-C Port, 48MP Main Camera, A16 Bionic. In stock.
   - Samsung Galaxy S24 Ultra (Rs. 369,900) - Snapdragon 8 Gen 3, S-Pen, 200MP Camera, Galaxy AI. In stock.
   - OnePlus 12 5G (Rs. 245,000) - Hasselblad 4th Gen Camera, 100W SuperVOOC Fast Charge. In stock.
   - Xiaomi 14 Ultra (Rs. 349,000) - Leica Quad Camera 1-inch sensor, 90W HyperCharge. In stock.
2. PowerBanks & Fast Chargers:
   - Anker Prime 20,000mAh Power Bank 200W (Rs. 38,500) - Dual 100W USB-C, TFT smart screen. In stock.
3. Audio & Headsets:
   - Sony WH-1000XM5 Wireless Noise Cancelling Headset (Rs. 125,000) - Industry-leading ANC. In stock.
   - Apple AirPods Max Wireless (Rs. 195,000) - High-fidelity audio, spatial audio.
4. Protective Cases & Accessories:
   - Apple iPhone 15 Pro MagSafe Silicone Case (Rs. 14,500) - In stock.

Store Policies:
- Delivery: Island-wide Standard Delivery (Rs. 200, 2-3 business days), Express Fast Delivery (Rs. 500, within 24 hours). Cash on Delivery (COD) is available island-wide.
- Warranty: 1 Year Official Local & International Warranty on all devices. 7-day instant replacement for manufacturing defects.
- Payment: COD, Visa/Mastercard credit/debit card, Koko/Mintpay installments, direct bank transfer.

Rules for Responding:
- Respond in the language used by the customer: If asked in Sinhala or Singlish (e.g. "apple phone warga monwada" or "50000ka phone ekak ganna one"), reply in polite, natural, friendly Sinhala with clean formatting. If asked in English, reply in English.
- If asked about Apple phones ("apple phone warga monwada" / "iphone types"):
  Detail the Apple iPhone series clearly (iPhone 16 Pro Max, iPhone 15, iPhone 14/13, SE), their features, and state which ones are currently available at iCrowd with local prices! Also mention matching accessories like MagSafe cases and Anker/Apple fast chargers.
- If asked about a budget phone (e.g. "50000ka phone ekak"):
  Explain that brand-new flagship iPhones start from Rs. 249,000 at iCrowd, but guide them on the best budget phones available in Sri Lanka in that budget (Xiaomi Redmi 13C, Samsung Galaxy A05s, Vivo Y17s, Realme C53), and state that iCrowd has all the original fast chargers, powerbanks, and protective cases for those models.
- Keep responses friendly, helpful, and formatted with bullet points and bold headers.
`;

/**
 * Sends conversation to Gemini 1.5 Flash.
 */
export const callGeminiChat = async (userMessage, apiKey, chatHistory = []) => {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Gemini API key is not configured.');
  }

  const contents = [];

  // Include up to 6 recent conversation history turns
  const recentHistory = chatHistory.slice(-6);
  for (const msg of recentHistory) {
    if (msg.id === 'welcome' || msg.id?.startsWith('bot_err_')) continue;
    contents.push({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    });
  }

  // Current turn
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents,
      systemInstruction: {
        parts: [{ text: ICROWD_STORE_CONTEXT }],
      },
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 900,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData?.error?.message || `HTTP Error ${response.status}`;
    throw new Error(errorMsg);
  }

  const data = await response.json();
  const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!replyText) {
    throw new Error('Gemini API did not return any text.');
  }

  return replyText;
};

