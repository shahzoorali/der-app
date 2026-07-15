// Local, file-backed stand-in for DynamoDBDocumentClient, used only in local
// development when no AWS credentials are configured. Implements just enough
// of the Get/Put/Update/Delete/Query/Scan command surface that our routes use,
// so route code never has to know whether it's talking to real DynamoDB or this.

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '.dev-data');

function fileFor(table: string): string {
    return path.join(DATA_DIR, `${table}.json`);
}

function loadTable(table: string): Record<string, any> {
    try {
        const raw = fs.readFileSync(fileFor(table), 'utf-8');
        return JSON.parse(raw);
    } catch {
        return {};
    }
}

function saveTable(table: string, data: Record<string, any>): void {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(fileFor(table), JSON.stringify(data, null, 2));
}

function itemKey(key: Record<string, any>): string {
    // Composite keys (e.g. phone + eventDay) joined deterministically
    return Object.keys(key).sort().map(k => `${k}:${key[k]}`).join('|');
}

function resolveAlias(pathSegment: string, names?: Record<string, string>): string {
    if (!names) return pathSegment;
    return pathSegment.replace(/#\w+/g, (m) => names[m] ?? m);
}

function setNestedValue(obj: any, dottedPath: string, value: any): void {
    const parts = dottedPath.split('.');
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        if (typeof cur[parts[i]] !== 'object' || cur[parts[i]] === null) {
            cur[parts[i]] = {};
        }
        cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;
}

function applyUpdateExpression(item: any, expression: string, names?: Record<string, string>, values?: Record<string, any>): any {
    const setClause = expression.replace(/^SET\s+/i, '');
    // Split on commas that are not inside function calls (none of our expressions nest parens in SET)
    const assignments = setClause.split(',').map(s => s.trim()).filter(Boolean);

    for (const assignment of assignments) {
        const [rawLhs, rawRhs] = assignment.split('=').map(s => s.trim());
        const lhs = resolveAlias(rawLhs, names);
        const value = values?.[rawRhs];
        setNestedValue(item, lhs, value);
    }
    return item;
}

class FakeDocClient {
    async send(command: any): Promise<any> {
        const name = command.constructor.name;
        const input = command.input;
        const table = input.TableName;
        const store = loadTable(table);

        switch (name) {
            case 'GetCommand': {
                const key = itemKey(input.Key);
                return { Item: store[key] };
            }
            case 'PutCommand': {
                const key = itemKey(pickKeyFromItem(input.Item, input.TableName));
                store[key] = input.Item;
                saveTable(table, store);
                return {};
            }
            case 'UpdateCommand': {
                const key = itemKey(input.Key);
                const existing = store[key] || { ...input.Key };
                if (input.ConditionExpression) {
                    const match = /attribute_exists\((\w+)\)/.exec(input.ConditionExpression);
                    if (match && existing[match[1]] === undefined) {
                        const err: any = new Error('ConditionalCheckFailedException');
                        err.name = 'ConditionalCheckFailedException';
                        throw err;
                    }
                }
                applyUpdateExpression(existing, input.UpdateExpression, input.ExpressionAttributeNames, input.ExpressionAttributeValues);
                store[key] = existing;
                saveTable(table, store);
                return {};
            }
            case 'DeleteCommand': {
                const key = itemKey(input.Key);
                delete store[key];
                saveTable(table, store);
                return {};
            }
            case 'QueryCommand': {
                // Only used for phone+eventDay lookups in our codebase
                const items = Object.values(store).filter((item: any) => {
                    return Object.entries(input.ExpressionAttributeValues || {}).every(([token, val]) => {
                        const attr = token.replace(':', '');
                        return item[attr] === val || String(item[attr]) === String(val);
                    });
                });
                return { Items: items };
            }
            case 'ScanCommand': {
                let items = Object.values(store);
                if (input.FilterExpression && input.ExpressionAttributeValues) {
                    items = items.filter((item: any) =>
                        Object.entries(input.ExpressionAttributeValues).every(([token, val]) => {
                            const attr = token.replace(':', '');
                            return item[attr] === val;
                        })
                    );
                }
                return { Items: items, Count: items.length };
            }
            default:
                throw new Error(`FakeDocClient: unsupported command ${name}`);
        }
    }
}

function pickKeyFromItem(item: any, table: string): Record<string, any> {
    // All our tables key on phone, optionally + eventDay
    if (table === 'DerDailyRegistrations') {
        return { phone: item.phone, eventDay: item.eventDay };
    }
    return { phone: item.phone };
}

export const devDocClient = new FakeDocClient();
