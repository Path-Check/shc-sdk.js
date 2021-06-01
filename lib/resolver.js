import fetch from 'cross-fetch';

var localPubKeyDB = {};

async function getJSON(url) {
    const res = await fetch(url);
      
    if (res.status >= 400) {
      //console.log(res);
      throw new Error("Bad response from server");
    }

    return await res.json();
}

export async function getKeyId(kid, iss) {
    // Download pubkey to verify
    if (localPubKeyDB[kid]) {
        return localPubKeyDB[kid];
    }

    let url = `${iss}/.well-known/jwks.json`;

    try {
        // Try to download as a file. 
        const newKeyset = await getJSON(url);

        newKeyset.keys.forEach(key => {
            localPubKeyDB[key.kid] = { type: "URL", key: key, debugPath: url };
        });

        return localPubKeyDB[kid];
    } catch(err) {
        console.warn(url, err);
    }

    return undefined;
}    
