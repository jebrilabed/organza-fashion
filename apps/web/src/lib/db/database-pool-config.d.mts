export function databasePoolConfig(env?: NodeJS.ProcessEnv): {
  max: number;
  connectionTimeoutMillis: number;
  idleTimeoutMillis: number;
  query_timeout: number;
  keepAlive: true;
};
export function secureDatabaseConnectionString(connectionString: string, env?: NodeJS.ProcessEnv): string;
