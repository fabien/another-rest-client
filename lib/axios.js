const axios = require('axios');
const axiosRetry = require('axios-retry');
const Agent = require('agentkeepalive');

const defaults = {
    retry: true
};

const httpAgentDefaults = {
    maxSockets: 100,
    maxFreeSockets: 10,
    timeout: 60000, // active socket keepalive for 60 seconds
    freeSocketTimeout: 30000, // free socket keepalive for 30 seconds
};

const retryDefaults = {
    retries: 3, retryDelay: axiosRetry.exponentialDelay
};

module.exports = function createAxios(options = {}) {
    let { httpAgent, retry, ...config } = { ...defaults, ...options };
    config.httpAgent = new Agent({ ...httpAgentDefaults, ...httpAgent });
    const client = axios.create(config);
    
    if (retry === true || typeof retry === 'object') {
        axiosRetry(client, { ...retryDefaults, ...retry });
    } else if (typeof retry === 'number') {
        axiosRetry(client, { ...retryDefaults, retries: retry });
    }
    
    return client;
};
