import { io } from 'socket.io-client';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const env = (name) => { const v = process.env[name]; if (!v)
    throw Error('Set ' + name); return v; };
const expand = (v) => typeof v === 'string' ? v.replace(/\$\{([A-Z_]+)\}/g, (_, k) => env(k)) : Array.isArray(v) ? v.map(expand) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, expand(x)])) : v;
const operations = JSON.parse(fs.readFileSync(fileURLToPath(new URL('./operations.json', import.meta.url)), 'utf8'));
const operation = process.argv[2];
if (!(operation in operations))
    throw Error('Choose ' + Object.keys(operations).join(', '));
const socket = io(env('APPENGINE_URL').replace(/\/$/, '') + '/chat', { autoConnect: false, transports: ['websocket'], auth: { orgId: env('APPENGINE_ORG'), token: env('APPENGINE_TOKEN'), ...(process.env.APPENGINE_CHAT_CONFIG ? { configId: process.env.APPENGINE_CHAT_CONFIG } : {}) } });
for (const name of ['message', 'agent-assigned', 'queued', 'queue-update', 'chat-ended', 'status', 'update', 'error'])
    socket.on(name, (value) => console.log(name, JSON.stringify(value)));
const call = (name, data) => new Promise((resolve, reject) => socket.timeout(30000).emit(name, data, (error, result) => error ? reject(error) : result?.success === false ? reject(Error(JSON.stringify(result))) : resolve(result)));
try {
    const ready = new Promise((resolve, reject) => { const timer = setTimeout(() => reject(Error('Authentication timed out')), 20000); socket.once('authenticate', (a) => { clearTimeout(timer); a.success ? resolve(a) : reject(Error(a.error || 'Authentication failed')); }); socket.once('connect_error', (e) => { clearTimeout(timer); reject(e); }); });
    socket.connect();
    const auth = await ready;
    const staffOnly = ['set-status', 'queue-stats', 'pick-next', 'takeover-chat', 'sendMessage', 'resume-ai', 'close-chat'];
    if (staffOnly.includes(operation) && auth.user?.role !== 'agent')
        throw Error('This operation requires your authorized staff session.');
    if (operation === 'pick-next') {
        const target = env('APPENGINE_CHAT_ID');
        if (env('APPENGINE_CONFIRM_PICK_CHAT_ID') !== target)
            throw Error('Confirm the exact owned target chat ID.');
        if (env('APPENGINE_ISOLATED_QUEUE') !== 'yes')
            throw Error('Use an isolated training queue with no concurrent arrivals.');
        const stats = await call('queue-stats', {});
        const position = await call('queue-position', { chatId: target });
        if (stats.stats?.size !== 1 || position.position !== 1)
            throw Error('Refusing pickup: target must be the only queued chat.');
        const result = await call(operation, {});
        console.log('ack', JSON.stringify(result));
        if (result.chat?.chatId !== target)
            throw Error('Queue changed during pickup. Stop and inspect assignment; never retry blindly.');
    }
    else
        console.log('ack', JSON.stringify(await call(operation, expand(operations[operation]))));
    // Keep staff available / observe recipient events. Interrupt with Ctrl+C when finished.
    await new Promise(resolve => setTimeout(resolve, Number(process.env.APPENGINE_LISTEN_SECONDS || 10) * 1000));
}
finally {
    socket.disconnect();
}
