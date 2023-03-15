const debug = require('debug');
const db = require('./db');
const utils = require('./utils');

const log = debug('fulbot:repository');

module.exports = {
  getUsers,
  addUser,
  removeUser
};

async function getUsers({
  client,
  room,
  year = utils.getYear(),
  week = utils.getWeekNumber()
}) {
  try {
    log('getting users for room', room);

    const res = await db.execute(
      client,
      'SELECT * from users where room_id = $1 AND year::text = $2 AND week::text = $3',
      [room, year, week]
    );
    const users = res.rows;

    log(`got ${users.length} users`);

    return users.map((user) => ({
      userId: user.is_external ? null : user.user_id,
      userName: user.is_external ? user.user_id : null,
      room: user.room_id,
      week: user.week,
      year: user.year
    }));
  } catch (error) {
    log('failed while getting users', error.message);

    throw error;
  }
}

async function addUser({
  client,
  userId,
  userName,
  room,
  year = utils.getYear(),
  week = utils.getWeekNumber()
}) {
  try {
    if (!userName && !userId) {
      throw new Error('Need to provide one of userId or userName');
    }

    log('adding user', userId || userName, room);

    await db.execute(client, 'BEGIN');

    const users = await getUsers({ client, room, year, week });
    const exists = users.some((user) => user.userId === userId);

    if (!exists) {
      await db.execute(
        client,
        'INSERT INTO users(user_id, room_id, year, week, is_external) VALUES($1, $2, $3, $4, $5)',
        [userId || userName, room, year, week, !!userName]
      );

      log('user added', userId || userName);
    } else {
      log('user already exists');
    }

    await db.execute(client, 'COMMIT');

    return exists;
  } catch (error) {
    log('failed while adding user', error.message);

    throw error;
  }
}

async function removeUser({
  client,
  userId,
  userName,
  room,
  year = utils.getYear(),
  week = utils.getWeekNumber()
}) {
  try {
    if (!userName && !userId) {
      throw new Error('Need to provide one of userId or userName');
    }

    log('removing user', userId || userName, room);

    await db.execute(
      client,
      'DELETE from users where user_id = $1 AND room_id = $2 AND year::text = $3 AND week::text = $4 AND is_external::text = $5',
      [userId || userName, room, year, week, !!userName]
    );

    log('user removed', userId || userName, room);
  } catch (error) {
    log('failed while adding user', error.message);

    throw error;
  }
}
