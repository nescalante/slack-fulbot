const repository = require('./repository');
const messages = require('./messages');

const limit = 10;

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

    const users = await repository.getUsers({ room });
    const message = messages.getUsersWithLimit(users, limit);

    robot.messageRoom(room, message);
  }

  async function buildRandomTeams(res) {
    const { room } = res.message;

    const users = await repository.getUsers({ room });

    if (users.length && users.length >= limit) {
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
          (users ? users.length : 0)}`
      );
    }
  }

  function showTeam(teamName, players) {
    let message = `${teamName}:\n`;

    message += messages.listUsers(players);

    return message;
  }

  // ********************************************************************
  // ********** Adding **********
  // ********************************************************************

  function matchAddUser(res) {
    let user;

    const match = /<@(\S+)> (juega|va)$/.exec(res.message.rawText);
    if (match) {
      user = { userId: match[1] };
    }
    const noUserMatch = /@(\S+) (juega|va)$/.exec(res.message.text);
    if (noUserMatch) {
      user = { userName: noUserMatch[1] };
    }

    return user;
  }

  async function addUser(res) {
    const { room } = res.message;

    const user = { userId: res.message.user };

    await doAddUser({ user, room });
  }

  async function addAnotherUser(res) {
    const { room } = res.message;

    const user = matchAddUser(res);
    if (!user) {
      // no user found!
      return;
    }

    await doAddUser({ user, room });
  }

  async function doAddUser({ user, room }) {
    const exists = await repository.addUser({
      ...user,
      room
    });

    const users = await repository.getUsers({ room });

    const message = messages.addUser(users, user, exists, limit);

    robot.messageRoom(room, message);
  }

  // ********************************************************************
  // ********** Removing **********
  // ********************************************************************

  function matchRemoveUser(res) {
    let user;

    const match = /<@(\S+)> no (juega|va)$/.exec(res.message.rawText);
    if (match) {
      user = { userId: match[1] };
    }

    const noUserMatch = /@(\S+) no (juega|va)$/.exec(res.message.text);
    if (noUserMatch) {
      user = { userName: noUserMatch[1] };
    }

    return user;
  }

  async function removeUser(res) {
    const { room } = res.message;

    const user = { userId: res.message.user };

    await doRemoveUser({ user, room });
  }

  async function removeAnotherUser(res) {
    const { room } = res.message;

    const user = matchRemoveUser(res);
    if (!user) {
      // no user found!
      return;
    }

    await doRemoveUser({ user, room });
  }

  async function doRemoveUser({ user, room }) {
    await repository.removeUser({
      ...user,
      room
    });

    const message = messages.removeUser(user);

    robot.messageRoom(room, message);
  }
};
