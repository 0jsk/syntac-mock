const jwt = require('jsonwebtoken');
const fs = require('fs');

const SECRET_KEY = 'ABC123';

const getUsersData = () => {
  const jsonData = fs.readFileSync('./db.json');
  return JSON.parse(jsonData).users;
};

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  try {
    const data = jwt.verify(token, SECRET_KEY);
    const users = getUsersData();
    const user = users.find(u => u.id === data.id);

    if (!user) {
      return res.sendStatus(401);
    }

    req.user = user;
    next();
  } catch (e) {
    console.log(e);
    return res.sendStatus(401);
  }
};

