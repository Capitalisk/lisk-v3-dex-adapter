const axios = require('axios');
const liskTestnetUrl = 'https://testnet-service.lisk.com'

const fetch = async () => {
    try {
        const response = await axios.get(`${liskTestnetUrl}/api/v2/network/status`, {
                params: {
                },
            },
        );
        return response.data;
    } catch (e) {
        console.error(e)
    }
};

module.exports = fetch
