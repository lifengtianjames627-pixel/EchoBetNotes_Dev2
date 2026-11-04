import { config } from '../config/env.js';

export function sendApiError(reply, request, error) {
  const status = error.statusCode && error.statusCode >= 400 ? error.statusCode : 500;
  const code = error.code || (status === 500 ? 'internal_error' : 'request_failed');
  reply.header('x-error-code', code);
  return reply.code(status).send({
    error: code,
    message: status === 500 && config.production ? 'Internal server error' : error.message,
    requestId: request.requestId,
  });
}

export function withApiErrors(handler) {
  return async (request, reply) => {
    try {
      return await handler(request, reply);
    } catch (error) {
      if (error?.statusCode && error.statusCode >= 400) {
        return sendApiError(reply, request, error);
      }
      throw error;
    }
  };
}
