# Verifiable QR SDK for Smart Health Cards

JavaScript Implementation of [Smart Health Cards](https://smarthealth.cards), a JSON/JOSE-based Verifiable QR Credentials. 

# Install

```sh
npm install @pathcheck/shc-sdk --save
```

# Usage

## 1. Generating Keys

Generate private and public keys with the provided script: 

```js
npm explore @pathcheck/bbs-jxt-sdk -- npm run-script keys
```

The script generates an EC key pair (no certificate) and 3-cert ECDSA chain (root -> CA -> issuer). 

See the available Private and Public keys by opening the generated `/jwks.private.json` file. 

```json
{
  "keys": [
    {
      "kty": "EC",
      "kid": "PJm-qzYQDnnsa_0IZBcPahQrpwWBfs0lzkgudTgqF9Y",
      "use": "sig",
      "alg": "ES256",
      "x5c": [],
      "crv": "P-256",
      "x": "gvaE0Z5GM87K2WM56cSj_bNyYCO6U3cLdlHXpMCaeIQ",
      "y": "7vXhWfGecAUGnpNRt-kFp723XSI89IgVL_AzcPdQZzw",
      "d": "eXpiDTZbFjFb4n2AQTm1Tsbdj5ILxAsrLtYA9sXk-JA"
    },
    {
      "kty": "EC",
      "kid": "a4dzPoSaJ9s30gZbqgGpz4powoYMJL_DXxIjTOyWRUs",
      "use": "sig",
      "alg": "ES256",
      "x5c": [
        "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"
      ],
      "crv": "P-256",
      "x": "NV2gZVNVDkG1qPG1DxHLuGzISkQUK8-CcOdWmDirDeM",
      "y": "1ayrYFBNhjGJGvxZ1zS6lbNx-Q90vWx1o4-H3F_-I_o",
      "d": "JtIEB3GAOypZMc-T0lHIRFbSGgIdgEvGeB_MzpUXzNw"
    }
  ]
}
```

## 2. Uploading Public Keys to a Resolvable Address

Copy the newly created `jwks.json` to your `domain.com/.well-known/`

This file is the same as the previous file, but without the `d` parameter, which holds the private key. 

```json
{
  "keys": [
    {
      "kty": "EC",
      "kid": "PJm-qzYQDnnsa_0IZBcPahQrpwWBfs0lzkgudTgqF9Y",
      "use": "sig",
      "alg": "ES256",
      "x5c": [],
      "crv": "P-256",
      "x": "gvaE0Z5GM87K2WM56cSj_bNyYCO6U3cLdlHXpMCaeIQ",
      "y": "7vXhWfGecAUGnpNRt-kFp723XSI89IgVL_AzcPdQZzw"
    },
    {
      "kty": "EC",
      "kid": "a4dzPoSaJ9s30gZbqgGpz4powoYMJL_DXxIjTOyWRUs",
      "use": "sig",
      "alg": "ES256",
      "x5c": [
        "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"
      ],
      "crv": "P-256",
      "x": "NV2gZVNVDkG1qPG1DxHLuGzISkQUK8-CcOdWmDirDeM",
      "y": "1ayrYFBNhjGJGvxZ1zS6lbNx-Q90vWx1o4-H3F_-I_o"
    }
  ]
}
```

The verifier will point to that address (e.g. [`http://pcf.pw/.well-known/jwks.json`](http://pcf.pw/.well-known/jwks.json)) to download your public keys and verify the package. 

## 3. Preparing to Sign

With one of the keys: 

```js
const keyPair = {
    "kty": "EC",
    "kid": "PJm-qzYQDnnsa_0IZBcPahQrpwWBfs0lzkgudTgqF9Y",
    "use": "sig",
    "alg": "ES256",
    "x5c": [],
    "crv": "P-256",
    "x": "gvaE0Z5GM87K2WM56cSj_bNyYCO6U3cLdlHXpMCaeIQ",
    "y": "7vXhWfGecAUGnpNRt-kFp723XSI89IgVL_AzcPdQZzw",
    "d": "eXpiDTZbFjFb4n2AQTm1Tsbdj5ILxAsrLtYA9sXk-JA"
  }
```

And a JSON Payload

```js
const TEST_PAYLOAD = {
    "type": [
      "https://smarthealth.cards#health-card",
      "https://smarthealth.cards#immunization",
      "https://smarthealth.cards#covid19"
    ],
    "credentialSubject": {
      "fhirVersion": "4.0.1",
      "fhirBundle": {
        "resourceType": "Bundle",
        "type": "collection",
        "entry": [
          {
            "fullUrl": "resource:0",
            "resource": {
              "resourceType": "Patient",
              "name": [
                {
                  "family": "Anyperson",
                  "given": [
                    "John",
                    "B."
                  ]
                }
              ],
              "birthDate": "1951-01-20"
            }
          },
          {
            "fullUrl": "resource:1",
            "resource": {
              "resourceType": "Immunization",
              "status": "completed",
              "vaccineCode": {
                "coding": [
                  {
                    "system": "http://hl7.org/fhir/sid/cvx",
                    "code": "207"
                  }
                ]
              },
              "patient": {
                "reference": "resource:0"
              },
              "occurrenceDateTime": "2021-01-01",
              "performer": [
                {
                  "actor": {
                    "display": "ABC General Hospital"
                  }
                }
              ],
              "lotNumber": "0000001"
            }
          },
          {
            "fullUrl": "resource:2",
            "resource": {
              "resourceType": "Immunization",
              "status": "completed",
              "vaccineCode": {
                "coding": [
                  {
                    "system": "http://hl7.org/fhir/sid/cvx",
                    "code": "207"
                  }
                ]
              },
              "patient": {
                "reference": "resource:0"
              },
              "occurrenceDateTime": "2021-01-29",
              "performer": [
                {
                  "actor": {
                    "display": "ABC General Hospital"
                  }
                }
              ],
              "lotNumber": "0000007"
            }
          }
        ]
      }
    }
  };
```

Make a JWT and call the `signAndPack` function to create the URI for the QR Code: 

```js
const {signAndPack, unpackAndVerify} = require('@pathcheck/shc-sdk');

// parameters are: payload, months to expire, issuer address to download the public key
const jwt = await makeJWT(TEST_PAYLOAD, 48, "https://pcf.pw")
const qrUri = await signAndPack(jwt, keyPair);
```

And call the unpack and verify to convert the URI into the payload: 

```js
const jsonld = await unpackAndVerify(qrUri);
```

# Development

```sh
npm install
``` 

# Test

```sh
npm test
```
