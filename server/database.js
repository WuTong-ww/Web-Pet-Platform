const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

// 模拟数据库文件路径
const DB_FILE = path.join(__dirname, 'users.json');

// 初始化数据库文件（如果不存在）
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([]), 'utf-8');
}

// 读取用户数据
const readUsers = () => {
  const data = fs.readFileSync(DB_FILE, 'utf-8');
  return JSON.parse(data);
};

// 写入用户数据
const writeUsers = (users) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2), 'utf-8');
};

// 添加新用户
const addUser = async (username, password) => {
  const users = readUsers();

  // 检查用户名是否已存在
  if (users.some(user => user.username === username)) {
    throw new Error('用户名已被注册');
  }

  // 加密密码并存储
  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ username, password: hashedPassword });
  writeUsers(users);
};

// 验证用户登录
const authenticateUser = async (username, password) => {
  const users = readUsers();

  // 查找用户
  const user = users.find(user => user.username === username);
  if (!user) {
    throw new Error('用户名或密码错误');
  }

  // 验证密码
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error('用户名或密码错误');
  }

  return user;
};

module.exports = { addUser, authenticateUser };