import fetch from 'cross-fetch';

let TRUST_REGISTRY = {}
let LAST_FETCH = undefined;
const ONE_DAY_IN_MSECONDS = 86400000;

async function getJSON(url) {
    const res = await fetch(url);
      
    if (res.status >= 400) {
      //console.log(res);
      throw new Error("Bad response from server");
    }

    return await res.json();
}

async function getKeyId(iss, kid) {
    // Download pubkey to verify
    let url = `${iss}/.well-known/jwks.json`;

    try {
        // Try to download as a file. 
        const newKeyset = await getJSON(url);

        newKeyset.keys.forEach(key => {
            TRUST_REGISTRY[iss + "#" + key.kid] = {
              "displayName": {  "en": "Untrusted Issuer: " + iss.replace("https://", "") },
              "entityType": "issuer",
              "status": "untrusted",
              "validFromDT": "2021-01-01T01:00:00.000Z",
              "didDocument": key, 
              "credentialType": [
                "https://smarthealth.cards#immunization"
              ]
            }
        });

        return TRUST_REGISTRY[iss + "#" + kid];
    } catch(err) {
        console.warn(url, err);
    }

    return undefined;
}    

export function addCachedKeys(newIssuerSet) {
  for (const [iss, value] of Object.entries(newIssuerSet)) {
    value.keys.forEach(key => {
        TRUST_REGISTRY[iss + "#" + key.kid] = {
            "displayName": {  "en": "Untrusted URL: " + iss.replace("https://", "") },
            "entityType": "issuer",
            "status": "untrusted",
            "validFromDT": "2021-01-01T01:00:00.000Z",
            "didDocument": key, 
            "credentialType": [
            "https://smarthealth.cards#immunization"
            ]
        }
    });
  }
}

export async function resolveKey(iss, kID) {
  const kidIndex = iss + "#" + kID;  
  if (!TRUST_REGISTRY[kidIndex] && (!LAST_FETCH || new Date().getTime() > LAST_FETCH.getTime() + ONE_DAY_IN_MSECONDS )) {
    // Loading PathCheck Registry
    console.log('KeyID not found: ', kidIndex, ' fetching certificates from PathCheck\'s Trust Registry')

    try {
      const res = await fetch('https://raw.githubusercontent.com/Path-Check/trust-registry/main/registry.json', {method: 'GET', mode: 'no-cors'})
      const data = await res.text()
      TRUST_REGISTRY = JSON.parse(data)["SmartHealthCards"];
    } catch (e) {
      console.log(e);
    }

    LAST_FETCH = new Date();
  }

  if (TRUST_REGISTRY[kidIndex]) {
    return TRUST_REGISTRY[kidIndex];
  }

  return await getKeyId(iss, kID);
}
