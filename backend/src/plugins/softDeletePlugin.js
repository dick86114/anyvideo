const mongoose = require('mongoose');

/**
 * Soft Delete Plugin for Mongoose
 * Adds deletedAt field and implements soft delete functionality
 */
const softDeletePlugin = (schema, options) => {
  // Add deletedAt field to schema
  schema.add({
    deletedAt: {
      type: Date,
      default: null,
      index: true
    }
  });

  // Override default find queries to exclude deleted documents
  const defaultFindQuery = {
    deletedAt: null
  };

  // Apply default query to find, findOne, findById, and count methods
  ['find', 'findOne', 'findById', 'count', 'countDocuments'].forEach(method => {
    schema.pre(method, function(next) {
      // Only apply if not explicitly including deleted documents
      if (!this.getQuery().deletedAt) {
        this.setQuery({
          ...this.getQuery(),
          ...defaultFindQuery
        });
      }
      next();
    });
  });

  // Add soft delete methods to schema
  schema.methods.softDelete = async function() {
    this.deletedAt = new Date();
    return this.save();
  };

  schema.methods.restore = async function() {
    this.deletedAt = null;
    return this.save();
  };

  // Add static methods for soft delete operations
  schema.statics.softDeleteById = async function(id) {
    return this.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true });
  };

  schema.statics.restoreById = async function(id) {
    return this.findByIdAndUpdate(id, { deletedAt: null }, { new: true });
  };

  schema.statics.softDeleteByCriteria = async function(criteria) {
    return this.updateMany(criteria, { deletedAt: new Date() }, { new: true });
  };

  schema.statics.restoreByCriteria = async function(criteria) {
    return this.updateMany(criteria, { deletedAt: null }, { new: true });
  };

  schema.statics.findWithDeleted = async function(criteria) {
    // Include deleted documents by setting deletedAt to undefined in query
    const query = { ...criteria };
    delete query.deletedAt;
    return this.find(query);
  };

  schema.statics.findOneWithDeleted = async function(criteria) {
    // Include deleted documents by setting deletedAt to undefined in query
    const query = { ...criteria };
    delete query.deletedAt;
    return this.findOne(query);
  };

  schema.statics.findByIdWithDeleted = async function(id) {
    return this.findOneWithDeleted({ _id: id });
  };
};

module.exports = softDeletePlugin;