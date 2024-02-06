import { DataSource, DataSourceOptions } from 'typeorm';
export const dataSourceOptions: DataSourceOptions = {
  type: 'mssql',
  host: 'sqlserver-genbot-dev.database.windows.net',
  username: 'sqladmin',
  password: 'P@ssw0rd1234',
  database: 'chatbot',
  entities: ['src/entities/*.ts'],
  migrations: ['migrations/*.ts'],
  extra: { trustServerCertificate: true },
  migrationsTableName: 'chatbot_migrations',
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
