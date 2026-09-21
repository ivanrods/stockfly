'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Permission', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.createTable('Role', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.ENUM('admin', 'manager', 'operator', 'viewer'),
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.createTable('RolePermission', {
      role_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'Role',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      permission_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'Permission',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
    });

    await queryInterface.addIndex('RolePermission', ['role_id']);
    await queryInterface.addIndex('RolePermission', ['permission_id']);
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('RolePermission');
    await queryInterface.dropTable('Role');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Role_name";');
    await queryInterface.dropTable('Permission');
  },
};
