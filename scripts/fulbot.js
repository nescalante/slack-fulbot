'use strict';

const fs = require('fs');
const path = require('path');

const { WebClient } = require('@slack/client');

const helpPath = path.join(__dirname, '../assets/help.md');
const rulesPath = path.join(__dirname, '../assets/rules.md');
const help = fs.readFileSync(helpPath).toString();
const rules = fs.readFileSync(rulesPath).toString();

let MAX_USERS_NUMBER;
let ALLOW_DELETE;

if (process.env.MAX_USERS_NUMBER) {
  MAX_USERS_NUMBER = JSON.parse(process.env.MAX_USERS_NUMBER);
} else {
  MAX_USERS_NUMBER = 0;
}

if (process.env.ALLOW_DELETE) {
  ALLOW_DELETE = JSON.parse(process.env.ALLOW_DELETE);
} else {
  ALLOW_DELETE = false;
}

const token = process.env.HUBOT_SLACK_TOKEN;
const web = new WebClient(token);
const channels = {};

async function getChannelName(channel) {
  if (channels[channel]) {
    return channels[channel];
  }

  const res = await web.conversations.info({ channel });

  if (res.ok) {
    channels[channel] = res.channel.name;

    return channels[channel];
  }

  throw new Error('Invalid channel');
}

module.exports = function fulbot(robot) {
  robot.hear(/(^lista$|^quienes (juegan|van){1}$)/i, async (res) => {
    const roomId = await getChannelName(res.message.room);

    showUsers(roomId);
  });

  robot.hear(/(^borrar$)/i, async (res) => {
    const roomId = await getChannelName(res.message.room);
    const allowDelete = getAllowDelete(roomId);

    if (allowDelete) {
      const list = getMatch(roomId);

      list.forEach((user) => {
        removeUser(roomId, user, false, true);
      });

      showUsers(roomId);
    }
  });

  robot.hear(/(^reglas$)/i, async (res) => {
    const roomId = await getChannelName(res.message.room);

    robot.messageRoom(roomId, rules);
  });

  robot.hear(/(^equipos$)/i, async (res) => {
    const roomId = await getChannelName(res.message.room);

    buildRandomTeams(roomId);
  });

  robot.hear(/^(me bajo|-1|no juego|no voy)$/i, async (res) => {
    const roomId = await getChannelName(res.message.room);
    const { user } = res.message;

    removeUser(roomId, user);
  });

  robot.hear(/^(juego|voy|\+1)$/i, async (res) => {
    const roomId = await getChannelName(res.message.room);
    const { user } = res.message;

    addUser(roomId, user);
  });

  robot.hear(/@(\S+) no (juega|va)$/, async (res) => {
    const roomId = await getChannelName(res.message.room);
    const match = /<@(\S+)> no (juega|va)$/.exec(res.message.rawText);

    if (match) {
      const userId = match[1];

      removeUser(roomId, { id: userId }, true);

      return;
    }

    const noUserMatch = /@(\S+) no (juega|va)$/.exec(res.message.text);

    if (noUserMatch) {
      const userName = noUserMatch[1];

      removeUser(roomId, { id: userName, name: userName }, true);
    }
  });

  robot.hear(/@(\S+) (juega|va)$/, async (res) => {
    const roomId = await getChannelName(res.message.room);
    const match = /<@(\S+)> (juega|va)$/.exec(res.message.rawText);

    if (match) {
      const userId = match[1];
      const user = { id: userId };

      addUser(roomId, user, true);

      return;
    }

    const noUserMatch = /@(\S+) (juega|va)$/.exec(res.message.text);

    if (noUserMatch) {
      const userName = noUserMatch[1];
      const user = { id: userName, name: userName };

      addUser(roomId, user, true);
    }
  });

  robot.hear(/(^help$)/i, async (res) => {
    const roomId = await getChannelName(res.message.room);

    robot.messageRoom(roomId, help);
  });

  robot.respond(/(^help$)/i, (res) => {
    res.reply(help);
  });

  function addUser(roomId, user, isExternal) {
    const usersNumber = getMaxUsersNumber(roomId);
    const list = getMatch(roomId);
    const prevList = list.length;

    if (!list.some(i => i.id === user.id)) {
      list.push({ id: user.id, name: user.name });
      updateMatch(roomId, list);
    }

    if (list.length !== prevList) {
      let replyMessage;
      if (usersNumber && list.length > usersNumber) {
        replyMessage = `anotado de suplente ${userToString(user)}`;
      } else {
        replyMessage = `anotado ${userToString(user)}`;
      }

      if (list.length < usersNumber) {
        const pendingUsers = usersNumber - list.length;
        replyMessage += `, falta${pendingUsers > 1 ? 'n' : ''} ${pendingUsers}`;
      }

      if (usersNumber && list.length !== usersNumber) {
        robot.messageRoom(roomId, replyMessage);
      } else {
        showUsers(roomId);
      }
    } else {
      const replyMessage = `${isExternal ? 'ya estaba anotado' : 'ya estabas anotado,'} ${userToString(user)}`;
      robot.messageRoom(roomId, replyMessage);
    }
  }

  function userToString(user) {
    if (user.id === user.name) {
      return user.name;
    }

    return `<@${user.id}>`;
  }

  function removeUser(roomId, user, isExternal, silent) {
    const userId = user.id;
    const usersNumber = getMaxUsersNumber(roomId);
    let list = getMatch(roomId);
    const prevList = list.length;
    const isConfirmed = !!getMatch(roomId)
      .find((u, ix) => ix < usersNumber && u.id === userId);
    const initialLength = list.length;

    list = list.filter(i => i.id !== userId);

    if (list.length !== initialLength) {
      updateMatch(roomId, list);
    }

    if (silent) {
      return;
    }

    if (list.length !== prevList) {
      let replyMessage = `removido ${userToString(user)}`;

      if (list.length < usersNumber) {
        const pendingUsers = usersNumber - list.length;
        replyMessage += `, ahora falta${pendingUsers > 1 ? 'n' : ''} ${pendingUsers}`;
      } else if (isConfirmed) {
        replyMessage += `, entra ${userToString(list[usersNumber - 1])}`;
      }

      robot.messageRoom(roomId, replyMessage);
    } else {
      const replyMessage = `${isExternal ? 'no estaba anotado' : 'no estabas anotado,'} ${userToString(user)}`;

      robot.messageRoom(roomId, replyMessage);
    }
  }

  function getMatch(roomId) {
    const matchKey = getMatchKey(roomId);

    return robot.brain.get(matchKey) || [];
  }

  function getMatchKey(roomId) {
    const now = Date.now();
    const year = new Date().getFullYear();

    return `${roomId}_${year}_${getWeekNumber(now)}_match`;
  }

  function updateMatch(roomId, list) {
    const matchKey = getMatchKey(roomId);
    robot.brain.set(matchKey, list);
  }

  function showUsers(roomId) {
    const list = getMatch(roomId);
    const totalUsers = list.length;
    const usersNumber = getMaxUsersNumber(roomId);
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

      robot.messageRoom(roomId, message);
    } else {
      robot.messageRoom(roomId, 'no hay jugadores anotados');
    }
  }

  function buildRandomTeams(roomId) {
    const list = getMatch(roomId).slice(0);
    const usersNumber = getMaxUsersNumber(roomId);

    if (list.length) {
      if (list.length >= usersNumber) {
        const newList = [];
        const tempList = list.slice(0, usersNumber);
        for (let i = 0; i < usersNumber; i += 1) {
          const pos = Math.floor((Math.random() * usersNumber) - i);
          // eslint-disable-next-line
          newList[i] = tempList.splice(pos, 1)[0];
        }

        const teamOne = newList.slice(0, usersNumber / 2);
        const teamTwo = newList.slice(usersNumber / 2, usersNumber);

        robot.messageRoom(roomId, showTeam('*Equipo 1*', teamOne));
        robot.messageRoom(roomId, '\n\n');
        robot.messageRoom(roomId, showTeam('*Equipo 2*', teamTwo));
        robot.messageRoom(roomId, '\n\n');
        robot.messageRoom(roomId, `https://nescalante.github.io/fulbito/?id=${Date.now()}${newList.map(item => `&player=${(item.name || item.id).replace(/\./g, '')}`).join('')}`);
      } else {
        robot.messageRoom(roomId, `No hay suficientes jugadores anotados. Faltan ${usersNumber - list.length}`);
      }
    } else {
      robot.messageRoom(roomId, `No hay suficientes jugadores anotados. Faltan ${usersNumber - list.length}`);
    }
  }

  function showTeam(teamName, players) {
    let message = `${teamName}:\n`;
    message += listPlayers(players);
    return message;
  }

  function listPlayers(players) {
    return players.map(i => `- ${userToString(i)}`).join('\n');
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

function getMaxUsersNumber(roomId) {
  if (typeof MAX_USERS_NUMBER === 'object') {
    return MAX_USERS_NUMBER[roomId] || 0;
  }

  return MAX_USERS_NUMBER;
}

function getAllowDelete(roomId) {
  if (typeof ALLOW_DELETE === 'object') {
    return ALLOW_DELETE[roomId] || false;
  }

  return ALLOW_DELETE;
}
