// botones.js shim: delegate to UIController when available
if (typeof module !== 'undefined' && module.exports) {
  try {
    module.exports = require('./UIController');
  } catch (e) {
    // no-op in Node if UIController not present
    module.exports = {};
  }
}
// In browser the actual UIController.js will be loaded by HTML and used directly.
