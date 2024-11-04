const axios = require("axios");
const fs = require("fs");
const { exec } = require("child_process");

const proxyUrl = 'https://proxylist.geonode.com/api/proxy-list?limit=500&page=1&sort_by=lastChecked&sort_type=desc';
const outputFilePath = './working_proxies.txt';

const checkProxy = async (proxy) => {
    try {
        const proxyConfig = {
            protocol: proxy.protocols[0], // Use the first protocol, e.g., 'socks4'
            host: proxy.ip,
            port: proxy.port,
        };
        
        const testResponse = await axios.get("https://httpbin.org/ip", {
            proxy: proxyConfig,
            timeout: 5000, // Set timeout to 5 seconds
        });
        
        if (testResponse.status === 200) {
            return `${proxyConfig.protocol}://${proxyConfig.host}:${proxyConfig.port}`;
        }
    } catch (error) {
        console.error(`Failed to connect with ${proxy.ip}:${proxy.port}`);
        return null;
    }
};

const saveToFile = (workingProxy) => {
    fs.appendFileSync(outputFilePath, workingProxy + "\n", "utf8");
};

const pushToGitHub = () => {
    exec("git add working_proxies.txt && git commit -m 'Update working proxies' && git push", (error, stdout, stderr) => {
        if (error) {
            console.error(`Error pushing to GitHub: ${error.message}`);
            return;
        }
        console.log("Successfully pushed to GitHub:", stdout);
    });
};

const getProxies = async () => {
    try {
        const response = await axios.get(proxyUrl);
        const proxies = response.data.data;

        for (const proxy of proxies) {
            const workingProxy = await checkProxy(proxy);
            if (workingProxy) {
                console.log(`Working Proxy: ${workingProxy}`);
                saveToFile(workingProxy);
            }
        }
        
        // Push the updated file to GitHub
        pushToGitHub();
        
    } catch (error) {
        console.error(error);
    }
};

getProxies();
