const path = require('path');
const db = require(path.join(__dirname, '../backend/models/index.js'));

const schema = {};

for (const modelName in db) {
  if (modelName === 'sequelize' || modelName === 'Sequelize') continue;
  
  const model = db[modelName];
  if (!model.rawAttributes) continue;
  
  schema[modelName] = {
    tableName: model.tableName,
    columns: {}
  };
  
  for (const col in model.rawAttributes) {
    const attr = model.rawAttributes[col];
    schema[modelName].columns[col] = {
      type: attr.type.key || attr.type.constructor.name,
      allowNull: attr.allowNull,
      defaultValue: attr.defaultValue,
      values: attr.type.values || undefined // For ENUMs
    };
  }
}

const fs = require('fs');
fs.writeFileSync(path.join(__dirname, 'schema_dump.json'), JSON.stringify(schema, null, 2));
console.log('Schema dumped to schema_dump.json');
