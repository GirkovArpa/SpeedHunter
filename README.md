Generic Node/MySQL website for u/SpeedHunter where account creation is behind a PayPal paywall.

# Purchase
![Animated screen capture from Imgur](https://i.imgur.com/Zmau9Ta.gif)


# Login 
![Animated screen capture from Imgur](https://i.imgur.com/LeOieRv.gif)

# Note

It takes about a minute for PayPal to notify your server of an account purchase.  It's highly unlikely, but possible, that a second person purchases an account with the same name during this small window.  However, they would be distinguished in the database by the unique `id` column.

# Configuring PayPal webhook

- Go here: https://developer.paypal.com/developer/applications
- Click `Default Application`
- Click `Add Webhook`
- Set the URL to: https://<your_website>/super_secret_paypal_url
- Subscribe to all events

For testing purposes, you can use the free application `ngrok.exe` to establish a temporary public URL for your test server running @ `localhost`.  Your webhook URL must be the `https` version of the URLs `ngrok` gives you.

# Running

The server requires the following environment variables to be defined.  `HEX_DIGITS` is any string of 64 random hex digits for the purposes of encrypting the user's password when sent to and from PayPal (read why their password is sent to PayPal [here](https://stackoverflow.com/questions/57349174/where-to-enter-paypal-ipn-url-and-how-to-pass-custom-data)).

`SESSION_SECRET` is any secret string; read more [here](https://stackoverflow.com/questions/5343131/what-is-the-sessions-secret-option).

`SB_CLIENT_ID` is obtained from PayPal; you can read how to get it [here](https://developer.paypal.com/docs/checkout/integrate/#2-add-the-paypal-javascript-sdk-to-your-web-page).

`PRICE` is in `USD`.  I am not sure whether PayPal will automatically convert payments to `USD` before notifying your server about them.

```
SESSION_SECRET=some_super_secret_key 
PORT= 
HEX_DIGITS=825ef45bb837ea32f7764a20b40f3f16aff05df75d4e9d7ea56ecc38a3d1d490
SB_CLIENT_ID=
PRICE=1337 
SQL_HOST=
SQL_USER=
SQL_PASSWORD= 
SQL_DATABASE=
```

To run the server, run the above followed by `node index`.