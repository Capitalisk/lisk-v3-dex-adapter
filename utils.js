const toHexBuffer = (data) => Buffer.from(data, 'hex')
const hexBufferToString = (hexBuffer) => hexBuffer.toString('hex')

module.exports = {toHexBuffer, hexBufferToString};
