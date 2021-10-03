const {toBuffer} = require('./utils');
const TAG_REGEX = /^([A-Za-z0-9])+$/;

const createMessageTag = (domain, version) => {
    if (!TAG_REGEX.test(domain)) {
        throw new Error(
            `Message tag domain must be alpha numeric without special characters. Got "${domain}".`,
        );
    }

    if (version && !TAG_REGEX.test(version.toString())) {
        throw new Error(
            `Message tag version must be alpha numeric without special characters. Got "${version}"`,
        );
    }

    return `LSK_${version ? `${domain}:${version}` : domain}_`;
};

const TAG_TRANSACTION = createMessageTag('TX');
const TAG_BLOCK_HEADER = createMessageTag('BH');

const TESTNET_NETWORK_IDENTIFIER = toBuffer('15f0dacc1060e91818224a94286b13aa04279c640bd5d6f193182031d133df7c');
const MAINNET_NETWORK_IDENTIFIER = toBuffer('4c09e6a781fc4c7bdb936ee815de8f94190f8a7519becd9de2081832be309a99');

const DEX_TRANSACTION_ID_LENGTH = 44;

module.exports = {TAG_TRANSACTION, TESTNET_NETWORK_IDENTIFIER, MAINNET_NETWORK_IDENTIFIER, TAG_BLOCK_HEADER, DEX_TRANSACTION_ID_LENGTH};
