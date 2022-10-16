class ErrorResponse extends Error {
  constructor(blendedError, customMessage) {
    super(blendedError.message + ' ' + (customMessage || ''));
    this.statusCode = blendedError.statusCode;
    this.priority = blendedError.priority;
    this.code = blendedError.code;
    Error.captureStackTrace(this, this.constructor);
  }
}

if (!('toJSON' in Error.prototype))
  Object.defineProperty(Error.prototype, 'toJSON', {
    value: function () {
      var alt = {};

      Object.getOwnPropertyNames(this).forEach(function (key) {
        alt[key] = this[key];
      }, this);

      return alt;
    },
    configurable: true,
    writable: true,
  });

module.exports = ErrorResponse;
