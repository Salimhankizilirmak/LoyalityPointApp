const { createClerkClient } = require('@clerk/backend');
console.log(Object.keys(createClerkClient().organizations));
