import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const dataFile = path.join(process.cwd(), 'data', 'projects.json');
const fallbackFile = path.join(process.cwd(), 'public', 'assets', 'projects.json');

export async function readProjects() {
  try {
    const raw = await fs.readFile(dataFile, 'utf8');
    const json = JSON.parse(raw);
    return Array.isArray(json) ? json : (json.items || []);
  } catch {
    try {
      const raw = await fs.readFile(fallbackFile, 'utf8');
      const json = JSON.parse(raw);
      return Array.isArray(json) ? json : (json.items || []);
    } catch {
      return [];
    }
  }
}

export async function writeProjects(items) {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  const sorted = [...items].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  await fs.writeFile(dataFile, JSON.stringify(sorted, null, 2));
  return sorted;
}

export function createProject(payload) {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: (payload.title || '').trim(),
    type: (payload.type || 'pdf').trim(),
    description: (payload.description || '').trim(),
    url: (payload.url || '').trim(),
    code: (payload.code || '').trim(),
    createdAt: now,
  };
}

export function normalizeUpdate(payload) {
  const patch = {};
  if (payload.title !== undefined) patch.title = String(payload.title).trim();
  if (payload.type !== undefined) patch.type = String(payload.type).trim();
  if (payload.description !== undefined) patch.description = String(payload.description).trim();
  if (payload.url !== undefined) patch.url = String(payload.url).trim();
  if (payload.code !== undefined) patch.code = String(payload.code).trim();
  return patch;
}
