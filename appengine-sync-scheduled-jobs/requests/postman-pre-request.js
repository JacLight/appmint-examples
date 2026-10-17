// Use on the schedule CREATE request only. Re-running resets future dates.
// Set orgId, token, targetDatatype and targetId in your private environment.
const now = Date.now();
pm.variables.set('futureStart', new Date(now + 120000).toISOString());
pm.variables.set('futureEnd', new Date(now + 180000).toISOString());
pm.variables.set('scheduleName', `course-status-${now}`);
