const { DataSource } = require('typeorm');
require('dotenv').config();

// Create TypeORM data source
exports.AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  entities: [__dirname + '/entity/**/*.js'],
  migrations: [__dirname + '/migration/**/*.js'],
  subscribers: [__dirname + '/subscriber/**/*.js'],
  synchronize: true, // Automatically create tables - set to false in production
  logging: true,
  maxQueryExecutionTime: 1000,
});
