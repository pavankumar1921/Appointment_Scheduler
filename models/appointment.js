"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Appointment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Appointment.belongsTo(models.User, {
        foreignKey: "userId",
      });
      // define association here
    }
    static addAppointment({ title, start, end, userId }) {
      return this.create({
        title: title,
        start: start,
        end: end,
        userId,
      });
    }
    static getAppointments(userId) {
      return this.findAll({
        where: {
          userId,
        },
        order: [["start", "ASC"]],
      });
    }
    static deleteAppointment(id) {
      return this.destroy({
        where: {
          id,
        },
      });
    }
    static editAppointment(id, title) {
      return this.update(
        { title: title },
        {
          where: {
            id,
          },
        }
      );
    }
  }
  Appointment.init(
    {
      title: DataTypes.STRING,
      start: DataTypes.TIME,
      end: DataTypes.TIME,
    },
    {
      sequelize,
      modelName: "Appointment",
    }
  );
  return Appointment;
};
