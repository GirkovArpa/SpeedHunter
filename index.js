'use strict';

const {
  SQL_HOST,
  SQL_USER,
  SQL_PASSWORD,
  SQL_DATABASE,
  SESSION_SECRET, // https://stackoverflow.com/questions/5343131/what-is-the-sessions-secret-option
  PORT,
  SB_CLIENT_ID, // https://developer.paypal.com/docs/checkout/integrate/#2-add-the-paypal-javascript-sdk-to-your-web-page
  PRICE
} = process.env; 

const
  { encrypt, decrypt } = require('./encrypt'), // to avoid sending user's plaintext password to PayPal's servers
  mysql = require('mysql'),
  express = require('express'),
  session = require('express-session'),
  bodyParser = require('body-parser'),
  path = require('path'),
  connection = mysql.createConnection({
    host: SQL_HOST,
    user: SQL_USER,
    password: SQL_PASSWORD,
    database: SQL_DATABASE
  }),
  app = express();

app.set('view engine', 'ejs');

app.use(session({
  secret: SESSION_SECRET,
  resave: true,
  saveUninitialized: true
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get(['/', '/home'], (request, response) => {
  const { loggedin, username } = request.session;
  if (loggedin)
    response.render('home', { username }); // allow access to homepage
  else
    response.redirect('/login'); // force user to login before accessing homepage
});

app.get('/login*', (request, response) => {
  response.render('login', {
    thankyou: request.query.thankyou, // whether user should be told thanks for just completing a purchase
    username: request.query.username,
    incorrect: false, // whether they typed in wrong username or password
    alreadytaken: false // whether they tried to signup for an account whose username was already taken
  });
  response.end();
});

app.post('/signup', (request, response) => {
  let { username, password, email } = request.body;
  // clean user input of values that would clash with ejs
  username = username.replace(/[^\w]/g, '');
  password = password.replace(/`|:/g, '');
  email = email.replace(/`|:/g, '');
  connection.query('SELECT * FROM accounts WHERE username = ? ', [username],
    (error, results, fields) => {
      if (results.length > 0) { // an account with this username already exists!
        response.render('login', { username, thankyou: false, incorrect: false, alreadytaken: true });
      } else { // account name not taken, send user to account-purchase page
        const password_encrypted = encrypt(password);
        if (`${username}::${email}::${password_encrypted}`.length > 127) {
          console.log('invoice_id maxlen exceeded');
          console.log(`${username}::${email}::${password_encrypted}`);
          response.render('login', { username, thankyou: false, incorrect: false, alreadytaken: false });
        } else {
          response.render('signup', { username, password: password_encrypted, email, SB_CLIENT_ID, PRICE });
        }
      }
      response.end();
    });
});

app.post('/login', (request, response) => {
  const { username, password } = request.body;
  if (username && password) { // username and password aren't blank
    connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password],
      (error, results, fields) => {
        if (results.length > 0) { // account found matching the username + password combo
          request.session.loggedin = true;
          request.session.username = username;
          response.redirect('/home');
        } else { // wrong password or username!
          response.render('login', { username, thankyou: false, incorrect: true, alreadytaken: false });
        }
        response.end();
      });
  } else { // username or password was blank
    response.render('login', { username, thankyou: false, incorrect: true, alreadytaken: false });
  }
});

app.post('/super_secret_paypal_url', (request, response) => { // paypal sends purchase message to this URL about a minute after purchase
  // anyone who knows this URL can create infinite free accounts
  const { body } = request;
  if (body.event_type == 'PAYMENT.CAPTURE.COMPLETED') {
    const { resource } = body;
    const { value, currency_code } = resource.amount;

    if (+value == +PRICE && currency_code == 'USD') { // works for integer prices but not all decimal prices
      const [username, email, password] = resource.invoice_id.split('::');

      console.log('The following account was purchased:');
      console.log({ username, email, password: decrypt(password) });

      // create the new account
      connection.query('INSERT INTO accounts (username, password, email) VALUES (?, ?, ?)', [username, decrypt(password), email],
        (error, results, fields) => error && console.log(error));
    }
  }
  response.sendStatus(200);
});

app.listen(PORT);
console.log(`Server online @ port ${PORT}`);

