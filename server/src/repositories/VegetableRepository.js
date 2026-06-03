const BaseRepository = require('./BaseRepository');
const Vegetable = require('../models/Vegetable');

class VegetableRepository extends BaseRepository {
  constructor() {
    super(Vegetable);
  }

  async findByName(name) {
    return this.model.findOne({ name: new RegExp(`^${name}$`, 'i') }).exec();
  }
}

module.exports = new VegetableRepository();
