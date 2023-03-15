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
  room,
  year = utils.getYear(),
  week = utils.getWeekNumber()
}) {
  try {
    log('getting users for room', room);

    const users = await db
      .select('*')
      .from('users')
      .where({
        room_id: room,
        year,
        week
      });

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
  userId,
  userName,
  room,
  year = utils.getYear(),
  week = utils.getWeekNumber()
}) {
  try {
    let exists;

    if (!userName && !userId) {
      throw new Error('Need to provide one of userId or userName');
    }

    log('adding user', userId || userName, room);

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
          .into('users')
          .transacting(transaction);

        log('user added', userId || userName);
      } else {
        log('user already exists');
      }

      await transaction.commit();
    });

    return exists;
  } catch (error) {
    log('failed while adding user', error.message);

    throw error;
  }
}

async function removeUser({
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

    await db('users')
      .where({
        user_id: userId || userName,
        room_id: room,
        year,
        week,
        is_external: !!userName
      })
      .del();

    log('user removed', userId || userName, room);
  } catch (error) {
    log('failed while adding user', error.message);

    throw error;
  }
}
