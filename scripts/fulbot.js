'use strict';

module.exports = function fulbot(robot) {
  const commands = require('../src/commands')(robot);

  robot.hear(/(^lista$|^quienes (juegan|van){1}$)/i, commands.getUsers);
  robot.hear(/^(juego|voy|\+1)$/i, commands.addUser);
  robot.hear(/^(me bajo|-1|no juego|no voy)$/i, commands.removeUser);
};
