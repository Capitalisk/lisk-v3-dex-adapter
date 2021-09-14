import { verifyData } from '@liskhq/lisk-cryptography';
const {toHexBuffer} = require('./utils')
const {TAG_TRANSACTION, TESTNET_NETWORK_IDENTIFIER} = require('./constants')

export const getMatchingKeySignatures = (
    publicKeys,
    signatures,
    transactionBytes,
    networkIdentifier = TESTNET_NETWORK_IDENTIFIER,
    tag = TAG_TRANSACTION,
) => {
    const keySignaturePair = {}
    for (const publicKey of publicKeys) {
        for (const signature of signatures) {
            if (validateSignature(publicKey, signature, transactionBytes, networkIdentifier, tag)) {
                keySignaturePair[publicKey] = signature
            }
        }
    }
    return keySignaturePair
};

export const validateSignature = (
    publicKey,
    signature,
    transactionBytes,
    networkIdentifier = TESTNET_NETWORK_IDENTIFIER,
    tag = TAG_TRANSACTION,
)  => {
    const bufferedPublicKey = toHexBuffer(publicKey)
    const bufferedSignature = toHexBuffer(signature)
    return verifyData(tag, networkIdentifier, transactionBytes, bufferedSignature, bufferedPublicKey);
};
