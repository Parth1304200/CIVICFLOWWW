const AppError = require('../utils/AppError');

/**
 * Role-based access guard. Use AFTER the `auth` middleware.
 *
 *   router.patch('/:id/status', restrictTo('admin', 'cm'), updateComplaintStatus);
 *
 * Prevents privilege abuse — e.g. an administrator clearing a false-closure
 * report filed against their own resolution (a corruption vector the brief
 * explicitly asks us to close).
 */
module.exports = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to perform this action.', 403));
  }
  next();
};
