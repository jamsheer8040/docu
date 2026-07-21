const auth = require('./middleware/auth.middleware');
console.log('protect:', !!auth.protect);
console.log('requirePermission:', !!auth.requirePermission);
