module.exports = function (robot) {
  var listTimeout;

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
    var userId = /\<@(.+)\> no juega$/.exec(res.message.rawText)[1];
    var user = res.message.user;
    var admins = process.env.ADMIN_NAME.split(';');
    var roomName = res.message.room;

    if (admins.some(function (a) { return a === user.name; }) && isValidRoom(roomName)) {
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
    return roomName + '_' + getWeekNumber(now) + '_match_info';
  }

  function isValidRoom(roomName) {
    return process.env.ROOM.split(';').some(function(r) { return r === roomName });
  }

  function updateMatch(roomName, list) {
    var matchKey = getMatchKey(roomName);
    robot.brain.set(matchKey, list);

    if (listTimeout) {
      clearTimeout(listTimeout);
    }

    listTimeout = setTimeout(function () {
      if (list.length) {
        robot.messageRoom(roomName, 'anotados: \n - ' + list.map(function (i) { return '<@' + i.id + '>' }).join('\n - '));
      }
      else {
        robot.messageRoom(roomName, 'no hay jugadores anotados');
      }
    }, 10000);
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
