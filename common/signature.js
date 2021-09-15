const { verifyData } = require('@liskhq/lisk-cryptography');
const {toHexBuffer} = require('./utils')
const {TAG_TRANSACTION, TESTNET_NETWORK_IDENTIFIER} = require('./constants')

const getMatchingKeySignatures = (
    publicKeys,
    signatures,
    transactionBytes,
    networkIdentifier = TESTNET_NETWORK_IDENTIFIER,
    tag = TAG_TRANSACTION,
) => {
    const keySignaturePair = []
    for (const publicKey of publicKeys) {
        for (const signature of signatures) {
            if (validateSignature(publicKey, signature, transactionBytes, networkIdentifier, tag)) {
                keySignaturePair.push({publicKey, signature})
            }
        }
    }
    return keySignaturePair
};

const validateSignature = (
    publicKey,
    signature,
    transactionBytes,
    networkIdentifier = TESTNET_NETWORK_IDENTIFIER,
    tag = TAG_TRANSACTION,
)  => {
    const transactionWithNetworkIdentifierBytes = Buffer.concat([networkIdentifier, transactionBytes])
    return verifyData(transactionWithNetworkIdentifierBytes, toHexBuffer(signature), toHexBuffer(publicKey));
};

module.exports = {getMatchingKeySignatures, validateSignature}
