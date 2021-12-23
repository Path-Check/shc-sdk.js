const {sign, verify, pack, unpack, signAndPack, unpackAndVerify, makeJWT} = require('../lib/index');
const expect = require('chai').expect; 

const PRIVATE_KEY = {
      "kty": "EC",
      "kid": "RtNFRifHI_nsVNYwpZbB8i0ZqBsjtAI_sjCiyh8fzV8",
      "use": "sig",
      "alg": "ES256",
      "x5c": [],
      "crv": "P-256",
      "x": "-YrUDl5O6LBdmVEEfxw4Ml5trO3IuAzeCnASbxSYowc",
      "y": "E67zIYdV78qz-xAn0dIc0vQWzYEn9RG6OUN2RIL6GQo",
      "d": "XI7SFgM8Attzb0Kxa145OxgfjjezmGpHd3AhE2PePlA"
    }    

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

const SIGNED_TEST_PAYLOAD = "eyJ6aXAiOiJERUYiLCJhbGciOiJFUzI1NiIsImtpZCI6IlJ0TkZSaWZISV9uc1ZOWXdwWmJCOGkwWnFCc2p0QUlfc2pDaXloOGZ6VjgifQ.3ZJLb9swEIT_SrC9ypIoOJWsW50CfRyKAk17CXygqbXFgi-QlBo30H_vknaKFkhy6qm6LTn8ODPUA8gQoIcxRhf6qnLiULofUIDkEXr2ummuu65u1wXgvaOFdt11rFunhVlA_wDx5BD6u9-AoLmPI3IVx1JwP4RX52GVBuI-r5NaT0b-5FFa86JQ2FkObAO7AoTHAU2UXH2Z9t9RxGTpMEr_DX1InB7WZV0y4qXV7WQGhUnjMdjJC7zN9uGyUVzigLBKEe3shC7wJ8pI5Empr16R4PF8X5PgcXgC_Jni0HkSGa7xDOFaKuLBG0MaH_IdRzmjST1-tGOatyXsFgq4lxT-LY-JxTbXbFWzVVPDshRPumEvu_nwd8Uh8jiFHFc7hRHTA81cCGnwxg6ZIOwgzTEbD6cQUV9-FnqZUbWl9ccqNVsFOVRivieAyCehqVtYdksB7lJBtnNAjyZ5-7NBElkhJp-3Uthbqc-IJgeuUyyq6mC9Rp-9cBGtT8hBBqd4rnN7c_UODXqurt7b4GTkioqiEpWNnya9T0ehzh97tsHmv2yw2fzrBtu0sdD3Cw.fEoryLuxU_BJRXiMhJHh_kfeMlxHv5caOl9MUbTL5-f4MdpkMWI8S4QVPjVB9WfelJTbbVfrhERfp10XkvYF1Q"  

describe('JWS Crypto', function() {
  it('should sign the package', async function() {
    const signed = await sign(await makeJWT(TEST_PAYLOAD, "https://pcf.pw"), PRIVATE_KEY);
    expect(signed).to.not.be.null;
    expect(signed.proof).to.not.be.null;
    expect(signed.issuer).to.not.be.null;
    expect(signed.issuanceDate).to.not.be.null;
  });

  it('should verify the package', async function() {
    const result = await verify(SIGNED_TEST_PAYLOAD);
    expect(result).to.be.true;
  });

  it('should sign and verify the package', async function() {
    const signed = await sign(await makeJWT(TEST_PAYLOAD, "https://pcf.pw"), PRIVATE_KEY);
    const result = await verify(signed);
    expect(result).to.be.true;
  });
});


describe('JWS Data Minimization', function() {
  it('should pack And unpack', async function() {
    const packed = await pack(SIGNED_TEST_PAYLOAD);
    const unpacked = await unpack(packed);
    expect(unpacked).to.eql(SIGNED_TEST_PAYLOAD);
  });
});

const EXAMPLE1_PACKED = "shc:/56762909524320603460292437404460312229595326546034602925407728043360287028647167452228092861333145643765314159064022030645045908564355034142454136403706366541713724123638030437562204673740753232392543344332605736010645292953127074242843503861221276716852752941725536670334373625647345380024213944077025250726312423573657001132105220316267750968640761356508111008270666243020277044446712214341455936637024282703544034660963252707282555072932056232255262395660612010735336331255715610420057716412306973057066214536651135113958591233120032575026733958333075072812533734264534700060266054734545664338772667663471584128617435526828390065275357404052057121004150076600323056277610287226003175060305765803534256207472564464060539095425076777272921345209305565332021506258456045760350722804223710051277402927664527742911662372066523664321240336446744622769760467573259652733383263657311072452563376417025746807407539006144613252696869456340066810522645386256555532111000531265754227302628303438085756243800662563286838775672222439672172403542396107375860647335106645704512536703506321757004413636764365347431287321355256580631556063583463563610567737660541737377552828605563116564297412076854033003344323337052606873573426066033102439280977115921594064314334576408722871427337224310757744412937522268303871367257627564750472597763507745283571571263580550066921715611703323062474012471272931363924743604256803437445104259400424433362673769543855403976310365501153573745056364696326060377575776050561075823064353055604551028500311453022452525062305534574";
const EXAMPLE1_SIGNED = "eyJ6aXAiOiJERUYiLCJhbGciOiJFUzI1NiIsImtpZCI6IjNLZmRnLVh3UC03Z1h5eXd0VWZVQUR3QnVtRE9QS01ReC1pRUxMMTFXOXMifQ.3ZJJb9swEIX_SjC9ytqaxJVudQp0ORQFmvZS-EBTY4sFF4GLEDfQf-8M7aALkpx6qm4jPn5875H3oEKAHsYYp9BXVZhQlsEIH0cUOo6lFH4IFd4JM2kMFakTeijA7vbQN9dte7W-ftm9Krv2soBZQn8P8Tgh9N9-Mf_GvTgNKx4I9bROGZOs-iGicvZZoXSzGpoOtgVIjwPaqIT-nHbfUUa2tB-V_4o-MKeHy7IuG-Lx302yg0bWeAwueYm32T6cF4pzHJBOa6KdnNAB_kgZiZy0_uI1CR729zUJHoZHwJ8oDu3nDoXBE0QYpYkHry1pfMhnHNSMlnv84EaeNyVsFwq4UxT-jYjMarqrZlU3q7aGZSkeddM87-b9nxWHKGIKOS5feES-oFlIqSzeuCETpBuUPWTj4RgimvP7oZsZ9bp0_lBxs1VQQyXnOwLIvBPaeg3LdilgOleQ7ezRo2VvvzdIIidl8nmJw94qc0K0OXDNsaiqvfOG3iN7ETI6z8hBhUmLXOfm5uItWvRCX7xzYVJRaCqKStQufkxmx1uhzl_zZIPtf9lg2_3rBte8sND3Ew.EtHJLQTEwQ1Fq0XwZ7WhU1EXNkpRrcSdUTyL0n_8bfRZ2lmrlG30zffy22j4gD3Xb2e1d7I_08ZKCZFF3D2bZw"
      
const EXAMPLE2_PACKED = "shc:/56762909524320603460292437404460312229595326546034602925407728043360287028647167452228092862412238031276337729374040376141242941554145093643676945622940370541063225672132394527554155035639440353633271540654605736010645292953127074242843503861221276716952346945726136710334373625647245380024213944077025250726312423573657001132105221716234384040064261003453615607001120754022552323243428527268703028705875260023605803272466675721126835214264252561682460550324322155695627696364051055733108567304686377413936263959340734076525240927101144391024733966712569745804333209454076760967562876716365595529336864504270220420567277373760430371103910603930766757055850200609742974340667370405372235500407630505716261545758626755076556062356523207757427677122535276366255072800406254592909001256620021007368712954311207213576410771201155765832656023223024031156265529070332000709206471337761450527457509522410407421550769227375563742540409053877684571274232325025660509520812041100695760242441322854576322075028257736293045432561567077365367560540320527660759666164502710684536410042775911685369443068685062552470206438565969415474530054227565322505540756354169051265562329272938296700063434760432605524647435432728726805617173092305762576266111077770413760047627415653380700662440731232412725034441595252606824397107675562556174305557105229757170501170260550413133106160614564000674013252122752717170126956565610232010386111695754286227110409572804316225384361067004523909715526642360735623240576336860104527273032416025286552705006102760096432693642072120"
const EXAMPLE2_OBJECT = {
  "iss": "https://spec.smarthealth.cards/examples/issuer",
  "nbf": 1622576398.801,
  "vc": {
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
                    "Jane",
                    "C."
                  ]
                }
              ],
              "birthDate": "1961-01-20"
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
                    "code": "208"
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
              "lotNumber": "0000002"
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
                    "code": "208"
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
              "lotNumber": "0000008"
            }
          }
        ]
      }
    }
  }
}

describe('Testing SmartCard Examples', function() {
  it('should verify example 1', async function() {
    const result = await verify(EXAMPLE1_SIGNED);
    expect(result).to.be.true;
  });
  it('should pack example 1', async function() {
    const packed = await pack(EXAMPLE1_SIGNED);
    expect(packed).to.eql(EXAMPLE1_PACKED);
  });
  it('should unpack example 1', async function() {
    const unpacked = await unpack(EXAMPLE1_PACKED);
    expect(unpacked).to.eql(EXAMPLE1_SIGNED);
  });
  it('should unpack and verify example 2', async function() {
    const json = await unpackAndVerify(EXAMPLE2_PACKED);
    expect(json.credential).to.eql(EXAMPLE2_OBJECT);
    expect(json.issuer).to.eql({ 
      displayName: { en: 'Untrusted Issuer: spec.smarthealth.cards/examples/issuer' },
      entityType: 'issuer',
      status: 'untrusted',
      validFromDT: '2021-01-01T01:00:00.000Z',
      didDocument: {
        kty: 'EC',
        kid: 'EBKOr72QQDcTBUuVzAzkfBTGew0ZA16GuWty64nS-sw',
        use: 'sig',
        alg: 'ES256',
        x5c: [
            "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"
        ],
        crv: 'P-256',
        x: 'PQHApUWm94mflvswQgAnfHlETMwJFqjUVSs7WU6LQy4',
        y: '7mj8IO-8V5VZjDbRVsJINC_Rq5ai5CDhFX18ceRsLWQ'
      },
      credentialType: [ 'https://smarthealth.cards#immunization' ]
    });
  });
});

const GENERATED_PRIVATE_KEY = {
      "kty": "EC",
      "kid": "0OZJuQ_pm6em_mHSSUMwMC3ZD2EshyDo6NDJhMm7QAY",
      "use": "sig",
      "alg": "ES256",
      "x5c": [],
      "crv": "P-256",
      "x": "sSimT2IyeoHXqlCf_FzpHEVl7vTi8_xRXRgG922oJW4",
      "y": "B_VFOyQ0Rpek9nFqNu5anXT43A--m0MYaPfZ4iCR1xI",
      "d": "_7YL1c_0CDn3NU7SVD9T6jKv9F2AEOQ5HmgTfVflo-o"
    }

const GENERATED_PUBLIC_KEY = {
      "kty": "EC",
      "kid": "0OZJuQ_pm6em_mHSSUMwMC3ZD2EshyDo6NDJhMm7QAY",
      "use": "sig",
      "alg": "ES256",
      "x5c": [],
      "crv": "P-256",
      "x": "sSimT2IyeoHXqlCf_FzpHEVl7vTi8_xRXRgG922oJW4",
      "y": "B_VFOyQ0Rpek9nFqNu5anXT43A--m0MYaPfZ4iCR1xI"
    } 

const CACHED_KEYS = {
  "https://pcf.pw": {
    keys: [GENERATED_PUBLIC_KEY]
  }
}

describe('JWS Crypto w/ New Keys', function() {
  it('should sign and verify the package', async function() {
    const signed = await sign(await makeJWT(TEST_PAYLOAD, "https://pcf.pw"), GENERATED_PRIVATE_KEY);
    const result = await verify(signed, CACHED_KEYS);
    expect(result).to.be.true;
  });
});

describe('JWS Crypto w/ New Keys', function() {
  it('should sign and verify the package w/ Not Before Date', async function() {
    const signed = await sign(await makeJWT(TEST_PAYLOAD, "https://pcf.pw", new Date()), GENERATED_PRIVATE_KEY);
    const result = await verify(signed, CACHED_KEYS);
    expect(result).to.be.true;
  });
});