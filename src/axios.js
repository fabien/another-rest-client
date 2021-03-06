import axios from 'axios';
import axiosRetry from 'axios-retry';

const defaults = {
    retry: true
};

const retryDefaults = {
    retries: 3, retryDelay: axiosRetry.exponentialDelay
};

export function createAxios(options = {}) {
    let { retry, ...config } = { ...defaults, ...options };
    const client = axios.create(config);
    
    if (retry === true || typeof retry === 'object') {
        axiosRetry(client, { ...retryDefaults, ...retry });
    } else if (typeof retry === 'number') {
        axiosRetry(client, { ...retryDefaults, retries: retry });
    }

    return client;
};
