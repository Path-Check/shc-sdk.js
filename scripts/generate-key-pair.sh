#!/bin/bash

# This script generates an EC key pair and 3-cert ECDSA chain (root -> CA -> issuer).
# Leaf cert uses P-256 and is valid for 1 year (as per the SMART Health Card Framework),
# CA and root CA use the increasingly stronger P-384 and P-521, and are valid for
# 5 and 10 years, respectively.

# directory where intermediate files are kept

tmpdir=$1
srcdir=scripts

mkdir -p $tmpdir

# Code to generate simple public keys

openssl ecparam -genkey -name prime256v1 -noout -out $tmpdir/ec256-key-pair.key

# add the issuer key to the JWK sets 
node $srcdir/keysToJWK.js --key $tmpdir/ec256-key-pair.key --private $tmpdir/jwks.private.json --public $tmpdir/jwks.json
