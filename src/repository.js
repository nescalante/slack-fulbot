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
  userId,
  room,
  year = utils.getYear(),
  week = utils.getWeekNumber()
}) {
  let exists;

  await db.transaction(async (transaction) => {
    const users = await getUsers({ room, year, week });
    exists = users.some((user) => user.userId === userId);

    if (!exists) {
      await db
        .insert({ user_id: userId, room_id: room, year, week })
        .into('users');
    }

    await transaction.commit();
  });

  return exists;
}

async function removeUser({
  userId,
  room,
  year = utils.getYear(),
  week = utils.getWeekNumber()
}) {
  await db('users')
    .where({ user_id: userId, room_id: room, year, week })
    .del();
}
