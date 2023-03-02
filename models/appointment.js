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
  }
  Appointment.init(
    {
      title: DataTypes.STRING,
      start: DataTypes.STRING,
      end: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Appointment",
    }
  );
  return Appointment;
};
