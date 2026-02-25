class KeyedQueue {
  constructor() {
    this.promises = new Map();
  }

  add(key, fn) {
    const prev = this.promises.get(key) || Promise.resolve();

    const next = prev
      .catch(() => {})
      .then(() => fn());

    this.promises.set(key, next);

    next.finally(() => {
      if (this.promises.get(key) === next) this.promises.delete(key);
    });

    return next;
  }
}

module.exports = { KeyedQueue };