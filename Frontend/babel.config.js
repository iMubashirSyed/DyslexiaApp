const path = require('path');

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        // Absolute path so Metro/Babel always finds .env regardless of cwd
        path: path.resolve(__dirname, '.env'),
        allowUndefined: true,
      },
    ],
  ],
};
