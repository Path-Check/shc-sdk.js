import { JWK, JWS } from 'node-jose';
import pako from 'pako';
import base64url from 'base64url';
import { resolveKey, addCachedKeys } from './resolver';

const URI_SCHEMA = 'shc';

const NOT_SUPPORTED = "not_supported";                  // QR Standard not supported by this algorithm
const INVALID_ENCODING = "invalid_encoding";            // could not decode Base45 for DCC, Base10 for SHC
const INVALID_COMPRESSION = "invalid_compression";      // could not decompress the byte array
const INVALID_SIGNING_FORMAT = "invalid_signing_format";// invalid COSE, JOSE, W3C VC Payload
const KID_NOT_INCLUDED = "kid_not_included";            // unable to resolve the issuer ID
const ISSUER_NOT_TRUSTED = "issuer_not_trusted";        // issuer is not found in the registry
const TERMINATED_KEYS = "terminated_keys";              // issuer was terminated by the registry
const EXPIRED_KEYS = "expired_keys";                    // keys expired
const REVOKED_KEYS = "revoked_keys";                    // keys were revoked by the issuer
const INVALID_SIGNATURE = "invalid_signature";          // signature doesn't match
const VERIFIED = "verified";                            // Verified content.

/*
 * I am not sure if I should build this by hand. 
 */
export async function makeJWT(payload, issuer, notBeforeDate, expirationDate) {
  let jwt = {
    iss: issuer,
    vc: payload
  };

  if (notBeforeDate)
    jwt['nbf'] = Math.round(notBeforeDate.getTime()/1000);

  if (expirationDate)
    jwt['exp'] = Math.round(expirationDate.getTime()/1000);

  return jwt;
}

export async function parseJWT(jwt) {
  return jwt.get(JWT_SUBJECT);
}

export async function sign(payload, privateKey) {
  const signingKey = await JWK.asKey(privateKey);
  const bodyString = JSON.stringify(payload);

  const fields = { zip: 'DEF' };
  const body = pako.deflateRaw(bodyString);

  return await JWS.createSign({ format: 'compact', fields }, signingKey)
    .update(Buffer.from(body))
    .final();
}

function jwsParse(token) {
    let [headerEnc, bodyEnc, signatureEnc] = token.split(".");
    const headerRaw = base64url.decode(headerEnc);
    const signature = base64url.decode(signatureEnc);
    const bodyRaw = base64url.toBuffer(bodyEnc);
    return { headerRaw, bodyRaw, signature };
}

function jwsInflate(jwsRaw) {
    jwsRaw.header = JSON.parse(jwsRaw.headerRaw)
    if (jwsRaw.header.zip == 'DEF') {
        jwsRaw.body = JSON.parse(Buffer.from(pako.inflateRaw(jwsRaw.bodyRaw)).toString());
    }
    return jwsRaw;
}

export async function verify(jws, publicKeyArray) {
  if (publicKeyArray) {
    addCachedKeys(publicKeyArray);
  }
  
  let rawPayload;
  try {
    rawPayload = jwsParse(jws);
  } catch (err) {
    console.log(err);
    return { status: INVALID_SIGNING_FORMAT}
  }

  try {
    rawPayload = jwsInflate(rawPayload);
  } catch (err) {
    console.log(err);
    return { status: INVALID_COMPRESSION, raw: rawPayload }
  }

  if (!rawPayload.body.iss || !rawPayload.header.kid) return { status: KID_NOT_INCLUDED, contents: rawPayload.body, raw: rawPayload }

  let issuer = await resolveKey(rawPayload.body.iss, rawPayload.header.kid);

  if (!issuer) return { status: ISSUER_NOT_TRUSTED, contents: rawPayload.body, raw: rawPayload }

  switch (issuer.status) {
    case "revoked": return    { status: REVOKED_KEYS, contents: rawPayload.body, issuer: issuer, raw: rawPayload }
    case "terminated": return { status: TERMINATED_KEYS, contents: rawPayload.body, issuer: issuer, raw: rawPayload }
    case "expired": return    { status: EXPIRED_KEYS, contents: rawPayload.body, issuer: issuer, raw: rawPayload }
  }

  try {
    const verified = await JWS.createVerify(await JWK.asKey(issuer.didDocument)).verify(jws)

    let body = verified.payload;
    if ((verified.header).zip === 'DEF') {
        body = Buffer.from(pako.inflateRaw(body));
    }

    return { status: VERIFIED, contents: JSON.parse(body.toString()), issuer: issuer,  raw: rawPayload };
  } catch (err) {
    console.log(err);
    return { status: INVALID_SIGNATURE, contents: rawPayload.body, issuer: issuer, raw: rawPayload }
  }
}

const SMALLEST_B64_CHAR_CODE = 45; // "-".charCodeAt(0) === 45

async function toBase10(payload) {
    return payload.split('')
      .map((c) => c.charCodeAt(0) - SMALLEST_B64_CHAR_CODE)
      .flatMap((c) => [Math.floor(c / 10), c % 10])
      .join('')
}

async function fromBase10(base10) {
    let payload = []
    base10.match(/.{1,2}/g).forEach(char => {
      payload.push(String.fromCharCode(parseInt(char)+SMALLEST_B64_CHAR_CODE))
    });
    return payload.join('');
}

export async function unpack(uri) {
  let data = uri.toLowerCase();

  // Backwards compatibility.
  if (data.startsWith(URI_SCHEMA)) {
    data = data.substring(3)
    if (data.startsWith(':')) {
      data = data.substring(1)
    } 
    if (data.startsWith('/')) {
      data = data.substring(1)
    } 
  } 

  try {
    return await fromBase10(data);
  } catch (err) {
    console.log(err);
    return undefined
  }
}

export async function pack(payload) {
  return URI_SCHEMA + ':/' + await toBase10(payload);
}

export async function debug(uri) {
  return jwsInflate(jwsParse(await unpack(uri)));
}

export async function unpackAndVerify(uri, publicKeyArray) {
  const jws = await unpack(uri);

  if (!jws) { 
    return { status: INVALID_ENCODING, qr: uri };
  }

  const verified = await verify(jws, publicKeyArray);
  return {...verified, qr: uri};
}
export async function signAndPack(payload, publicKeyPem, privateKeyP8) {
  return await pack(await sign(payload, publicKeyPem, privateKeyP8));
}

