// Vercel Serverless Function entry point
// Connects the Vercel request cycle to the existing Express app logic
const app = require('../server/index.js');
module.exports = app;
