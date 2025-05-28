import CustomError from '../utilities/customError.js'



export default function catchError(callBack) {
    return async (c, next) => {
        try {
            return await callBack(c, next);
        } catch (err) {
            // If err is already a CustomError, use its status code
            if (err instanceof CustomError) {
                return c.json({ message: err.message }, err.statusCode);
            }
            // Otherwise create new CustomError and return generic error
            return c.json({ message: err.message || 'Internal Server Error' }, 500);
        }
    };
}




// Global error handler middleware for Hono
export const globalErrorHandler = async (c, next) => {
    try {
        await next();
    } catch (err) {
        console.error('Global error:', err);
        
        if (err instanceof CustomError) {
            return c.json({ message: err.message }, err.statusCode);
        }
        
        return c.json({ message: 'Internal Server Error' }, 500);
    }
};
  