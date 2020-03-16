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
    let message = `Anotad☀️s (${users.length}): \n`;

    message += listUsers(main);

    const substitutes = users.slice(limit);
    message += '\n';

    if (usersToComplete === 1) {
      message += `Falta ${usersToComplete}`;
    } else if (usersToComplete > 0) {
      message += `Faltan ${usersToComplete}`;
    } else {
      message += '¡Completamos! 🙌';
    }

    if (users.length > limit) {
      message += '\n-------------\nSuplentes: \n';
      message += listUsers(substitutes);
    }

    return message;
  }

  return 'No hay jugadores anotad☀️s';
}

function addUser(users, user, exists, limit) {
  const formatted = formatUser(user);

  if (!exists) {
    let replyMessage;

    if (users.length > limit) {
      replyMessage = `anotad☀️ de suplente ${formated}`;
    } else {
      replyMessage = `anotad☀️ ${formatted}`;
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

  return `ya estabas anotad☀️, ${formatted}`;
}

function removeUser(user) {
  return `removid☀️ ${formatUser(user)}`;
}

function listUsers(users) {
  return users.map((pair) => `- ${formatUser(pair)}`).join('\n');
}

function formatUser({ userName, userId }) {
  return userName || `<@${userId}>`;
}
