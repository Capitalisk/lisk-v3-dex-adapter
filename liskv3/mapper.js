const transactionMapper = ({nonce, asset: {amount, recipient, data}, sender, block: {timestamp}, signatures = []}) => {
    return {
        id: `${sender.address}-${nonce}`,
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
