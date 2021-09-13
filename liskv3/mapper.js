const transactionMapper = ({id, asset : {amount, recipient, data}, sender, block : {timestamp}, signatures = []}) => {
    return {
        id,
        message: data,
        amount,
        timestamp,
        senderAddress : sender.address,
        recipientAddress : recipient.address,
        // todo - need to check if signature is a signerAddress
        signatures: signatures.map(address => ({signerAddress: address}))
    }
}

const blockMapper = ({id, height, timestamp}) => {
    return {id, height, timestamp}
}

module.exports = {transactionMapper, blockMapper}
