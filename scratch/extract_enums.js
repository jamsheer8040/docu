const schema = require('./schema_dump.json');
const enums = [];

for (const modelName in schema) {
  const model = schema[modelName];
  for (const colName in model.columns) {
    const col = model.columns[colName];
    if (col.type === 'ENUM') {
      enums.push(`${modelName}.${colName}: ENUM(${col.values.map(v => `'${v}'`).join(', ')})`);
    }
  }
}

const fs = require('fs');
fs.writeFileSync('enums_list.txt', enums.join('\n'));
console.log('ENUMs extracted.');
