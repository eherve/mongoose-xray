const AWSXRay = require('aws-xray-sdk-core');
const {
  closeCurrentSegment,
  handleSegmentError,
} = require('./segment-helpers');

const documentOperations = ['save', 'remove'];

/**
 * Registers document middleware for the provided mongoose schema
 * @param schema The mongoose schema to attach the middleware to
 * @param [options] {MongooseXRayOptions} Options for Mongoose-XRay
 */
exports.registerDocumentMiddleware = (schema, options) => {
  documentOperations.forEach((operation) => {
    schema.pre(operation, function (next) {
      exports.createDocumentSubsegment(operation, this, options);
      next();
    });

    schema.post(operation, function (doc, next) {
      closeCurrentSegment();
      next();
    });

    schema.post(operation, function (err, doc, next) {
      handleSegmentError(err);
      next();
    });
  });
};

/**
 * Creates the subsegment for query middleware
 * @param operation {String} The operation that is to occur (findOne, update, etc...)
 * @param document {Object} The document related to the operation
 * @param [options] {MongooseXRayOptions} Options for Mongoose-XRay
 */
exports.createDocumentSubsegment = (operation, document, options) => {
  const parent = AWSXRay.getSegment();
  if (parent) {
    const subsegment = parent.addNewSubsegment(document.constructor.modelName);
    subsegment.addMetadata('operation', operation);
    if (options && options.verbose) {
      subsegment.addMetadata('document', JSON.stringify(document));
    }
  }
};