// index.js
import * as LitJsSdk from "@lit-protocol/lit-node-client";
import { getAuthSig } from "./utils.js";
import { LIT_NETWORK } from '@lit-protocol/constants';
import encryption from '@lit-protocol/encryption';


const { encryptString, decryptToString } = encryption;

const runTest = async () => {
  const authSig = await getAuthSig();

  const litNodeClient = new LitJsSdk.LitNodeClient({
    litNetwork: LIT_NETWORK.DatilDev, // Test network
    debug: true,
  });
  await litNodeClient.connect();

  const accessControlConditions = [
    {
      contractAddress: "ipfs://QmcgbVu2sJSPpTeFhBd174FnmYmoVYvUFJeDkS7eYtwoFY",
      standardContractType: "LitAction",
      chain: "ethereum",
      method: "go",
      parameters: ["100"],
      returnValueTest: {
        comparator: "=",
        value: "true",
      },
    },
  ];

  const { ciphertext, dataToEncryptHash } = await encryptString(
    {
      accessControlConditions,
      authSig,
      chain: "ethereum",
      dataToEncrypt: "This is a secret message",
    },
    litNodeClient
  );

  console.log("\nEncrypted ciphertext (hex):");
  console.log(LitJsSdk.uint8arrayToString(ciphertext, "base16"));

  console.log("\nAttempting to decrypt...");

  const decryptedString = await decryptToString({
    accessControlConditions,
    ciphertext,
    dataToEncryptHash,
    authSig,
    chain: "ethereum",
  }, litNodeClient);

  console.log("\nDecrypted message:");
  console.log(decryptedString);
};

runTest()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  });
