const db = require('./db');
const utils = require('./utils');

module.exports = {
  getUsers,
  addUser,
  removeUser
};

async function getUsers({
  room,
  year = utils.getYear(),
  week = utils.getWeekNumber()
}) {
  const users = await db
    .select('*')
    .from('users')
    .where({
      room_id: room,
      year,
      week
    });

  return users.map((user) => ({
    userId: user.user_id,
    room: user.room_id,
    week: user.week,
    year: user.year
  }));
}

async function addUser({
  user,
  room,
  year = utils.getYear(),
  week = utils.getWeekNumber()
}) {
  await db.insert({ user_id: user, room_id: room, year, week }).into('users');
}

async function removeUser({
  user,
  room,
  year = utils.getYear(),
  week = utils.getWeekNumber()
}) {
  await db('users')
    .where({ user_id: user, room_id: room, year, week })
    .del();
}
