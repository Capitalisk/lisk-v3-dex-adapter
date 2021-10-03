const { computeDEXTransactionId } = require('../common/utils');

const transactionMapper = ({nonce, asset: {amount, recipient, data}, sender, block: {timestamp}, signatures = []}) => {
    return {
        id: computeDEXTransactionId(sender.address, nonce),
        message: data,
        amount,
        timestamp,
        senderAddress: sender.address,
        recipientAddress: recipient.address,
        signatures,
    };
};

const blockMapper = ({id, height, timestamp}) => ({id, height, timestamp});

module.exports = {transactionMapper, blockMapper};
