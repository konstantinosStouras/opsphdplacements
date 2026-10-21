import fs from 'node:fs';
import crypto from 'node:crypto';

// Replace only a complete file; transient Windows locks must not leave partial JSON.
export function writeComplete(file, content) {
  const temporary = file + '.integration-' + crypto.randomUUID() + '.tmp';
  fs.writeFileSync(temporary, content);
  try {
    for (let attempt = 0; ; attempt++) {
      try { fs.renameSync(temporary, file); break; }
      catch (error) {
        if (attempt >= 4 || !['UNKNOWN', 'EBUSY', 'EPERM', 'EACCES'].includes(error.code)) throw error;
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 150);
      }
    }
  } finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
}
