import { randomBytes } from 'node:crypto';
import { pool } from '../db/pool.js';

export const newId = () => randomBytes(12).toString('hex');
export const isId = (value) => typeof value === 'string' && /^[a-f0-9]{24}$/i.test(value);

const fieldExpression = (field) => {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field)) throw new Error('Invalid filter field');
  if (field === 'id') return 'id';
  if (field === 'created_date' || field === 'updated_date') return field;
  if (field === 'created_by_id') return 'owner_id';
  return `data->'${field}'`;
};

function compileFilter(filter, values) {
  if (!filter || !Object.keys(filter).length) return 'TRUE';
  const clauses = [];
  for (const [field, expected] of Object.entries(filter)) {
    if (field === '$or' || field === '$and') {
      const parts = Array.isArray(expected) ? expected.map((item) => `(${compileFilter(item, values)})`) : [];
      clauses.push(parts.length ? parts.join(field === '$or' ? ' OR ' : ' AND ') : 'TRUE');
      continue;
    }

    const expression = fieldExpression(field);
    if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
      if ('$in' in expected || '$nin' in expected) {
        const list = expected.$in || expected.$nin || [];
        const comparisons = list.map((item) => {
          const scalarColumn = field === 'id' || field === 'created_by_id'
            || field === 'created_date' || field === 'updated_date';
          values.push(scalarColumn ? item : JSON.stringify(item));
          return `${expression} = $${values.length}${scalarColumn ? '' : '::jsonb'}`;
        });
        const joined = comparisons.length ? `(${comparisons.join(' OR ')})` : 'FALSE';
        clauses.push('$nin' in expected ? `NOT ${joined}` : joined);
        continue;
      }
    }

    if (field === 'id' || field === 'created_by_id') {
      values.push(expected);
      clauses.push(`${expression} = $${values.length}`);
    } else {
      values.push(JSON.stringify(expected));
      clauses.push(`${expression} = $${values.length}::jsonb`);
    }
  }
  return clauses.length ? clauses.join(' AND ') : 'TRUE';
}

const rowToRecord = (row) => ({
  ...row.data,
  id: row.id,
  created_by_id: row.owner_id || row.data?.created_by_id,
  created_date: row.created_date,
  updated_date: row.updated_date,
});

export class EntityRepository {
  constructor(entityName, queryable = pool) {
    this.entityName = entityName;
    this.db = queryable;
  }

  async list({ filter = {}, sort = '-created_date', limit = 100, offset = 0 } = {}) {
    const values = [this.entityName];
    const where = compileFilter(filter, values);
    const descending = String(sort || '').startsWith('-');
    const field = String(sort || 'created_date').replace(/^-/, '');
    const sortExpression = fieldExpression(field);
    values.push(Math.min(Math.max(Number(limit) || 100, 1), 1000));
    const limitIndex = values.length;
    values.push(Math.max(Number(offset) || 0, 0));
    const offsetIndex = values.length;
    const result = await this.db.query(
      `SELECT id, data, owner_id, created_date, updated_date
       FROM entity_records
       WHERE entity_name = $1 AND (${where})
       ORDER BY ${sortExpression} ${descending ? 'DESC' : 'ASC'}, id ${descending ? 'DESC' : 'ASC'}
       LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
      values,
    );
    return result.rows.map(rowToRecord);
  }

  async find(id) {
    const result = await this.db.query(
      `SELECT id, data, owner_id, created_date, updated_date
       FROM entity_records WHERE entity_name = $1 AND id = $2`,
      [this.entityName, id],
    );
    return result.rows[0] ? rowToRecord(result.rows[0]) : null;
  }

  async create(input, actor = null) {
    const id = isId(input.id) ? input.id : newId();
    const ownerId = input.created_by_id || actor?.id || null;
    const data = { ...input };
    delete data.id;
    delete data.created_date;
    delete data.updated_date;
    const result = await this.db.query(
      `INSERT INTO entity_records(entity_name, id, data, owner_id)
       VALUES ($1, $2, $3::jsonb, $4)
       RETURNING id, data, owner_id, created_date, updated_date`,
      [this.entityName, id, JSON.stringify(data), ownerId],
    );
    return rowToRecord(result.rows[0]);
  }

  async update(id, changes) {
    const data = { ...changes };
    delete data.id;
    delete data.created_date;
    delete data.updated_date;
    const result = await this.db.query(
      `UPDATE entity_records
       SET data = data || $3::jsonb, updated_date = now()
       WHERE entity_name = $1 AND id = $2
       RETURNING id, data, owner_id, created_date, updated_date`,
      [this.entityName, id, JSON.stringify(data)],
    );
    return result.rows[0] ? rowToRecord(result.rows[0]) : null;
  }

  async remove(id) {
    const result = await this.db.query(
      'DELETE FROM entity_records WHERE entity_name = $1 AND id = $2',
      [this.entityName, id],
    );
    return result.rowCount > 0;
  }

  async updateMany(filter, changes) {
    const records = await this.list({ filter, limit: 1000 });
    return Promise.all(records.map((record) => this.update(record.id, changes)));
  }
}

export const entity = (name, queryable) => new EntityRepository(name, queryable);
