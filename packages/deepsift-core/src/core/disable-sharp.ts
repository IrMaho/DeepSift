import module from 'module';
const originalRequire = (module.prototype as any).require;
(module.prototype as any).require = function (request: string) {
    if (request === 'sharp') {
        const err: any = new Error(`Cannot find module 'sharp'`);
        err.code = 'MODULE_NOT_FOUND';
        throw err;
    }
    return originalRequire.apply(this, arguments);
};
