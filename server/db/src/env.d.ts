declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string;
    PGADMIN_DEFAULT_EMAIL: string;
    PGADMIN_DEFAULT_PASSWORD: string;
  }
}
