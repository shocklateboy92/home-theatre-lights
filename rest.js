const fetch = require('node-fetch');

const token = require('./creds').token;

function authFetch(url, callback) {
    fetch(
        url,
        {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }
    )
    .then(response => response.json())
    .then(callback);
}

let endpoint = '';

function updateEndpoints() {
    authFetch(
        'https://graph.api.smartthings.com/api/smartapps/endpoints',
        response => {
            console.log(JSON.stringify(response, null, 4));
            endpoint = response[0].uri;
        }
    );
}

exports.init = () => {
    // const url = 'https://graph.api.smartthings.com/oauth/token';
    // fetch (url, {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/x-www-form-urlencoded'
    //     },
    //     body: `grant_type=authorization_code&code=Zz9Axl&client_id=77363fd9-e920-4e85-aa81-dca4f5ec044a&client_secret=b9975d03-e21e-4f95-ac46-6a399c9615ae&redirect_uri=http://localhost:4567/oauth/callback`
    // })
    // .then(response => response.json())
    // .then(json => {
    //     console.log(json);
    //     token = json.access_token;

    //     // authFetch(
    //     //     'https://graph.api.smartthings.com/api/smartapps/endpoints',
    //     //     response => {
    //     //         console.log(response);
    //     //     });
    // });
    updateEndpoints();
}

exports.dimLights = () => {
    authFetch(
        endpoint + '/dim',
        result => console.log(`>>> successfully made dim lights request: ${JSON.stringify(result)}`)
    );
}