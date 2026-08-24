/**
 * Android exposes the speech module as NativeModules.RCTVoice; the JS in
 * @react-native-voice/voice only reads NativeModules.Voice. Patching dist
 * avoids mutating NativeModules at runtime (which triggers "Tried to insert
 * a NativeModule into the bridge's NativeModule proxy").
 */
const fs = require('fs');
const path = require('path');

const file = path.join(
  __dirname,
  '..',
  'node_modules',
  '@react-native-voice',
  'voice',
  'dist',
  'index.js',
);

try {
  let s = fs.readFileSync(file, 'utf8');
  const from = 'const Voice = react_native_1.NativeModules.Voice;';
  const to =
    'const Voice = react_native_1.NativeModules.RCTVoice || react_native_1.NativeModules.Voice;';
  if (s.includes(to)) {
    console.log('[patch-rnvoice] already applied');
    process.exit(0);
  }
  if (!s.includes(from)) {
    console.warn('[patch-rnvoice] expected line not found; skip');
    process.exit(0);
  }
  s = s.replace(from, to);
  fs.writeFileSync(file, s);
  console.log('[patch-rnvoice] patched dist/index.js for Android RCTVoice');
} catch (e) {
  console.warn('[patch-rnvoice]', e.message);
  process.exit(0);
}
