import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../../database.sqlite');

// Удаляем файл базы данных, если он существует
if (fs.existsSync(dbPath)) {
    console.log('Удаление существующего файла базы данных...');
    fs.unlinkSync(dbPath);
}

// Синхронизируем модели с новой базой данных
console.log('Создание новой базы данных...');
await sequelize.sync({ force: true });

console.log('✅ База данных успешно сброшена');
process.exit(0);
