'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('User', 'company_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'Company',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('User', 'role', {
      type: Sequelize.ENUM('admin', 'manager', 'operator', 'viewer'),
      allowNull: false,
      defaultValue: 'viewer',
    });

    await queryInterface.addIndex('User', ['company_id']);
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.removeIndex('User', ['company_id']);
    await queryInterface.removeColumn('User', 'role');
    await queryInterface.removeColumn('User', 'company_id');
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_User_role";`);
  },
};
