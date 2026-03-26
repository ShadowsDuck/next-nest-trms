import { registerAs } from '@nestjs/config';

export default registerAs('', () => ({
  webURL: process.env.WEB_URL,
}));
