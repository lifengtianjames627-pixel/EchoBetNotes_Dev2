export function logApiRequest(logger, record) {
  logger.info({
    request_id: record.requestId,
    route: record.route,
    method: record.method,
    status: record.status,
    duration_ms: record.durationMs,
    actor_role: record.actorRole,
    error_code: record.errorCode ?? null,
  });
}

export function actorRoleFromRequest(request) {
  if (!request.user) return 'anonymous';
  return request.user.role === 'admin' ? 'admin' : 'member';
}
