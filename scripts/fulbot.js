'use strict';

const fs = require('fs');
const path = require('path');

let MAX_USERS_NUMBER;

if (process.env.MAX_USERS_NUMBER) {
  MAX_USERS_NUMBER = JSON.parse(process.env.MAX_USERS_NUMBER);
} else {
  MAX_USERS_NUMBER = 0;
}

module.exports = function fulbot(robot) {
  robot.hear(/(^lista$|^quienes (juegan|van){1}$)/i, (res) => {
    const roomName = res.message.room;
    showUsers(roomName);
  });

  robot.hear(/(^reglas$)/i, (res) => {
    const roomName = res.message.room;
    showRules(roomName);
  });

  robot.hear(/(^equipos$)/i, (res) => {
    const roomName = res.message.room;
    buildRandomTeams(roomName);
  });

  robot.hear(/^(juego|voy|\+1)$/i, (res) => {
    const roomName = res.message.room;
    const user = res.message.user;

    addUser(roomName, user);
  });

  robot.hear(/@(.+) (juega|va)$/, (res) => {
    const roomName = res.message.room;
    const match = /<@(.+)> (juega|va)$/.exec(res.message.rawText);

    if (match) {
      const userId = match[1];
      const user = { id: userId };

      addUser(roomName, user, true);
    }
  });

  robot.hear(/^(me bajo|-1|no juego|no voy)$/i, (res) => {
    const roomName = res.message.room;
    const user = res.message.user;

    removeUser(roomName, user.id);
  });

  robot.hear(/@(.+) no (juega|va)$/, (res) => {
    const roomName = res.message.room;
    const match = /<@(.+)> no (juega|va)$/.exec(res.message.rawText);

    if (match) {
      const userId = match[1];

      removeUser(roomName, userId, true);
    }
  });

  robot.respond(/(^help$)/i, (res) => {
    const roomName = res.message.room;
    showHelp(roomName);
  });

  function addUser(roomName, user, isExternal) {
    if (isValidRoom(roomName)) {
      const usersNumber = getMaxUsersNumber(roomName);
      const list = getMatch(roomName);
      const prevList = list.length;

      if (!list.some(i => i.id === user.id)) {
        list.push({ id: user.id, name: user.name });
        updateMatch(roomName, list);
      }

      if (list.length !== prevList) {
        let replyMessage;
        if (usersNumber && list.length > usersNumber) {
          replyMessage = `anotado de suplente <@${user.id}>`;
        } else {
          replyMessage = `anotado <@${user.id}>`;
        }

        if (list.length < usersNumber) {
          const pendingUsers = usersNumber - list.length;
          replyMessage += `, falta${pendingUsers > 1 ? 'n' : ''} ${pendingUsers}`;
        }

        if (usersNumber && list.length !== usersNumber) {
          robot.messageRoom(roomName, replyMessage);
        } else {
          showUsers(roomName);
        }
      } else {
        const replyMessage = `${isExternal ? 'ya estaba anotado' : 'ya estabas anotado,'} <@${user.id}>`;
        robot.messageRoom(roomName, replyMessage);
      }
    }
  }

  function removeUser(roomName, userId, isExternal) {
    if (isValidRoom(roomName)) {
      const usersNumber = getMaxUsersNumber(roomName);
      let list = getMatch(roomName);
      const prevList = list.length;
      const isConfirmed = !!getMatch(roomName)
        .find((u, ix) => ix < usersNumber && u.id === userId);
      const initialLength = list.length;

      list = list.filter(i => i.id !== userId);

      if (list.length !== initialLength) {
        updateMatch(roomName, list);
      }

      if (list.length !== prevList) {
        let replyMessage = `removido <@${userId}>`;

        if (list.length < usersNumber) {
          const pendingUsers = usersNumber - list.length;
          replyMessage += `, ahora falta${pendingUsers > 1 ? 'n' : ''} ${pendingUsers}`;
        } else if (isConfirmed) {
          replyMessage += `, entra <@${list[usersNumber - 1].id}>`;
        }

        robot.messageRoom(roomName, replyMessage);
      } else {
        const replyMessage = `${isExternal ? 'no estaba anotado ' : 'no estabas anotado,'} <@${userId}>`;

        robot.messageRoom(roomName, replyMessage);
      }
    }
  }

  function getMatch(roomName) {
    const matchKey = getMatchKey(roomName);

    return robot.brain.get(matchKey) || [];
  }

  function getMatchKey(roomName) {
    const now = Date.now();
    const year = new Date().getFullYear();

    return `${roomName}_${year}_${getWeekNumber(now)}_match`;
  }

  function isValidRoom(roomName) {
    if (process.env.ROOM) {
      return process.env.ROOM.split(';').some(r => r === roomName);
    }

    return true;
  }

  function updateMatch(roomName, list) {
    const matchKey = getMatchKey(roomName);
    robot.brain.set(matchKey, list);
  }

  function showUsers(roomName) {
    const list = getMatch(roomName);
    const totalUsers = list.length;
    const usersNumber = getMaxUsersNumber(roomName);
    const usersToComplete = usersNumber - totalUsers;

    if (totalUsers) {
      const titulares = usersNumber ? list.slice(0, usersNumber) : list;
      let message = `anotados (${totalUsers}): \n`;
      message += listPlayers(titulares);

      if (usersNumber) {
        const suplentes = list.slice(usersNumber);
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
          message += listPlayers(suplentes);
        }
      }

      robot.messageRoom(roomName, message);
    } else {
      robot.messageRoom(roomName, 'no hay jugadores anotados');
    }
  }

  function showHelp(roomName) {
    const rulesPath = path.join(__dirname, '../assets/help.txt');
    const rules = fs.readFileSync(rulesPath);
    robot.messageRoom(roomName, rules.toString());
  }

  function showRules(roomName) {
    const rulesPath = path.join(__dirname, '../assets/rules.txt');
    const rules = fs.readFileSync(rulesPath);
    robot.messageRoom(roomName, rules.toString());
  }

  function buildRandomTeams(roomName) {
    const list = getMatch(roomName).slice(0);
    const usersNumber = getMaxUsersNumber(roomName);

    if (list.length) {
      if (list.length >= usersNumber) {
        const newList = [];
        const tempList = list.slice(0, usersNumber);
        for (let i = 0; i < usersNumber; i += 1) {
          const pos = Math.floor((Math.random() * usersNumber) - i);
          newList[i] = tempList.splice(pos, 1)[0];
        }

        const teamOne = newList.slice(0, usersNumber / 2);
        const teamTwo = newList.slice(usersNumber / 2, usersNumber);

        robot.messageRoom(roomName, showTeam('*Equipo 1*', teamOne));
        robot.messageRoom(roomName, '\n\n');
        robot.messageRoom(roomName, showTeam('*Equipo 2*', teamTwo));
      } else {
        robot.messageRoom(roomName, `No hay suficientes jugadores anotados. Faltan ${usersNumber - list.length}`);
      }
    } else {
      robot.messageRoom(roomName, `No hay suficientes jugadores anotados. Faltan ${usersNumber - list.length}`);
    }
  }

  function showTeam(teamName, players) {
    let message = `${teamName}:\n`;
    message += listPlayers(players);
    return message;
  }

  function listPlayers(players) {
    return players.map(i => `- <@${i.id}>`).join('\n');
  }

  function getWeekNumber(d) {
    // eslint-disable-next-line no-param-reassign
    d = new Date(+d);
    d.setHours(0, 0, 0);
    // eslint-disable-next-line no-mixed-operators
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));

    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);

    return weekNo;
  }
};

function getMaxUsersNumber(roomName) {
  if (typeof MAX_USERS_NUMBER === 'object') {
    return MAX_USERS_NUMBER[roomName] || 0;
  }
  return MAX_USERS_NUMBER;
}
