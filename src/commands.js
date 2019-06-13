const service = require('./service');
const { getWeekNumber, getYear } = require('./utils');

module.exports = function commands(robot) {
  return {
    getUsers,
    addUser,
    removeUser
  };

  async function getUsers(res) {
    const room = res.message.room;
    const list = await service.getUsers({ room });
    const totalUsers = list.length;
    const usersNumber = 12; // getMaxUsersNumber(roomId);
    const usersToComplete = usersNumber - totalUsers;

    if (totalUsers) {
      const main = usersNumber ? list.slice(0, usersNumber) : list;
      let message = `anotados (${totalUsers}): \n`;

      message += listUsers(main);

      if (usersNumber) {
        const substitutes = list.slice(usersNumber);
        message += '\n';

        if (usersToComplete === 1) {
          message += `falta ${usersToComplete}`;
        } else if (usersToComplete > 0) {
          message += `faltan ${usersToComplete}`;
        } else {
          message += 'completamos!';
        }

        if (totalUsers > usersNumber) {
          message += '\n-------------\nsuplentes: \n';
          message += listUsers(substitutes);
        }
      }

      robot.messageRoom(room, message);
    } else {
      robot.messageRoom(room, 'no hay jugadores anotados');
    }
  }

  async function addUser(res) {
    await service.addUser({
      user: res.message.user.id,
      room: res.message.room
    });

    robot.messageRoom(res.message.room, 'ok');
  }

  async function removeUser(res) {
    await service.removeUser({
      user: res.message.user.id,
      room: res.message.room
    });

    robot.messageRoom(res.message.room, 'ok');
  }

  function listUsers(users) {
    return users.map(({ userId }) => `- <@${userId}>`).join('\n');
  }
};
