const bcrypt = require('bcrypt');
const db = require('./db');

// 添加新用户
const addUser = async (username, password) => {
  // 检查用户名是否已存在
  return new Promise((resolve, reject) => {
    db.get('SELECT username FROM users WHERE username = ?', [username], async (err, user) => {
      if (err) {
        return reject(new Error('数据库查询失败: ' + err.message));
      }

      if (user) {
        return reject(new Error('用户名已被注册'));
      }

      // 加密密码并存储
      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        db.run('INSERT INTO users (username, password) VALUES (?, ?)', 
          [username, hashedPassword], 
          function(err) {
            if (err) {
              return reject(new Error('创建用户失败: ' + err.message));
            }
            resolve({ id: this.lastID, username });
          }
        );
      } catch (error) {
        reject(new Error('密码加密失败: ' + error.message));
      }
    });
  });
};

// 验证用户登录
const authenticateUser = async (username, password) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
      if (err) {
        return reject(new Error('数据库查询失败: ' + err.message));
      }

      // 查找用户
      if (!user) {
        return reject(new Error('用户名或密码错误'));
      }

      try {
        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return reject(new Error('用户名或密码错误'));
        }
        
        resolve({
          id: user.id,
          username: user.username
        });
      } catch (error) {
        reject(new Error('密码验证失败: ' + error.message));
      }
    });
  });
};

module.exports = { addUser, authenticateUser };