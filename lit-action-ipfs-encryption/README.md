# 🔐 Lit Protocol Simple Encryption/Decryption using Lit Action Example

This is a simple working example of encrypting and decrypting a string using [Lit Protocol](https://litprotocol.com/). Adapted from Lit Protocol's official  [repository example](https://github.com/LIT-Protocol/js-serverless-function-test/blob/main/js-sdkTests/decrypt.js) and [documentation](https://developer.litprotocol.com/sdk/access-control/lit-action-conditions). This demo uses a LitAction hosted on IPFS for access control. It runs on the DatilDev test network and demonstrates how to:

- Connect to Lit nodes
- Generate an `authSig` using Sign-In With Ethereum (SIWE)
- Encrypt a message using access control conditions
- Decrypt the message if conditions are met

---

## 📁 Project Structure

```
lit-action-ipfs-encryption
├── index.js        # Main logic for encryption/decryption
├── utils.js        # AuthSig generation using ethers and SIWE
├── .env            # Environment variable with private key
├── package.json    # Dependencies
```

---

## 📦 Prerequisites

- Node.js (v18+)
- NPM or Yarn
- `.env` file with your wallet's private key

```
PRIVATE_KEY=your_private_key_here
```

> ⚠️ Keep your `.env` file safe and never commit it to a public repository.

---

## 🛠 Installation

```bash
npm install
```

This will install the required packages:

- `@lit-protocol/lit-node-client`
- `@lit-protocol/constants`
- `@lit-protocol/encryption`
- `ethers`
- `siwe`
- `dotenv`

---

## 🔐 AuthSig Generation (utils.js)

This script uses your Ethereum private key to generate an authentication signature using SIWE:

```js
const wallet = new ethers.Wallet(privateKey);
const siweMessage = new siwe.SiweMessage({
  domain: "localhost",
  address,
  statement: "This is a test statement.",
  uri: "https://localhost/login",
  version: "1",
  chainId: 11155111, // Sepolia Testnet
  expirationTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
});
const signature = await wallet.signMessage(siweMessage.prepareMessage());
```

The resulting `authSig` will be used to prove your identity to Lit nodes.

---

## 🔄 Encryption and Decryption (ipfs_decrypt.js)

### 1. Connect to Lit Network
- We are using **DatilDev**, which is a Lit Protocol test network that allows developers to experiment with encryption, access control conditions, and Lit Actions without interacting with the mainnet, and it's completely free of charge.

```js
const litNodeClient = new LitJsSdk.LitNodeClient({
  litNetwork: LIT_NETWORK.DatilDev,
  debug: true,
});
await litNodeClient.connect();
```

### 2. Define Access Control Conditions
The following accessControlConditions object defines who is authorized to decrypt the encrypted content:

```js
const accessControlConditions = [
  {
    contractAddress: "ipfs://...",
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
```
- contractAddress: Points to a LitAction hosted on IPFS. This LitAction contains custom JavaScript logic that determines whether access should be granted.

- standardContractType: "LitAction" indicates that the condition relies on evaluating a LitAction, rather than a smart contract on-chain.

- chain: Specifies the blockchain context (in this case, "ethereum").

- method: Refers to the function inside the LitAction that will be executed (here, "go").

- parameters: Arguments passed into the method (["100"] in this case).

- returnValueTest: Defines the expected result from the LitAction. The condition passes if the method returns "true".

This IPFS-hosted LitAction controls whether decryption is allowed. This is a sample LitAction function that fetches the current weather forecast and checks if the temperature is below a given threshold (100):

```js
const go = async (maxTemp) => {
  const url = "https://api.weather.gov/gridpoints/LWX/97,71/forecast";
  try {
    const response = await fetch(url).then((res) => res.json());
    const nearestForecast = response.properties.periods[0];
    const temp = nearestForecast.temperature;
    return temp < parseInt(maxTemp);
  } catch (e) {
    console.log(e);
  }
  return false;
};
```

To view the LitAction we are using in this example you can check this link. https://ipfs.io/ipfs/QmcgbVu2sJSPpTeFhBd174FnmYmoVYvUFJeDkS7eYtwoFY

### 3. Encrypt the Message

Now we use Lit Protocol to encrypt a string ("This is my secret message") with the defined access control conditions. It is important to understand that we use the Lit SDK to perform the encryption operation locally, or in case of web/mobile apps on the client side. 


```js
const { ciphertext, dataToEncryptHash } = await encryptString(
  {
    accessControlConditions,
    authSig,
    chain: "ethereum",
    dataToEncrypt: "This is my secret message",
  },
  litNodeClient
);
```

The encryptString function returns:

- ciphertext: The encrypted data as a Uint8Array.

- dataToEncryptHash: A hash of the original plaintext used for validation during decryption.

The encrypted data can now be securely stored or transmitted. Only users who meet the defined access conditions will be able to decrypt it. In this example, rather than restricting access to specific wallet addresses, we allow decryption for anyone who satisfies the LitAction’s logic (i.e., providing an input that makes it return true).

### 4. Decrypt the Message

Now we perform the reverse operation, but only if the access control conditions are satisfied.

```js
const decryptedString = await decryptToString({
  accessControlConditions,
  ciphertext,
  dataToEncryptHash,
  authSig,
  chain: "ethereum",
}, litNodeClient);
```

If the user meets the access control requirements (e.g., a LitAction returns true), the message is decrypted and returned as a plain string (decryptedString). If not, the decryption will fail and an error will be thrown.


---

## ▶️ How to Run the Code

1. **Clone the repository:**

```bash
git clone https://github.com/elioini/Lit_Protocol/lit-action-ipfs-encryption
cd lit-action-ipfs-encryption
```

2. **Install dependencies:**

```bash
npm install
```

3. **Add your private key:**

Create a `.env` file in the root directory and add your wallet's private key:

```env
PRIVATE_KEY=your_ethereum_private_key_here
```

> ⚠️ Use a **test wallet** and never expose your real private key.

4. **Run the script:**

```bash
node ipfs_decrypt.js
```

---

## ✅ Sample Output

```bash
Encrypted ciphertext (hex):
f17f...9e0a

Attempting to decrypt...

Decrypted message:
This is my secret message
```

