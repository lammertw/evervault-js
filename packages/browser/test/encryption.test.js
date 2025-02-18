import { Buffer } from "node:buffer";

import { describe, assert, it, beforeEach, expect } from "vitest";

import Evervault from "../lib/main";
import { setupCrypto } from "./setup";
import crc32 from "crc-32";

const encryptedStringRegex =
  /((ev(:|%3A))(debug(:|%3A))?(([A-z0-9+/=%]+)(:|%3A))?((number|boolean|string)(:|%3A))?(([A-z0-9+/=%]+)(:|%3A)){3}(\$|%24))|(((eyJ[A-z0-9+=.]+){2})([\w]{8}(-[\w]{4}){3}-[\w]{12}))/;
const ev = new Evervault(
  import.meta.env.VITE_EV_TEAM_UUID,
  import.meta.env.VITE_EV_APP_UUID
);
const evDebug = new Evervault(
  import.meta.env.VITE_EV_TEAM_UUID,
  import.meta.env.VITE_EV_APP_UUID,
  { isDebugMode: true }
);

describe("Encryption", () => {
  beforeEach(() => {
    setupCrypto();
  });

  it("it encrypts a string", async () => {
    const encryptedString = await ev.encrypt("Big Secret");
    assert(encryptedStringRegex.test(encryptedString));
  });

  it("it encrypts a number", async () => {
    const encryptedString = await ev.encrypt(12345);
    assert(encryptedStringRegex.test(encryptedString));
  });

  it("it encrypts a boolean", async () => {
    const encryptedString = await ev.encrypt(true);
    assert(encryptedStringRegex.test(encryptedString));
  });

  it("it encrypts all datatypes in an object", async () => {
    const encryptedObject = await ev.encrypt({
      name: "Claude Shannon",
      employer: {
        name: "Bell Labs",
        location: "Murray Hill, NJ, USA",
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

describe("File Encryption", () => {
  it("it encrypts a file", async () => {
    const file = new File(["hello world"], "hello.txt");
    const encryptedFile = await ev.encrypt(file);

    assert(encryptedFile instanceof File);
    assert(encryptedFile.name === "hello.txt");

    const data = Buffer.from(await encryptedFile.arrayBuffer());
    assert(
      Buffer.compare(data.subarray(0, 6), Buffer.from("%EVENC", "utf-8")) == 0
    );

    // Test that the debug flag is not set
    assert(Buffer.compare(data.subarray(54, 55), Buffer.from([0x00])) == 0);
  });

  it("it encrypts a file in debug mode", async () => {
    const file = new File(["hello world"], "hello.txt");

    const encryptedFile = await evDebug.encrypt(file);

    assert(encryptedFile instanceof File);
    assert(encryptedFile.name === "hello.txt");

    const data = Buffer.from(await encryptedFile.arrayBuffer());
    assert(
      Buffer.compare(data.subarray(0, 6), Buffer.from("%EVENC", "utf-8")) == 0
    );

    // Test that the debug flag is set
    assert(Buffer.compare(data.subarray(54, 55), Buffer.from([0x01])) == 0);
  });

  it("throws an error if the file is too large", async () => {
    const file = new File(["hello world"], "hello.txt");
    Object.defineProperty(file, "size", { value: 26 * 1024 * 1024 });
    expect(() => ev.encrypt(file)).rejects.toThrowError(
      /File size must be less than 25MB/
    );
  });

  it("it encrypts a blob", async () => {
    const blob = new Blob(["hello world"]);
    const encryptedFile = await ev.encrypt(blob);

    assert(encryptedFile instanceof Blob);

    const data = Buffer.from(await encryptedFile.arrayBuffer());
    assert(
      Buffer.compare(data.subarray(0, 6), Buffer.from("%EVENC", "utf-8")) == 0
    );

    // Test that the debug flag is not set
    assert(Buffer.compare(data.subarray(54, 55), Buffer.from([0x00])) == 0);
  });

  it("it encrypts a blob in debug mode", async () => {
    const blob = new Blob(["hello world"]);

    const encryptedFile = await evDebug.encrypt(blob);

    assert(encryptedFile instanceof Blob);
    const data = Buffer.from(await encryptedFile.arrayBuffer());

    assert(
      Buffer.compare(data.subarray(0, 6), Buffer.from("%EVENC", "utf-8")) == 0
    );

    // Test that the debug flag is set
    assert(Buffer.compare(data.subarray(54, 55), Buffer.from([0x01])) == 0);
  });

  it("it encrypts a file and verifies that the crc32 was genered correctly", async () => {
    const file = new File(["hello world"], "hello.txt");
    const encryptedFile = await ev.encrypt(file);
    const data = await encryptedFile.arrayBuffer();

    const crc32Bytes = data.slice(-4);
    const view = new DataView(crc32Bytes);
    const crc32FromFile = view.getInt32(0, true);

    const crc32FromFileContents = crc32.buf(Buffer.from(data.slice(0, -4)));

    assert(crc32FromFile === crc32FromFileContents);
  });

  it("throws an error if the blob is too large", async () => {
    const blob = new Blob(["hello world"]);
    Object.defineProperty(blob, "size", { value: 26 * 1024 * 1024 });
    expect(() => ev.encrypt(blob)).rejects.toThrowError(
      /File size must be less than 25MB/
    );
  });
});
