// Simple script to restart the server by creating a file change
const fs = require('fs');

console.log('Forcing server restart by touching server.js');
const now = new Date();
fs.utimesSync('./server.js', now, now);
console.log('Server.js touched - server should restart');