export default class EventBus {
    constructor() { this._listeners = {}; }
    on(event, cb) { (this._listeners[event] ??= []).push(cb); return () => this.off(event, cb); }
    off(event, cb) { if (!this._listeners[event]) return; this._listeners[event] = this._listeners[event].filter(f => f !== cb); }
    emit(event, payload) { (this._listeners[event] || []).forEach(cb => { try { cb(payload); } catch(e){ console.error('EventBus handler error', e);} }); }
}
