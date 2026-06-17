/**
 * localDb.js — File-based JSON database (Mongoose drop-in fallback)
 *
 * Stores data in backend/data/*.json files.
 * Provides the same async API that the controllers expect from Mongoose:
 *   Collection.find()         → Array
 *   Collection.findById(id)   → doc | null
 *   Collection.findOne(q)     → doc | null
 *   Collection.create(data)   → doc
 *   Collection.countDocuments(q) → number
 *   Collection.aggregate(pipeline) → Array
 *   doc.save()                → doc
 */
const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ── Tiny helpers ────────────────────────────────────────────────────────────
const newId  = () => crypto.randomBytes(12).toString('hex');
const now    = () => new Date().toISOString();
const readFile = (file) => {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return []; }
};
const writeFile = (file, data) =>
  fs.writeFileSync(file, JSON.stringify(data, null, 2));

/** Match a single doc against a simple Mongoose-style query object */
function matches(doc, query) {
  for (const [key, val] of Object.entries(query)) {
    if (key === '$in') continue; // handled per field below
    if (val === null || val === undefined) continue;

    // { status: { $in: [...] } }
    if (val && typeof val === 'object' && val.$in) {
      if (!val.$in.includes(doc[key])) return false;
      continue;
    }
    // ObjectId string comparison
    const docVal = doc[key];
    const strDocVal = docVal && typeof docVal === 'object'
      ? JSON.stringify(docVal)
      : String(docVal ?? '');
    const strVal = String(val);
    if (strDocVal !== strVal) return false;
  }
  return true;
}

// ── Document wrapper — adds .save() method ─────────────────────────────────
class LocalDoc {
  constructor(data, collection) {
    Object.assign(this, data);
    this._collection = collection;
  }

  async save() {
    const col = this._collection;
    const docs = readFile(col._file);
    const idx  = docs.findIndex(d => d._id === this._id);
    const plain = { ...this };
    delete plain._collection;
    plain.updatedAt = now();
    if (idx >= 0) docs[idx] = plain; else docs.push(plain);
    writeFile(col._file, docs);
    Object.assign(this, plain);
    return this;
  }

  toJSON() {
    const obj = { ...this };
    delete obj._collection;
    return obj;
  }

  toObject() { return this.toJSON(); }
}

// ── Collection class ────────────────────────────────────────────────────────
class LocalCollection {
  constructor(name) {
    this.name  = name;
    this._file = path.join(DATA_DIR, `${name}.json`);
    if (!fs.existsSync(this._file)) writeFile(this._file, []);
  }

  _wrap(doc) {
    if (!doc) return null;
    if (this.name === 'users') {
      if (doc.points === undefined) doc.points = 0;
      if (doc.isProfileSetup === undefined) doc.isProfileSetup = false;
    } else if (this.name === 'complaints') {
      if (doc.falseClosureReport === undefined) {
        doc.falseClosureReport = { isReported: false, reason: '', status: 'Pending' };
      }
    }
    return new LocalDoc(doc, this);
  }

  /** find(query).sort().select() → Array of LocalDoc */
  find(query = {}) {
    let docs = readFile(this._file).filter(d => matches(d, query));
    const self = this;

    const chain = {
      sort: (sortSpec) => {
        if (sortSpec && typeof sortSpec === 'object') {
          const [field, dir] = Object.entries(sortSpec)[0];
          docs = docs.sort((a, b) => {
            const av = new Date(a[field] || 0).getTime();
            const bv = new Date(b[field] || 0).getTime();
            return dir === -1 ? bv - av : av - bv;
          });
        } else if (typeof sortSpec === 'string') {
          // '-createdAt' style
          const desc = sortSpec.startsWith('-');
          const field = sortSpec.replace(/^-/, '');
          docs = docs.sort((a, b) => {
            const av = new Date(a[field] || 0).getTime();
            const bv = new Date(b[field] || 0).getTime();
            return desc ? bv - av : av - bv;
          });
        }
        return chain;
      },
      select: () => chain,
      populate: () => chain,
      lean: () => chain,
      exec: () => Promise.resolve(docs.map(d => self._wrap(d))),
      then: (onFulfilled, onRejected) =>
        Promise.resolve(docs.map(d => self._wrap(d))).then(onFulfilled, onRejected),
      [Symbol.iterator]: function*() { yield* docs.map(d => self._wrap(d)); }
    };
    return chain;
  }

  findById(id) {
    const docs = readFile(this._file);
    const doc  = docs.find(d => d._id === String(id)) || null;
    const wrapped = this._wrap(doc);
    return {
      select: () => this.findById(id),
      populate: () => this.findById(id),
      exec: () => Promise.resolve(wrapped),
      then: (onFulfilled, onRejected) =>
        Promise.resolve(wrapped).then(onFulfilled, onRejected),
    };
  }

  findOne(query = {}) {
    const docs = readFile(this._file);
    const doc  = docs.find(d => matches(d, query)) || null;
    const self = this;
    const wrapped = { _doc: doc, _col: self };

    const chain = {
      select: () => chain,
      populate: () => chain,
      exec: () => Promise.resolve(self._wrap(doc)),
      then: (onFulfilled, onRejected) =>
        Promise.resolve(self._wrap(doc)).then(onFulfilled, onRejected),
    };
    return chain;
  }

  async create(data) {
    const docs = readFile(this._file);
    const ts   = now();
    const doc  = {
      _id: data._id?.toString?.() || newId(),
      ...data,
      createdAt: data.createdAt || ts,
      updatedAt: ts,
    };
    // Hash password if present (for User collection)
    if (doc.password && !doc.password.startsWith('$2')) {
      const salt = await bcrypt.genSalt(10);
      doc.password = await bcrypt.hash(doc.password, salt);
    }
    docs.push(doc);
    writeFile(this._file, docs);
    return this._wrap(doc);
  }

  async countDocuments(query = {}) {
    const docs = readFile(this._file);
    return docs.filter(d => matches(d, query)).length;
  }

  async aggregate(pipeline = []) {
    let docs = readFile(this._file);

    for (const stage of pipeline) {
      if (stage.$match) {
        docs = docs.filter(d => matches(d, stage.$match));
      }
      if (stage.$group) {
        const { _id: groupField, ...accumulators } = stage.$group;
        const groups = {};
        for (const doc of docs) {
          const key = groupField ? doc[groupField.replace('$', '')] : '_all';
          if (!groups[key]) {
            groups[key] = { _id: key };
            for (const [acc, expr] of Object.entries(accumulators)) {
              if (expr.$sum === 1) groups[key][acc] = 0;
            }
          }
          for (const [acc, expr] of Object.entries(accumulators)) {
            if (expr.$sum === 1) groups[key][acc]++;
          }
        }
        docs = Object.values(groups);
      }
      if (stage.$sort) {
        const [field, dir] = Object.entries(stage.$sort)[0];
        docs = docs.sort((a, b) => dir * (String(a[field]) < String(b[field]) ? -1 : 1));
      }
    }
    return docs;
  }
}

// ── Singleton registry ───────────────────────────────────────────────────────
const _collections = {};
const getCollection = (name) => {
  if (!_collections[name]) _collections[name] = new LocalCollection(name);
  return _collections[name];
};

module.exports = { getCollection, LocalDoc, DATA_DIR };
