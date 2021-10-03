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

module.exports = {TAG_TRANSACTION, TAG_BLOCK_HEADER};
