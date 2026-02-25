const { execSync } = require('child_process');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf-8');
const lines = envFile.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));

for (const line of lines) {
    const [key, ...rest] = line.split('=');
    const val = rest.join('=');

    if (key && val) {
        console.log(`Uploading ${key} to Vercel...`);
        try {
            // Remove existing variable (if any) so it doesn't prompt for overwrite
            try {
                execSync(`npx vercel env rm ${key} production -y`, { stdio: 'ignore' });
            } catch (e) {
                // Ignore errors if it didn't exist
            }
            // Add new variable
            execSync(`npx vercel env add ${key} production`, { input: val });
            console.log(`✅ Successfully uploaded ${key}`);
        } catch (e) {
            console.error(`❌ Failed to upload ${key}`, e.message);
        }
    }
}

console.log('Environment variable sync complete. Triggering production build...');
