export interface Config {
  app: {
    port: number;
    jwtSecret: string;
    node_env: string;
  };
  cors: {
    origin: string;
    credentials: boolean;
  };
  logs: {
    format: string;
    directory: string;
  };
}
