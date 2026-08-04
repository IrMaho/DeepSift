import module from 'module';
const originalRequire = module.prototype.require;
module.prototype.require = function (request) {
    if (request === 'sharp') {
        const err = new Error(`Cannot find module 'sharp'`);
        err.code = 'MODULE_NOT_FOUND';
        throw err;
    }
    return originalRequire.apply(this, arguments);
};
