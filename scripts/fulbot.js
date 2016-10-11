var fs = require('fs');
var path = require('path');

module.exports = function (robot) {
  var listTimeout;

  robot.hear(/(^juegan|^list|^lista|^quienes (juegan|van){1})/i, function (res) {
    var roomName = res.message.room;
    showUsers(roomName);
  });

  robot.hear(/(^reglas)/i, function (res) {
    var roomName = res.message.room;
    showRules(roomName);
  });

  robot.hear(/(^juego|^voy|^\+1)/i, function (res) {
    var roomName = res.message.room;
    var user = res.message.user;

    if (isValidRoom(roomName)) {
      addUser(roomName, user);
    }
  });

  robot.hear(/^me bajo/i, function (res) {
    var roomName = res.message.room;
    var user = res.message.user;

    if (isValidRoom(roomName)) {
      removeUser(roomName, user.id);
    }
  });

  robot.hear(/@(.+) juega$/, function (res) {
    var match = /\<@(.+)\> juega$/.exec(res.message.rawText);
    var roomName = res.message.room;

    if (match && isValidRoom(roomName)) {
      var userId = match[1];

      addUser(roomName, { id: userId });
    }
  });

  robot.hear(/@(.+) no juega$/, function (res) {
    var match = /\<@(.+)\> no juega$/.exec(res.message.rawText);
    var user = res.message.user;
    var roomName = res.message.room;

    if (match && isValidRoom(roomName)) {
      var userId = match[1];

      removeUser(roomName, userId);
    }
  });

  function addUser(roomName, user) {
    var list = getMatch(roomName);

    if (!list.some(function (i) { return i.id === user.id; })) {
      list.push({ id: user.id, name: user.name });
      updateMatch(roomName, list);
    }
  }

  function removeUser(roomName, userId) {
    var list = getMatch(roomName);
    var initialLength = list.length;

    list = list.filter(function (i) { return i.id != userId; });

    if (list.length !== initialLength) {
      updateMatch(roomName, list);
    }
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

    if (listTimeout) {
      clearTimeout(listTimeout);
    }

    listTimeout = setTimeout(function () {
      showUsers(roomName);
    }, 20000);

  }

  function showUsers(roomName){
    var list = getMatch(roomName);
    if (list.length) {
      robot.messageRoom(roomName, 'anotados: \n - ' + list.map(function (i) { return '<@' + i.id + '>' }).join('\n - '));
    } else {
      robot.messageRoom(roomName, 'no hay jugadores anotados');
    }
  }

  function showRules(roomName) {
    var rulesPath = path.join(__dirname, '../assets/rules.txt');
    var rules = fs.readFileSync(rulesPath);
    robot.messageRoom(roomName, rules.toString());
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
