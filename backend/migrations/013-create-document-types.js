const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create document_types table
    await queryInterface.createTable('document_types', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // 2. Seed default types
    const defaultTypes = [
      'Visa', 'Passport', 'TradeLicense', 'EmiratesID', 'MedicalFitness', 'Other'
    ].map(name => ({
      name,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }));
    await queryInterface.bulkInsert('document_types', defaultTypes);

    // 3. Alter documents table: ENUM -> STRING
    // Note: Some DBs (like PostgreSQL) require special handling for ENUM to STRING,
    // but in SQLite it's usually dynamic. 
    // Since this is a Sequelize project, we'll use changeColumn.
    await queryInterface.changeColumn('documents', 'type', {
      type: Sequelize.STRING(100),
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('document_types');
    // We don't revert to ENUM easily without knowing the previous list,
    // but for dev we'll just leave it as STRING.
  }
};
