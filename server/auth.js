const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { addUser, authenticateUser } = require('./database');

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || '123456';


// 登录接口
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await authenticateUser(username, password);
    const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
});

// 注册接口
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    await addUser(username, password);
    res.status(201).json({ message: '注册成功' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


module.exports = router;