const repository = require('./repository');
const messages = require('./messages');

module.exports = function commands(robot) {
  return {
    getUsers,
    addUser,
    addAnotherUser,
    removeUser,
    removeAnotherUser
  };

  async function getUsers(res) {
    const { room } = res.message;
    const users = await repository.getUsers({ room });
    const limit = 12;
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
    const limit = 12;
    const message = messages.addUser(users, userId, exists, limit);

    robot.messageRoom(room, message);
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
      const limit = 12;
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
    const limit = 12;
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
      const limit = 12;
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

      return;
    }
  }
};
