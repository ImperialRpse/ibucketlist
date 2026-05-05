require('ts-node').register();
const { categoryTree } = require('./lib/categories.ts');
console.log(JSON.stringify(categoryTree, null, 2));
