import type { InStatement } from '@libsql/client';
import { createClient } from '@libsql/client';
import { type DBCollections } from '../core/types.js';
import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql';
import { drizzle as drizzleProxy } from 'drizzle-orm/sqlite-proxy';
import { type SQLiteTable } from 'drizzle-orm/sqlite-core';
import { z } from 'zod';
import { getTableName } from 'drizzle-orm';

const isWebContainer = !!(process.versions?.webcontainer);

export async function createLocalDatabaseClient({
	collections,
	dbUrl,
	seeding,
}: {
	dbUrl: string;
	collections: DBCollections;
	seeding: boolean;
}) {
	const url = isWebContainer ? 'file:content.db' : dbUrl;
	const client = createClient({ url });
	const db = drizzleLibsql(client);

	if (seeding) return db;

	const { insert: drizzleInsert, update: drizzleUpdate, delete: drizzleDelete } = db;
	return Object.assign(db, {
		insert(Table: SQLiteTable) {
			checkIfModificationIsAllowed(collections, Table);
			return drizzleInsert.call(this, Table);
		},
		update(Table: SQLiteTable) {
			checkIfModificationIsAllowed(collections, Table);
			return drizzleUpdate.call(this, Table);
		},
		delete(Table: SQLiteTable) {
			checkIfModificationIsAllowed(collections, Table);
			return drizzleDelete.call(this, Table);
		},
	});
}

function checkIfModificationIsAllowed(collections: DBCollections, Table: SQLiteTable) {
	const tableName = getTableName(Table);
	const collection = collections[tableName];
	if (!collection.writable) {
		throw new Error(`The [${tableName}] collection is read-only.`);
	}
}

export function createRemoteDatabaseClient(appToken: string, remoteDbURL: string) {
	const url = new URL('/db/query', remoteDbURL);

	const db = drizzleProxy(async (sql, parameters, method) => {
		const requestBody: InStatement = { sql, args: parameters };
		// eslint-disable-next-line no-console
		console.info(JSON.stringify(requestBody));
		const res = await fetch(url, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${appToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(requestBody),
		});
		if (!res.ok) {
			throw new Error(
				`Failed to execute query.\nQuery: ${sql}\nFull error: ${res.status} ${await res.text()}}`
			);
		}

		const queryResultSchema = z.object({
			rows: z.array(z.unknown()),
		});
		let rows: unknown[];
		try {
			const json = await res.json();
			rows = queryResultSchema.parse(json).rows;
		} catch (e) {
			throw new Error(
				`Failed to execute query.\nQuery: ${sql}\nFull error: Unexpected JSON response. ${
					e instanceof Error ? e.message : String(e)
				}`
			);
		}

		// Drizzle expects each row as an array of its values
		const rowValues: unknown[][] = [];

		for (const row of rows) {
			if (row != null && typeof row === 'object') {
				rowValues.push(Object.values(row));
			}
		}

		if (method === 'get') {
			return { rows: rowValues[0] };
		}

		return { rows: rowValues };
	});
	return db;
}