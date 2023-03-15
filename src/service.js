const debug = require('debug');
const repository = require('./repository');
const messages = require('./messages');
const db = require('./db');

const log = debug('fulbot:service');

const LIMIT = 10;

module.exports = function commands(robot) {
  return {
    buildRandomTeams,
    getUsers,
    addUser,
    addAnotherUser,
    removeUser,
    removeAnotherUser
  };

  async function getUsers(res) {
    const { room } = res.message;

    const client = await db.getClient();

    log('getting users', room);
    const users = await repository.getUsers({ client, room });
    const limit = LIMIT;
    const message = messages.getUsersWithLimit(users, limit);

    robot.messageRoom(room, message);
    client.release();
  }

  async function addUser(res) {
    const { room } = res.message;
    const { id: userId } = res.message.user;
    const client = await db.getClient();

    log('adding user: ', userId, room);

    const exists = await repository.addUser({
      client,
      userId,
      room
    });
    const users = await repository.getUsers({
      client,
      room
    });
    const limit = LIMIT;
    const message = messages.addUser(users, userId, exists, limit);

    robot.messageRoom(room, message);
    client.release();
  }

  async function buildRandomTeams(res) {
    const { room } = res.message;
    const client = await db.getClient();

    log('creating teams: ', room);

    const users = await repository.getUsers({
      client,
      room
    });
    const limit = LIMIT;

    if (users.length) {
      if (users.length >= limit) {
        const newUsers = [];
        const tempUsers = users.slice(0, limit);
        for (let i = 0; i < limit; i += 1) {
          const pos = Math.floor(Math.random() * limit - i);
          // eslint-disable-next-line
          newUsers[i] = tempUsers.splice(pos, 1)[0];
        }

        const teamOne = newUsers.slice(0, limit / 2);
        const teamTwo = newUsers.slice(limit / 2, limit);

        robot.messageRoom(room, showTeam('*Equipo 1*', teamOne));
        robot.messageRoom(room, showTeam('*Equipo 2*', teamTwo));
      } else {
        robot.messageRoom(
          room,
          `No hay suficientes jugadores anotad☀️s. Faltan ${limit -
            users.length}`
        );
      }
    } else {
      robot.messageRoom(
        room,
        `No hay suficientes jugadores anotad☀️s. Faltan ${limit - users.length}`
      );
    }

    client.release();
  }

  function showTeam(teamName, players) {
    let message = `${teamName}:\n`;

    message += messages.listUsers(players);

    return message;
  }

  async function addAnotherUser(res) {
    const { room } = res.message;
    const client = await db.getClient();
    const match = /<@(\S+)> (juega|va)$/.exec(res.message.rawText);

    log('add another user: ', room);

    if (match) {
      const userId = match[1];

      const exists = await repository.addUser({
        client,
        userId,
        room
      });
      const users = await repository.getUsers({
        client,
        room
      });
      const limit = LIMIT;
      const message = messages.addUser(users, userId, exists, limit);

      robot.messageRoom(room, message);
      client.release();

      return;
    }

    const noUserMatch = /@(\S+) (juega|va)$/.exec(res.message.text);

    if (noUserMatch) {
      const userName = noUserMatch[1];

      await repository.addUser({
        client,
        userName,
        room
      });

      const message = `anotad☀️ ${userName}`;
      robot.messageRoom(room, message);
    }

    client.release();
  }

  async function removeUser(res) {
    const { room } = res.message;
    const { id: userId } = res.message.user;
    const client = await db.getClient();

    log('removing user: ', userId, room);

    await repository.removeUser({
      client,
      userId,
      room
    });

    const users = await repository.getUsers({
      client,
      room
    });
    const limit = LIMIT;
    const message = messages.removeUser(users, userId, limit);

    robot.messageRoom(room, message);
    client.release();
  }

  async function removeAnotherUser(res) {
    const { room } = res.message;
    const client = await db.getClient();
    const match = /<@(\S+)> no (juega|va)$/.exec(res.message.rawText);

    log('removing another user: ', room);

    if (match) {
      const userId = match[1];

      await repository.removeUser({
        client,
        userId,
        room
      });

      const users = await repository.getUsers({
        client,
        room
      });
      const limit = LIMIT;
      const message = messages.removeUser(users, userId, limit);

      robot.messageRoom(room, message);
      client.release();

      return;
    }

    const noUserMatch = /@(\S+) no (juega|va)$/.exec(res.message.text);

    if (noUserMatch) {
      const userName = noUserMatch[1];

      await repository.removeUser({
        client,
        room,
        userName
      });

      const message = `removido ${userName}`;
      robot.messageRoom(room, message);
    }

    client.release();
  }
};
