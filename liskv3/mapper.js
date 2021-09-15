const transactionMapper = ({id, asset : {amount, recipient, data}, sender, block : {timestamp}, signatures = []}) => {
    return {
        id,
        message: data,
        amount,
        timestamp,
        senderAddress : sender.address,
        recipientAddress : recipient.address,
        signatures
    }
}

const blockMapper = ({id, height, timestamp}) => ({id, height, timestamp})

module.exports = {transactionMapper, blockMapper}
