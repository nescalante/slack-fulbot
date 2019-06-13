const repository = require('./repository');
const messages = require('./messages');

module.exports = function commands(robot) {
  return {
    getUsers,
    addUser,
    removeUser
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

    robot.messageRoom(res.message.room, message);
  }
};
