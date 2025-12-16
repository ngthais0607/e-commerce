import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Parse DATABASE_URL or use individual variables
const parseDatabaseUrl = (url) => {
  try {
    const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (!match) {
      throw new Error('Invalid DATABASE_URL format');
    }
    return {
      host: match[3],
      port: parseInt(match[4], 10),
      user: match[1],
      password: match[2],
      database: match[5],
    };
  } catch (error) {
    const urlObj = new URL(url.replace('mysql://', 'http://'));
    return {
      host: urlObj.hostname,
      port: parseInt(urlObj.port || '3306', 10),
      user: urlObj.username,
      password: urlObj.password,
      database: urlObj.pathname.slice(1),
    };
  }
};

const dbConfig = process.env.DATABASE_URL
  ? parseDatabaseUrl(process.env.DATABASE_URL)
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'ecommerce',
    };

console.log('Testing database connection...');
console.log('Configuration:', {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database,
  password: dbConfig.password ? '***' : '(empty)',
});

async function testConnection() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('\n✅ Successfully connected to MySQL!');
    
    // Test query
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Test query executed successfully:', rows);
    
    // Check if database exists
    const [databases] = await connection.execute('SHOW DATABASES');
    const dbExists = databases.some(db => Object.values(db)[0] === dbConfig.database);
    
    if (dbExists) {
      console.log(`✅ Database "${dbConfig.database}" exists`);
      
      // Check tables - reconnect with database selected
      await connection.end();
      connection = await mysql.createConnection({
        ...dbConfig,
        database: dbConfig.database,
      });
      
      const [tables] = await connection.execute('SHOW TABLES');
      console.log(`✅ Found ${tables.length} tables in database`);
      
      if (tables.length > 0) {
        console.log('Tables:', tables.map(t => Object.values(t)[0]).join(', '));
      } else {
        console.log('⚠️  Database exists but has no tables');
        console.log('   Run: cd database && setup_database.bat');
      }
    } else {
      console.log(`⚠️  Database "${dbConfig.database}" does not exist`);
      console.log('   Run: cd database && setup_database.bat');
    }
    
    await connection.end();
    console.log('\n✅ Connection test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database connection failed!');
    console.error('Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check if MySQL server is running');
    console.error('2. Verify database credentials in .env file');
    console.error('3. Ensure database exists: mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS ecommerce;"');
    console.error('4. Check MySQL user permissions');
    console.error('\nCommon issues:');
    console.error('- MySQL not running: Start MySQL service');
    console.error('- Wrong password: Update DB_PASSWORD in .env');
    console.error('- Database not exists: Run setup_database.bat');
    console.error('- Wrong host/port: Check DB_HOST and DB_PORT');
    
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

testConnection();

