const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fs = require('fs');

const router = express.Router();

const SECRET_KEY = 'ABC123';

const getUsersData = () => {
  const jsonData = fs.readFileSync('./db.json');
  return JSON.parse(jsonData).users;
};

router.post('/login', (req, res) => {
  const {email, password} = req.body;
  const users = getUsersData();
  const user = users.find(u => u.email === email);

  if (!user) return res.status(400).json({ error: 'User not found' });

  const isPasswordValid = bcrypt.compareSync(password, user.password);
  if (!isPasswordValid) return res.status(400).json({ error: 'Invalid password' });

  const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '72h' });

  delete user.password;

  res.json({ token, ...user });
});

router.post('/register', (req, res) => {
  const {email, password} = req.body;

  if (!email || !password) {
    return res.sendStatus(400);
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUserData = { email, password: hashedPassword, privileges: ['VIEW'] };

  let users = getUsersData();
  users.push(newUserData);

  fs.writeFileSync('./db.json', JSON.stringify({ users }, null, 2));

  res.status(201).json({ status: 'Created', data: newUserData });
});

module.exports = router;

