// Backend version configuration
module.exports = {
  number: '1.0.3',  // Matching your backend package.json version
  buildDate: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'development',
  isVercel: process.env.VERCEL === '1',
  name: 'Stagholme Admin API'
};
