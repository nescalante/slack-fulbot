const serviceFactory = require('./service');

console.log('fulbot starting');

module.exports = function controller(robot) {
  const service = serviceFactory(robot);

  robot.hear(/(^lista$|^quienes (juegan|van){1}$)/i, service.getUsers);
  robot.hear(/^(juego|voy|\+1)$/i, service.addUser);
  robot.hear(/^(me bajo|-1|no juego|no voy)$/i, service.removeUser);
};
