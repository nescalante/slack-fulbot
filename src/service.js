const repository = require('./repository');
const messages = require('./messages');

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
    const limit = 10;
    const message = messages.getUsersWithLimit(users, limit);

    robot.messageRoom(room, message);
  }

  async function addUser(res) {
    const { room } = res.message;
    const { id: userId } = res.message.user;
    const exists = await repository.addUser({
      userId,
      room
    });
    const users = await repository.getUsers({
      room
    });
    const limit = 10;
    const message = messages.addUser(users, userId, exists, limit);

    robot.messageRoom(room, message);
  }

  async function buildRandomTeams(res) {
    const { room } = res.message;
    const users = await repository.getUsers({
      room
    });
    const limit = 10;

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
          `No hay suficientes jugadores anotados. Faltan ${limit -
            users.length}`
        );
      }
    } else {
      robot.messageRoom(
        room,
        `No hay suficientes jugadores anotados. Faltan ${limit - users.length}`
      );
    }
  }

  function showTeam(teamName, players) {
    let message = `${teamName}:\n`;

    message += messages.listUsers(players);

    return message;
  }

  async function addAnotherUser(res) {
    const { room } = res.message;
    const match = /<@(\S+)> (juega|va)$/.exec(res.message.rawText);

    if (match) {
      const userId = match[1];

      const exists = await repository.addUser({
        userId,
        room
      });
      const users = await repository.getUsers({
        room
      });
      const limit = 10;
      const message = messages.addUser(users, userId, exists, limit);

      robot.messageRoom(room, message);

      return;
    }

    const noUserMatch = /@(\S+) (juega|va)$/.exec(res.message.text);

    if (noUserMatch) {
      const userName = noUserMatch[1];

      await repository.addUser({
        userName,
        room
      });

      const message = `anotado ${userName}`;
      robot.messageRoom(room, message);
    }
  }

  async function removeUser(res) {
    const { room } = res.message;
    const { id: userId } = res.message.user;

    await repository.removeUser({
      userId,
      room
    });

    const users = await repository.getUsers({
      room
    });
    const limit = 10;
    const message = messages.removeUser(users, userId, limit);

    robot.messageRoom(room, message);
  }

  async function removeAnotherUser(res) {
    const { room } = res.message;
    const match = /<@(\S+)> no (juega|va)$/.exec(res.message.rawText);

    if (match) {
      const userId = match[1];

      await repository.removeUser({
        userId,
        room
      });

      const users = await repository.getUsers({
        room
      });
      const limit = 10;
      const message = messages.removeUser(users, userId, limit);

      robot.messageRoom(room, message);

      return;
    }

    const noUserMatch = /@(\S+) no (juega|va)$/.exec(res.message.text);

    if (noUserMatch) {
      const userName = noUserMatch[1];

      await repository.removeUser({
        room,
        userName
      });

      const message = `removido ${userName}`;
      robot.messageRoom(room, message);
    }
  }
};
