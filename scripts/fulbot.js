'use strict';

// eslint-disable-next-line no-console
console.log('fulbot starting');

const serviceFactory = require('../src/service');

module.exports = function main(robot) {
  const service = serviceFactory(robot);

  robot.hear(/(^equipos$)/i, service.buildRandomTeams);
  robot.hear(/(^lista$|^quienes (juegan|van){1}$)/i, service.getUsers);
  robot.hear(/^(juego|voy|\+1)$/i, service.addUser);
  robot.hear(/@(\S+) (juega|va)$/, service.addAnotherUser);
  robot.hear(/^(me bajo|-1|no juego|no voy)$/i, service.removeUser);
  robot.hear(/@(\S+) no (juega|va)$/, service.removeAnotherUser);
};
