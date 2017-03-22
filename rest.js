const fetch = require('node-fetch');

let token = '';

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
    .then(callback)
    .then(response => console.log(response));
}

exports.init = () => {
    const url = 'https://graph.api.smartthings.com/oauth/token';
    fetch (url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `grant_type=authorization_code&code=Zz9Axl&client_id=77363fd9-e920-4e85-aa81-dca4f5ec044a&client_secret=b9975d03-e21e-4f95-ac46-6a399c9615ae&redirect_uri=http://localhost:4567/oauth/callback`
    })
    .then(response => response.json())
    .then(json => {
        console.log(json);
        token = json.access_token;

        // authFetch(
        //     'https://graph.api.smartthings.com/api/smartapps/endpoints',
        //     response => {
        //         console.log(response);
        //     });
    });
}

exports.dimLights = () => {

}