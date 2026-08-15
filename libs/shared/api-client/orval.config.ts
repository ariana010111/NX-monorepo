import { defineConfig } from 'orval';

export default defineConfig({
  beautyApi: {
    input: './openapi.json',
    output: {
      target: './src/generated/api-client.ts',
      client: 'angular',
      httpClient: 'angular',
    },
  },
});
