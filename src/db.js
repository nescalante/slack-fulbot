console.log('connecting using', `${process.env.DATABASE_URL}?ssl=true`);

const db = require('knex')({
  client: 'pg',
  connection: `${process.env.DATABASE_URL}?ssl=true`
});

module.exports = db;
