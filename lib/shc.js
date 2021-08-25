import jose, { JWK } from 'node-jose';
import pako from 'pako';
import base64url from 'base64url';
import { getKeyId } from './resolver';

const URI_SCHEMA = 'shc';

/*
 * I am not sure if I should build this by hand. 
 */
export async function makeJWT(payload, monthsToExpire, issuer, notBeforeDate) {
  let iss = new Date();
  let exp = new Date(iss);
  exp.setMonth(exp.getMonth()+monthsToExpire);

  let jwt = {
    iss: issuer,
    iat: Math.round(iss.getTime()/1000),
    exp: Math.round(exp.getTime()/1000),
    vc: payload
  };

  if (notBeforeDate)
    jwt['nbf'] = Math.round(notBeforeDate.getTime()/1000);

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

  const signed = await jose.JWS.createSign({ format: 'compact', fields }, signingKey)
    .update(Buffer.from(body))
    .final();

  return signed;
}

async function jwsParts(token) {
    let [headerEnc, bodyEnc, signatureEnc] = token.split(".");
    const header = JSON.parse(base64url.decode(headerEnc));
    const signature = base64url.decode(signatureEnc);
    let bodyRaw = base64url.toBuffer(bodyEnc);
    if (header.zip == 'DEF') {
        bodyRaw = Buffer.from(pako.inflateRaw(bodyRaw));
    }
    let body = JSON.parse(bodyRaw.toString());
    return { header, body, signature };
}

async function getVerificationKeyForJws(jws) {
    let parsedJwsUnsafe = await jwsParts(jws);
    let kid = parsedJwsUnsafe.header.kid;
    let iss = parsedJwsUnsafe.body.iss;
    return await getKeyId(kid, iss);
}

async function verifyAndReturnPayload(jws, signingKey) {
  if (!signingKey)
    signingKey = (await getVerificationKeyForJws(jws)).key; 

  const verified = await jose.JWS.createVerify(await JWK.asKey(signingKey)).verify(jws)

  let body = verified.payload;
  if ((verified.header).zip === 'DEF') {
      body = Buffer.from(pako.inflateRaw(body));
  }

  return JSON.parse(body.toString());
}

export async function verify(jws, pubkeyKey) {
  try {
    await verifyAndReturnPayload(jws, pubkeyKey);
    return true;
  } catch (err) {
    console.log(err);
    return false;
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

  return await fromBase10(data);
}

export async function pack(payload) {
  return URI_SCHEMA + ':/' + await toBase10(payload);
}

export async function debug(uri) {
  return await jwsParts(await unpack(uri));
}

export async function unpackAndVerify(uri, publicKeyPem) {
  try {
    return await verifyAndReturnPayload(await unpack(uri), publicKeyPem);
  } catch (err) {
    console.log(err);
    return undefined;
  }
}
export async function signAndPack(payload, publicKeyPem, privateKeyP8) {
  return await pack(await sign(payload, publicKeyPem, privateKeyP8));
}

