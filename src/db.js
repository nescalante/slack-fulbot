console.log('connecting using', `${process.env.DATABASE_URL}?sslmode=require`);

const db = require('knex')({
  client: 'pg',
  connection: `${process.env.DATABASE_URL}?sslmode=require`
});

module.exports = db;
