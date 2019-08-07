module.exports = {
  getUsersWithLimit,
  addUser,
  removeUser,
  listUsers
};

function getUsersWithLimit(users, limit) {
  const usersToComplete = limit - users.length;

  if (users.length) {
    const main = users.slice(0, limit);
    let message = `Anotades (${users.length}): \n`;

    message += listUsers(main);

    const substitutes = users.slice(limit);
    message += '\n';

    if (usersToComplete === 1) {
      message += `Falta ${usersToComplete}`;
    } else if (usersToComplete > 0) {
      message += `Faltan ${usersToComplete}`;
    } else {
      message += '!Completamos! 🙌';
    }

    if (users.length > limit) {
      message += '\n-------------\nSuplentes: \n';
      message += listUsers(substitutes);
    }

    return message;
  }

  return 'No hay jugadores anotades';
}

function addUser(users, userId, exists, limit) {
  if (!exists) {
    let replyMessage;

    if (users.length > limit) {
      replyMessage = `anotade de suplente <@${userId}>`;
    } else {
      replyMessage = `anotade <@${userId}>`;
    }

    if (users.length < limit) {
      const pendingUsers = limit - users.length;

      replyMessage += `, falta${pendingUsers > 1 ? 'n' : ''} ${pendingUsers}`;
    }

    if (limit && users.length !== limit) {
      return replyMessage;
    }

    return getUsersWithLimit(users, limit);
  }

  return `ya estabas anotade, <@${userId}>`;
}

function removeUser(users, userId) {
  return `removido <@${userId}>`;
}

function listUsers(users) {
  return users
    .map(({ userId, userName }) => `- ${userName || `<@${userId}>`}`)
    .join('\n');
}
