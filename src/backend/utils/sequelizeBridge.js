import mongoose from 'mongoose';

export const Op = {
  substring: 'substring',
  or: 'or',
  and: 'and',
  between: 'between',
  ne: 'ne',
  lte: 'lte',
  gte: 'gte',
  lt: 'lt',
  gt: 'gt',
  in: 'in',
  eq: 'eq',
  like: 'like'
};

const translateWhere = (where) => {
  if (!where) return {};
  const mongooseQuery = {};
  
  for (const key of Object.keys(where)) {
    const val = where[key];
    
    // Check if key is or/and
    if (key === 'or' || key === '$or') {
      if (Array.isArray(val)) {
        mongooseQuery['$or'] = val.map(item => translateWhere(item));
      }
      continue;
    }
    if (key === 'and' || key === '$and') {
      if (Array.isArray(val)) {
        mongooseQuery['$and'] = val.map(item => translateWhere(item));
      }
      continue;
    }

    if (typeof val === 'object' && val !== null && !Array.isArray(val) && !(val instanceof Date)) {
      const operators = Object.keys(val).concat(Object.getOwnPropertySymbols(val).map(s => s.description || s.toString()));
      const condition = {};
      
      // Iterate over property symbols and keys
      const allOps = Object.keys(val).concat(Object.getOwnPropertySymbols(val));
      for (const op of allOps) {
        const opVal = val[op];
        const opStr = typeof op === 'symbol' ? op.description : op;
        
        if (opStr === 'ne') {
          condition['$ne'] = opVal;
        } else if (opStr === 'eq') {
          condition['$eq'] = opVal;
        } else if (opStr === 'substring') {
          condition['$regex'] = opVal;
          condition['$options'] = 'i';
        } else if (opStr === 'like') {
          condition['$regex'] = opVal.replace(/%/g, '.*');
          condition['$options'] = 'i';
        } else if (opStr === 'lte') {
          condition['$lte'] = opVal;
        } else if (opStr === 'gte') {
          condition['$gte'] = opVal;
        } else if (opStr === 'lt') {
          condition['$lt'] = opVal;
        } else if (opStr === 'gt') {
          condition['$gt'] = opVal;
        } else if (opStr === 'between') {
          if (Array.isArray(opVal) && opVal.length === 2) {
            condition['$gte'] = opVal[0];
            condition['$lte'] = opVal[1];
          }
        } else if (opStr === 'in') {
          condition['$in'] = opVal;
        } else {
          condition[`$${opStr}`] = opVal;
        }
      }
      
      if (Object.keys(condition).length > 0) {
        const queryKey = key === 'id' ? '_id' : key;
        mongooseQuery[queryKey] = condition;
      }
    } else {
      const queryKey = key === 'id' ? '_id' : key;
      mongooseQuery[queryKey] = val;
    }
  }
  
  // Also handle Symbols directly at the root if there are any
  const symbols = Object.getOwnPropertySymbols(where);
  for (const sym of symbols) {
    const opStr = sym.description || sym.toString();
    const val = where[sym];
    if (opStr === 'or') {
      mongooseQuery['$or'] = val.map(item => translateWhere(item));
    } else if (opStr === 'and') {
      mongooseQuery['$and'] = val.map(item => translateWhere(item));
    }
  }

  return mongooseQuery;
};

const getRefPathForModelName = (modelName) => {
  const map = {
    'Screen': 'Screen',
    'Theater': 'Theater',
    'Movie': 'Movie',
    'ShowTime': 'ShowTime',
    'User': 'User',
    'Booking': 'Booking',
    'Payment': 'Payment'
  };
  return map[modelName] || modelName;
};

const buildNestedPopulate = (includeOption) => {
  if (Array.isArray(includeOption)) {
    return includeOption.map(inc => buildNestedPopulate(inc)).filter(Boolean);
  } else if (typeof includeOption === 'object' && includeOption !== null) {
    const pathName = includeOption.model ? getRefPathForModelName(includeOption.model.modelName) : null;
    if (!pathName) return null;
    
    const populateOptions = { path: pathName };
    if (includeOption.attributes) {
      if (Array.isArray(includeOption.attributes)) {
        populateOptions.select = includeOption.attributes.map(a => a === 'id' ? '_id' : a).join(' ');
      } else if (includeOption.attributes.exclude) {
        populateOptions.select = includeOption.attributes.exclude.map(attr => `-${attr}`).join(' ');
      }
    }
    
    // Handle where condition on nested population if present
    if (includeOption.where) {
      populateOptions.match = translateWhere(includeOption.where);
    }

    if (includeOption.include) {
      populateOptions.populate = buildNestedPopulate(includeOption.include);
    }
    return populateOptions;
  } else if (includeOption) {
    const modelName = includeOption.modelName || (typeof includeOption === 'function' ? includeOption.name : null);
    if (modelName) {
      return { path: getRefPathForModelName(modelName) };
    }
  }
  return null;
};

const buildMongooseQuery = (model, options = {}) => {
  const filter = translateWhere(options.where);
  let query = model.find(filter);
  
  if (options.attributes) {
    if (Array.isArray(options.attributes)) {
      const fields = options.attributes.map(a => a === 'id' ? '_id' : a).join(' ');
      query = query.select(fields);
    } else if (typeof options.attributes === 'object') {
      if (options.attributes.exclude) {
        const exclusions = options.attributes.exclude.map(attr => `-${attr}`).join(' ');
        query = query.select(exclusions);
      }
    }
  }
  
  if (options.order) {
    const sortObj = {};
    if (Array.isArray(options.order)) {
      for (const orderItem of options.order) {
        if (Array.isArray(orderItem)) {
          const [field, direction] = orderItem;
          const sortField = field === 'id' ? '_id' : field;
          sortObj[sortField] = direction.toUpperCase() === 'DESC' ? -1 : 1;
        } else if (typeof orderItem === 'string') {
          const sortField = orderItem === 'id' ? '_id' : orderItem;
          sortObj[sortField] = 1;
        }
      }
    }
    query = query.sort(sortObj);
  }
  
  if (options.offset !== undefined) {
    query = query.skip(parseInt(options.offset));
  }
  if (options.limit !== undefined) {
    query = query.limit(parseInt(options.limit));
  }
  
  if (options.include) {
    const applyInclude = (q, incOpt) => {
      if (Array.isArray(incOpt)) {
        for (const inc of incOpt) {
          q = applyInclude(q, inc);
        }
      } else {
        const popOpts = buildNestedPopulate(incOpt);
        if (popOpts) {
          q = q.populate(popOpts);
        }
      }
      return q;
    };
    query = applyInclude(query, options.include);
  }
  
  return query;
};

export const addSequelizeCompatibility = (schema) => {
  // Add virtual getter for 'id' to map to '_id' automatically in documents
  if (!schema.options.toJSON) schema.options.toJSON = {};
  if (!schema.options.toObject) schema.options.toObject = {};
  
  schema.options.toJSON.virtuals = true;
  schema.options.toObject.virtuals = true;
  
  schema.options.toJSON.transform = function (doc, ret) {
    ret.id = ret._id;
    if (ret.Screen && Array.isArray(ret.Screen)) {
      ret.Screens = ret.Screen;
    }
    return ret;
  };
  schema.options.toObject.transform = function (doc, ret) {
    ret.id = ret._id;
    if (ret.Screen && Array.isArray(ret.Screen)) {
      ret.Screens = ret.Screen;
    }
    return ret;
  };

  // Static compatibility methods
  schema.statics.findOne = function(options = {}) {
    if (options.where === undefined && options.include === undefined && options.attributes === undefined) {
      // Direct Mongoose findOne call
      const filter = options.id ? { _id: options.id } : options;
      return mongoose.Model.findOne.call(this, translateWhere(filter));
    }
    const query = buildMongooseQuery(this, options);
    return query.findOne();
  };

  schema.statics.findAll = function(options = {}) {
    return buildMongooseQuery(this, options).exec();
  };

  schema.statics.findByPk = function(id, options = {}) {
    if (!id) return Promise.resolve(null);
    const query = this.findById(id);
    
    if (options.attributes) {
      if (Array.isArray(options.attributes)) {
        query.select(options.attributes.map(a => a === 'id' ? '_id' : a).join(' '));
      } else if (options.attributes.exclude) {
        query.select(options.attributes.exclude.map(attr => `-${attr}`).join(' '));
      }
    }
    
    if (options.include) {
      const applyInclude = (q, incOpt) => {
        if (Array.isArray(incOpt)) {
          for (const inc of incOpt) {
            q = applyInclude(q, inc);
          }
        } else {
          const popOpts = buildNestedPopulate(incOpt);
          if (popOpts) {
            q = q.populate(popOpts);
          }
        }
        return q;
      };
      applyInclude(query, options.include);
    }
    
    return query.exec();
  };

  schema.statics.findAndCountAll = async function(options = {}) {
    const countQuery = this.countDocuments(translateWhere(options.where));
    const findQuery = buildMongooseQuery(this, options);
    const [count, rows] = await Promise.all([
      countQuery.exec(),
      findQuery.exec()
    ]);
    return { count, rows };
  };

  schema.statics.findOrCreate = async function({ where, defaults }) {
    const filter = translateWhere(where);
    let doc = await this.findOne(filter);
    let created = false;
    if (!doc) {
      const createData = { ...filter, ...defaults };
      // Strip any Operator symbols from keys
      for (const k of Object.keys(createData)) {
        if (typeof createData[k] === 'object' && createData[k] !== null && !Array.isArray(createData[k]) && !(createData[k] instanceof Date)) {
          delete createData[k];
        }
      }
      doc = await this.create(createData);
      created = true;
    }
    return [doc, created];
  };

  schema.statics.count = function(options = {}) {
    return this.countDocuments(translateWhere(options.where));
  };

  schema.statics.sum = async function(field, options = {}) {
    const filter = translateWhere(options.where);
    const result = await this.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: `$${field}` } } }
    ]);
    return result.length > 0 ? result[0].total : 0;
  };

  schema.statics.bulkCreate = function(records) {
    return this.insertMany(records);
  };

  // Instance methods
  schema.methods.update = function(data) {
    Object.assign(this, data);
    return this.save();
  };

  schema.methods.destroy = function() {
    return this.deleteOne();
  };
};
