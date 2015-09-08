module.exports = function (robot) {
  var listTimeout;

  robot.hear(/(^juego|^voy)/i, function (res) {
    var roomName = res.message.room;
    var user = res.message.user;

    addUser(roomName, user);
  });

  robot.hear(/^me bajo/i, function (res) {
    var roomName = res.message.room;
    var user = res.message.user;

    removeUser(roomName, user);
  });

  robot.respond(/crear lista #(.+)/i, function (res) {
    var user = res.message.user;
    var roomName = res.match[1];
    var admins = process.env.ADMIN_NAME.split(';');

    if (admins.some(function (a) { return a === user.name; })) {
      createMatch(roomName);
      res.reply('hecho!');
    }
  });

  robot.hear(/@(.+) juega$/, function (res) {
    var userId = /\<@(.+)\> juega$/.exec(res.message.rawText)[1];

    addUser(res.message.room, { id: userId });
  });

  robot.hear(/@(.+) no juega$/, function (res) {
    var userId = /\<@(.+)\> no juega$/.exec(res.message.rawText)[1];
    var user = res.message.user;

    if (admins.some(function (a) { return a === user.name; })) {
      removeUser(res.message.room, userId);
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

  function createMatch(roomName) {
    var value = Date.now() + '_match_info';
    var matchKey = getMatchKey(roomName);

    robot.brain.set(matchKey, value);

    return value;
  }

  function getMatch(roomName) {
    var matchKey = getMatchKey(roomName);
    var currentMatch = robot.brain.get(matchKey);

    if (!currentMatch) {
      currentMatch = createMatch(roomName);
    };

    return robot.brain.get(currentMatch) || [];
  }

  function getMatchKey(roomName) {
    return roomName + '_current_match_key';
  }

  function updateMatch(roomName, list) {
    var matchKey = getMatchKey(roomName);
    var matchName = robot.brain.get(matchKey);
    robot.brain.set(matchName, list);

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
};
