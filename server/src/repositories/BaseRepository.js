class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findById(id, populate = []) {
    let query = this.model.findById(id);
    populate.forEach((p) => (query = query.populate(p)));
    return query.exec();
  }

  async findOne(filter, populate = [], select = '') {
    let query = this.model.findOne(filter);
    populate.forEach((p) => (query = query.populate(p)));
    if (select) query = query.select(select);
    return query.exec();
  }

  async find(filter = {}, options = {}) {
    const { sort = { createdAt: -1 }, skip = 0, limit = 20, populate = [], select = '' } = options;
    let query = this.model.find(filter).sort(sort).skip(skip).limit(limit);
    populate.forEach((p) => (query = query.populate(p)));
    if (select) query = query.select(select);
    return query.exec();
  }

  async count(filter = {}) {
    return this.model.countDocuments(filter);
  }

  async create(data) {
    const doc = new this.model(data);
    return doc.save();
  }

  async updateById(id, data, options = { new: true, runValidators: true }) {
    return this.model.findByIdAndUpdate(id, data, options).exec();
  }

  async updateOne(filter, data, options = { new: true, runValidators: true }) {
    return this.model.findOneAndUpdate(filter, data, options).exec();
  }

  async deleteById(id) {
    return this.model.findByIdAndDelete(id).exec();
  }

  async deleteMany(filter) {
    return this.model.deleteMany(filter).exec();
  }

  async exists(filter) {
    return this.model.exists(filter);
  }

  async aggregate(pipeline) {
    return this.model.aggregate(pipeline).exec();
  }

  async paginate(filter, { page = 1, limit = 20, sort = { createdAt: -1 }, populate = [], select = '' } = {}) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.find(filter, { sort, skip, limit, populate, select }),
      this.count(filter),
    ]);
    return { data, total, page, limit };
  }
}

module.exports = BaseRepository;
