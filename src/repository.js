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
    userId: user.is_external ? null : user.user_id,
    userName: user.is_external ? user.user_id : null,
    room: user.room_id,
    week: user.week,
    year: user.year
  }));
}

async function addUser({
  userId,
  userName,
  room,
  year = utils.getYear(),
  week = utils.getWeekNumber()
}) {
  let exists;

  if (!userName && !userId) {
    throw new Error('Need to provide one of userId or userName');
  }

  await db.transaction(async (transaction) => {
    const users = await getUsers({ room, year, week });
    exists = users.some((user) => user.userId === userId);

    if (!exists) {
      await db
        .insert({
          user_id: userId || userName,
          room_id: room,
          year,
          week,
          is_external: !!userName
        })
        .into('users');
    }

    await transaction.commit();
  });

  return exists;
}

async function removeUser({
  userId,
  userName,
  room,
  year = utils.getYear(),
  week = utils.getWeekNumber()
}) {
  if (!userName && !userId) {
    throw new Error('Need to provide one of userId or userName');
  }

  await db('users')
    .where({
      user_id: userId || userName,
      room_id: room,
      year,
      week,
      is_external: !!userName
    })
    .del();
}
