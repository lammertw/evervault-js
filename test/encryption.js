const assert = require('assert');
const Evervault = require('../lib/v2/index.js');

require('./utils').runBrowserJsPolyfills();

const encryptedStringRegex = /((ev(:|%3A))(debug(:|%3A))?(([A-z0-9+/=%]+)(:|%3A))?((number|boolean|string)(:|%3A))?(([A-z0-9+/=%]+)(:|%3A)){3}(\$|%24))|(((eyJ[A-z0-9+=.]+){2})([\w]{8}(-[\w]{4}){3}-[\w]{12}))/
const ev = new Evervault('team_fc26733f1539', 'app_275032e00186');
const evDebug = new Evervault('team_fc26733f1539', 'app_275032e00186', { isDebugMode: true });

describe('Encryption', () => {
  beforeEach(() => ev.loadKeys());

  it('it encrypts a string', async () => {
    const encryptedString = await ev.encrypt('Big Secret');
    assert(encryptedStringRegex.test(encryptedString));
  });

  it('it encrypts a number', async () => {
    const encryptedString = await ev.encrypt(12345);
    assert(encryptedStringRegex.test(encryptedString));
  });

  it('it encrypts a boolean', async () => {
    const encryptedString = await ev.encrypt(true);
    assert(encryptedStringRegex.test(encryptedString));
  });

  it('it encrypts all datatypes in an object', async () => {
    const encryptedObject = await ev.encrypt({
      name: 'Claude Shannon',
      employer: {
        name: 'Bell Labs',
        location: 'Murray Hill, NJ, USA',
        current: true,
      },
      yearOfBirth: 1916,
    });

    assert(encryptedStringRegex.test(encryptedObject.name));
    assert(encryptedStringRegex.test(encryptedObject.employer.name));
    assert(encryptedStringRegex.test(encryptedObject.employer.location));
    assert(encryptedStringRegex.test(encryptedObject.employer.current));
    assert(encryptedStringRegex.test(encryptedObject.yearOfBirth));
  });
});

describe('File Encryption', () => {
  it('it encrypts a file', async () => {
    const file = new File(["hello", new TextEncoder().encode("world")], "hello")
    const encryptedFile = await ev.encrypt(file);
    assert(Buffer.compare(encryptedFile.slice(0, 6), Buffer.from("%EVENC", "utf-8")) == 0)
  });

  it('it encrypts a file in debug mode', async () => {
    const file = new File(["hello", new TextEncoder().encode("world")], "hello")
    const encryptedFile = await evDebug.encrypt(file);
    assert(Buffer.compare(encryptedFile.slice(0, 6), Buffer.from("%EVENC", "utf-8")) == 0)
    assert(Buffer.compare(encryptedFile.slice(54, 55), Buffer.from([0x01])) == 0)
  });
});