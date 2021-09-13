const transactionMapper = ({id, asset : {amount, recipient, data}, sender, block : {timestamp}}) => {
    return {
        id,
        message: data,
        amount,
        timestamp,
        senderAddress : sender.address,
        recipientAddress : recipient.address
    }
}

const blockMapper = ({id, height, timestamp}) => {
    return {id, height, timestamp}
}

module.exports = {transactionMapper, blockMapper}
