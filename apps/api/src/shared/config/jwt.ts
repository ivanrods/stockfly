export default {
  secret: process.env.JWT_SECRET,
  expiresIn: '1d',
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  refreshExpiresIn: '7d',
} as const;
