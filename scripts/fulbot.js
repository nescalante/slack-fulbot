var fs = require('fs');
var path = require('path');

var MAX_USERS_NUMBER = parseInt(process.env.MAX_USERS_NUMBER, 10) || 10;

module.exports = function (robot) {
  robot.hear(/(^lista$|^quienes (juegan|van){1}$)/i, function (res) {
    var roomName = res.message.room;
    showUsers(roomName);
  });

  robot.hear(/(^reglas)/i, function (res) {
    var roomName = res.message.room;
    showRules(roomName);
  });

  robot.hear(/(^equipos)/i, function (res) {
    var roomName = res.message.room;
    buildRandomTeams(roomName);
  });

  robot.hear(/(^juego|^voy|^\+1)/i, function (res) {
    var roomName = res.message.room;
    var user = res.message.user;

    if (isValidRoom(roomName)) {
      var prevList = getMatch(roomName).length;
      var list = addUser(roomName, user);

      if (list.length !== prevList) {
        var replyMessage;
        if (list.length > MAX_USERS_NUMBER) {
          replyMessage = 'anotado de suplente <@' + user.id + '>';
        } else {
          replyMessage = 'anotado <@' + user.id + '>';
        }

        if (list.length < MAX_USERS_NUMBER) {
          replyMessage += ', faltan ' + (MAX_USERS_NUMBER - list.length);
        }

        if (list.length !== MAX_USERS_NUMBER) {
          robot.messageRoom(roomName, replyMessage);
        } else {
          showUsers(roomName);
        }
      } else {
        var replyMessage = 'ya estabas anotado, <@' + user.id + '>';
        robot.messageRoom(roomName, replyMessage);
      }
    }
  });

  robot.hear(/(^me bajo|^-1|^no juego)/i, function (res) {
    var roomName = res.message.room;
    var user = res.message.user;

    if (isValidRoom(roomName)) {
      var prevList = getMatch(roomName).length;
      var list = removeUser(roomName, user.id);

      if (list.length !== prevList) {
        var replyMessage = 'removido <@' + user.id + '>';

        if (list.length < MAX_USERS_NUMBER) {
          replyMessage += ', ahora faltan ' + (MAX_USERS_NUMBER - list.length);
        } else {
          replyMessage += ', entra <@' + list[MAX_USERS_NUMBER].id + '>';
        }

        robot.messageRoom(roomName, replyMessage);
      } else {
        var replyMessage = 'no estabas anotado, <@' + user.id + '>';

        robot.messageRoom(roomName, replyMessage);
      }
    }
  });

  robot.hear(/@(.+) juega$/, function (res) {
    var match = /\<@(.+)\> juega$/.exec(res.message.rawText);
    var roomName = res.message.room;

    if (match && isValidRoom(roomName)) {
      var userId = match[1];
      var prevList = getMatch(roomName).length;
      var list = addUser(roomName, { id: userId });

      if (list.length !== prevList) {
        var replyMessage;
        if (list.length > MAX_USERS_NUMBER) {
          replyMessage = 'anotado de suplente <@' + userId + '>';
        } else {
          replyMessage = 'anotado <@' + userId + '>';
        }

        if (list.length < MAX_USERS_NUMBER) {
          replyMessage += ', faltan ' + (MAX_USERS_NUMBER - list.length);
        }

        robot.messageRoom(roomName, replyMessage);

        if (list.length === MAX_USERS_NUMBER) {
          showUsers(roomName);
        }
      } else {
        var replyMessage = 'ya estaba anotado <@' + userId + '>';
        robot.messageRoom(roomName, replyMessage);
      }
    }
  });

  robot.hear(/@(.+) no juega$/, function (res) {
    var match = /\<@(.+)\> no juega$/.exec(res.message.rawText);
    var user = res.message.user;
    var roomName = res.message.room;

    if (match && isValidRoom(roomName)) {
      var userId = match[1];
      var prevList = getMatch(roomName).length;
      var list = removeUser(roomName, userId);
      if (list.length !== prevList) {
        var replyMessage = 'removido <@' + userId + '>';

        if (list.length < MAX_USERS_NUMBER) {
          replyMessage += ', ahora faltan ' + (MAX_USERS_NUMBER - list.length);
        } else {
          replyMessage += ', entra <@' + list[MAX_USERS_NUMBER].id + '>';
        }

        robot.messageRoom(roomName, replyMessage);
      } else {
        var replyMessage = '<@' + userId + '> no estaba anotado';
        robot.messageRoom(roomName, replyMessage);
      }
    }
  });

  robot.respond(/help/, function (res) {
    var roomName = res.message.room;
    showHelp(roomName);
  });

  function addUser(roomName, user) {
    var list = getMatch(roomName);

    if (!list.some(function (i) { return i.id === user.id; })) {
      list.push({ id: user.id, name: user.name });
      updateMatch(roomName, list);
    }

    return list;
  }

  function removeUser(roomName, userId) {
    var list = getMatch(roomName);
    var initialLength = list.length;

    list = list.filter(function (i) { return i.id != userId; });

    if (list.length !== initialLength) {
      updateMatch(roomName, list);
    }

    return list;
  }

  function getMatch(roomName) {
    var matchKey = getMatchKey(roomName);

    return robot.brain.get(matchKey) || [];
  }

  function getMatchKey(roomName) {
    var now = Date.now();
    var year = new Date().getFullYear();

    return roomName + '_' + year + '_' + getWeekNumber(now) + '_match';
  }

  function isValidRoom(roomName) {
    if (process.env.ROOM) {
      return process.env.ROOM.split(';').some(function(r) { return r === roomName });
    }

    return true;
  }

  function updateMatch(roomName, list) {
    var matchKey = getMatchKey(roomName);
    robot.brain.set(matchKey, list);
  }

  function showUsers(roomName) {
    var list = getMatch(roomName);
    var totalUsers = list.length;
    var usersToComplete = MAX_USERS_NUMBER - totalUsers;

    if (totalUsers) {
      var titulares = list.slice(0, MAX_USERS_NUMBER);
      var suplentes = list.slice(MAX_USERS_NUMBER);

      var message = 'anotados (' + totalUsers + '): \n';
      message += listPlayers(titulares);

      message += '\n';
      message += usersToComplete === 1 ? 'falta ' + usersToComplete : (usersToComplete > 0 ? 'faltan ' + usersToComplete : 'Completamos!');

      if (totalUsers > MAX_USERS_NUMBER) {
        message += '\n-------------\nSuplentes: \n';
        message += listPlayers(suplentes);
      }

      robot.messageRoom(roomName,  message);
    } else {
      robot.messageRoom(roomName, 'no hay jugadores anotados');
    }
  }

  function showHelp(roomName) {
    var rulesPath = path.join(__dirname, '../assets/help.txt');
    var rules = fs.readFileSync(rulesPath);
    robot.messageRoom(roomName, rules.toString());
  }

  function showRules(roomName) {
    var rulesPath = path.join(__dirname, '../assets/rules.txt');
    var rules = fs.readFileSync(rulesPath);
    robot.messageRoom(roomName, rules.toString());
  }

  function buildRandomTeams(roomName) {
    var list = getMatch(roomName).slice(0);

    if (list.length) {
      if (list.length >= MAX_USERS_NUMBER) {
        var newList = [];
        var tempList = list.slice(0, MAX_USERS_NUMBER);
        for (var i = 0; i < MAX_USERS_NUMBER; i++) {
          var pos = Math.floor(Math.random() * MAX_USERS_NUMBER - i);
          newList[i] = tempList.splice(pos, 1)[0];
        }

        var teamOne = newList.slice(0, MAX_USERS_NUMBER / 2);
        var teamTwo = newList.slice(MAX_USERS_NUMBER / 2, MAX_USERS_NUMBER);

        robot.messageRoom(roomName, showTeam('*Equipo 1*', teamOne));
        robot.messageRoom(roomName, '\n\n');
        robot.messageRoom(roomName, showTeam('*Equipo 2*', teamTwo));
      } else {
        robot.messageRoom(roomName, 'No hay suficientes jugadores anotados. Faltan ' + (MAX_USERS_NUMBER - list.length));
      }
    } else {
      robot.messageRoom(roomName, 'No hay suficientes jugadores anotados. Faltan ' + (MAX_USERS_NUMBER - list.length));
    }
  }

  function showTeam(teamName, players) {
    var message = teamName + ':\n';
    message += listPlayers(players);
    return message;
  }

  function listPlayers(players) {
    return players.map(function (i) { return '- <@' + i.id + '>' }).join('\n');
  }

  function getWeekNumber(d) {
    d = new Date(+d);
    d.setHours(0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));

    var yearStart = new Date(d.getFullYear(), 0, 1);
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);

    return weekNo;
  }
};
