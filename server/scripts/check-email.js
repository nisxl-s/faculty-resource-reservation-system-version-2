const path = require('path');
require('dotenv').config({path:path.join(__dirname,'../.env')});
const {verifyEmailConnection}=require('../src/config/email');
verifyEmailConnection().then(()=>console.log('SMTP authentication and connection verified. No email was sent.')).catch(error=>{console.error('Email connection unavailable:',error.code || 'MISSING_CONFIGURATION');process.exitCode=1;});
