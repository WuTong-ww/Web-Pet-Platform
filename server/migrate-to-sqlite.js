const fs = require('fs');
const path = require('path');
const db = require('./db');
const bcrypt = require('bcrypt');

// 迁移用户数据
async function migrateUsers() {
  const userFile = path.join(__dirname, 'users.json');
  if (!fs.existsSync(userFile)) {
    console.log('🔍 用户数据文件不存在，跳过用户迁移');
    return;
  }

  try {
    const usersData = JSON.parse(fs.readFileSync(userFile, 'utf-8'));
    console.log(`🔄 准备迁移 ${usersData.length} 个用户...`);

    // 开始事务
    await new Promise((resolve, reject) => {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    for (const user of usersData) {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)',
          [user.username, user.password],
          (err) => {
            if (err) {
              console.error(`❌ 用户 ${user.username} 迁移失败:`, err);
            } else {
              console.log(`✅ 用户 ${user.username} 已迁移`);
            }
            resolve();
          }
        );
      });
    }

    // 提交事务
    await new Promise((resolve, reject) => {
      db.run('COMMIT', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log('🎉 用户数据迁移完成!');
  } catch (error) {
    console.error('❌ 用户迁移失败:', error);
    db.run('ROLLBACK');
  }
}

// 迁移宠物数据
async function migratePets() {
  const petsFile = path.join(__dirname, 'data/chinaPets.json');
  if (!fs.existsSync(petsFile)) {
    console.log('🔍 宠物数据文件不存在，跳过宠物迁移');
    return;
  }

  try {
    const petsData = JSON.parse(fs.readFileSync(petsFile, 'utf-8'));
    console.log(`🔄 准备迁移 ${petsData.length} 只宠物...`);

    // 开始事务
    await new Promise((resolve, reject) => {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO pets 
      (id, code, name, type, breed, age, gender, description, image, 
      location, center, source, detailUrl, tags, personalityTags, 
      popularity, viewCount, favoriteCount, publishedAt, postedDate, images, data) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let successCount = 0;
    for (const pet of petsData) {
      try {
        const tagsJson = JSON.stringify(pet.tags || []);
        const personalityTagsJson = JSON.stringify(pet.personalityTags || []);
        const imagesJson = JSON.stringify(pet.images || []);
        const petDataJson = JSON.stringify(pet);

        await new Promise((resolve, reject) => {
          stmt.run(
            pet.id,
            pet.code,
            pet.name,
            pet.type,
            pet.breed,
            pet.age,
            pet.gender,
            pet.description,
            pet.image,
            pet.location,
            pet.center,
            pet.source,
            pet.detailUrl,
            tagsJson,
            personalityTagsJson,
            pet.popularity || 0,
            pet.viewCount || 0,
            pet.favoriteCount || 0,
            pet.publishedAt,
            pet.postedDate,
            imagesJson,
            petDataJson,
            (err) => {
              if (err) {
                console.error(`❌ 宠物 ${pet.id} 迁移失败:`, err);
                resolve();
              } else {
                successCount++;
                resolve();
              }
            }
          );
        });
      } catch (petError) {
        console.error(`❌ 处理宠物 ${pet.id} 时出错:`, petError);
      }
    }

    stmt.finalize();

    // 提交事务
    await new Promise((resolve, reject) => {
      db.run('COMMIT', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log(`🎉 宠物数据迁移完成! 成功: ${successCount}/${petsData.length}`);
  } catch (error) {
    console.error('❌ 宠物迁移失败:', error);
    db.run('ROLLBACK');
  }
}

// 执行迁移
async function runMigration() {
  console.log('🚀 开始数据迁移...');
  
  try {
    await migrateUsers();
    await migratePets();
    
    console.log('✨ 所有数据迁移完成!');
    process.exit(0);
  } catch (error) {
    console.error('💥 迁移过程中发生错误:', error);
    process.exit(1);
  }
}

// 运行迁移
runMigration();