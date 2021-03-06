// Based on https://github.com/sindresorhus/fix-path, modified to run on linux as well

// eslint-disable-next-line @typescript-eslint/no-var-requires
const shellPath = require('shell-path');

export default function (): void {
  if (['darwin', 'linux'].includes(process.platform) === false) {
    return;
  }

  process.env.PATH =
    shellPath.sync() ||
    [
      './node_modules/.bin',
      '/.nodebrew/current/bin',
      '/usr/local/bin',
      process.env.PATH,
    ].join(':');
}
