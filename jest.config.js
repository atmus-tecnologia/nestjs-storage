require('ts-node/register');

module.exports = {
  'moduleFileExtensions': [
    'js',
    'json',
    'ts',
  ],
  'rootDir': 'src',
  'testRegex': '/src/.*\\.spec\\.(ts|js)$',
  'globals': {
    'ts-jest': {
      'tsConfig': 'tsconfig.json'
    }
  },
  'preset': 'ts-jest',
};
