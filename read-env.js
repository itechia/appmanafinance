const fs = require('fs');
const path = require('path');

try {
    const envPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const lines = content.split('\n');
        console.log('--- KEYS FOUND ---');
        lines.forEach(line => {
            const parts = line.split('=');
            if (parts.length > 0 && parts[0].trim().length > 0) {
                console.log(parts[0].trim());
            }
        });
        console.log('------------------');
    } else {
        console.log('.env.local not found');
    }
} catch (e) {
    console.error(e);
}
