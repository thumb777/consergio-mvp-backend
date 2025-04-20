module.exports = (sequelize, Sequelize) => {
  const Event = sequelize.define("event", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    event_id: {
      type: Sequelize.STRING,
      unique: true,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    url: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    start_date: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    start_time: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    venue_name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    venue_address: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    venue_city: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    venue_state: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    price_min: {
      type: Sequelize.FLOAT,
      allowNull: true,
    },
    price_max: {
      type: Sequelize.DOUBLE,
      allowNull: true,
    },
    image_url: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    categories: {
      type: Sequelize.ARRAY(Sequelize.STRING),
      defaultValue: [],
      set(val) {
        if (Array.isArray(val)) {
          // Capitalize first letter of each category
          const standardizedCategories = val.map(
            (category) =>
              category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()
          );
          this.setDataValue("categories", standardizedCategories);
        }
      },
    },
    source: {
      type: Sequelize.STRING,
      defaultValue: "ticketmaster",
    },
  });

  return Event;
};
