'use strict';

require('dotenv').config();

const app = require('./src/app');

const PORT = parseInt(process.env.PORT || '3001', 10);

app.listen(PORT, () => {
  const provider = (process.env.AI_PROVIDER || 'gemini').toUpperCase();

  const keyOk =
    process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here';

  console.log('');
  console.log('  ┌─────────────────────────────────────────────┐');
  console.log('  │       AI Doc Generator — Backend Ready      │');
  console.log('  ├─────────────────────────────────────────────┤');
  console.log(`  │  URL:       http://localhost:${PORT}             │`);
  console.log(`  │  Provider:  ${provider.padEnd(32)}│`);
  console.log(
    `  │  API Key:   ${(keyOk ? '✅ Configured' : '❌ Missing — add to .env').padEnd(32)}│`
  );
  console.log('  └─────────────────────────────────────────────┘');
  console.log('');
});
