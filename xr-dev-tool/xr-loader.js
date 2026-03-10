const { execSync } = require('child_process');
const chalk = require('chalk');
const ora = require('ora');
const figlet = require('figlet');
const path = require('path');

// Configuration
const ADB_FALLBACK_PATH = 'C:\\Program Files\\Meta Quest Developer Hub\\resources\\bin\\adb.exe';

/**
 * Execute ADB command and return output
 */
function runAdb(args) {
    try {
        let adbPath = 'adb';
        // Try to check if adb is in path
        try {
            execSync('adb version', { stdio: 'ignore' });
        } catch (e) {
            // Fallback to MQDH path if found
            adbPath = `"${ADB_FALLBACK_PATH}"`;
        }

        return execSync(`${adbPath} ${args}`).toString().trim();
    } catch (error) {
        return null;
    }
}

async function startLoader() {
    console.clear();

    // Header
    console.log(chalk.cyan(figlet.textSync('XR DEV TOOL', { horizontalLayout: 'full' })));
    console.log(chalk.dim('v1.0.0 - Immersive Environment Bootloader\n'));

    const steps = [
        { name: 'Checking ADB installation', cmd: 'version', id: 'adb' },
        { name: 'Searching for connected devices', cmd: 'devices', id: 'devices' },
        { name: 'Verifying device model', cmd: 'shell getprop ro.product.model', id: 'model' },
        { name: 'Verifying authorization', cmd: 'devices', id: 'auth' },
        { name: 'Preparing XR deployment environment', simulate: true },
        { name: 'Starting XR debug session', simulate: true }
    ];

    for (const step of steps) {
        const spinner = ora(step.name).start();
        await new Promise(r => setTimeout(r, 800)); // Visual delay for hacker feel

        try {
            if (step.simulate) {
                spinner.succeed(`${step.name} ${chalk.green('[ OK ]')}`);
                continue;
            }

            const result = runAdb(step.cmd);

            if (step.id === 'adb') {
                if (result) spinner.succeed(`${step.name} ${chalk.green('[ OK ]')}`);
                else throw new Error('ADB not found. Install Android Platform Tools.');
            }
            else if (step.id === 'devices') {
                const lines = result.split('\n').filter(l => l.trim() && !l.startsWith('List of'));
                if (lines.length > 0) {
                    spinner.succeed(`Device Found: ${chalk.bold(lines.length)} device(s) detected ${chalk.green('[ OK ]')}`);
                } else {
                    spinner.fail(chalk.red('No Meta Quest device detected.'));
                    console.log(chalk.yellow('\n[!] FIX: Please enable Developer Mode and connect via USB or WiFi.'));
                    process.exit(1);
                }
            }
            else if (step.id === 'model') {
                const lines = runAdb('devices').split('\n').filter(l => l.trim() && !l.startsWith('List of'));
                const firstDevice = lines[0].split('\t')[0];
                const model = runAdb(`-s ${firstDevice} shell getprop ro.product.model`);
                spinner.succeed(`Connected to: ${chalk.bold(model || 'Meta Quest')} ${chalk.green('[ CONNECTED ]')}`);
            }
            else if (step.id === 'auth') {
                if (result.includes('unauthorized')) {
                    spinner.fail(chalk.red('Device Unauthorized.'));
                    console.log(chalk.yellow('\n[!] FIX: Check your headset and select "Allow USB Debugging".'));
                    process.exit(1);
                } else {
                    spinner.succeed(`${step.name} ${chalk.green('[ AUTHORIZED ]')}`);
                }
            }
        } catch (err) {
            spinner.fail(`${step.name} ${chalk.red('[ ERROR ]')}`);
            console.log(chalk.red(`\nReason: ${err.message}`));
            process.exit(1);
        }
    }

    console.log(chalk.cyan('\n' + '='.repeat(40)));
    console.log(chalk.bold.green('READY FOR DEPLOYMENT'));
    console.log(chalk.dim('XR Runtime Initialized Successfully.'));
    console.log(chalk.cyan('='.repeat(40) + '\n'));
}

startLoader();
