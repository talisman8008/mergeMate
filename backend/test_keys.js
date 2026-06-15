import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const keys = [
  { name: 'GEMINI_API_KEY_1', val: process.env.GEMINI_API_KEY_1 },
  { name: 'GEMINI_API_KEY_2', val: process.env.GEMINI_API_KEY_2 },
  { name: 'GEMINI_API_KEY_3', val: process.env.GEMINI_API_KEY_3 }
];

async function testKey(keyName, keyValue) {
  if (!keyValue) {
    console.log(`❌ ${keyName} is not defined in .env`);
    return;
  }
  
  // Extract just the key part if there are comments
  const cleanKey = keyValue.split(' ')[0];

  try {
    console.log(`Testing ${keyName}...`);
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${cleanKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Say 'Hello' and nothing else." }] }]
        })
      }
    );

    if (response.ok) {
      console.log(`✅ ${keyName} works!`);
    } else {
      const err = await response.text();
      console.log(`❌ ${keyName} failed. Status: ${response.status}. Reason: ${err.slice(0, 100)}`);
    }
  } catch (err) {
    console.log(`❌ ${keyName} threw an error: ${err.message}`);
  }
}

async function main() {
  for (const keyObj of keys) {
    await testKey(keyObj.name, keyObj.val);
  }
}

main();
