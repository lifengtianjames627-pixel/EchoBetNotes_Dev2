import { spawn } from 'node:child_process';

const processes = [
  spawn('npm', ['run', 'dev'], { stdio: 'inherit', shell: true }),
  spawn('npm', ['run', 'dev:server'], { stdio: 'inherit', shell: true }),
];

const stop = () => {
  for (const child of processes) child.kill('SIGTERM');
};

process.on('SIGINT', stop);
process.on('SIGTERM', stop);
processes.forEach((child) => child.on('exit', (code) => {
  if (code) {
    process.exitCode = code;
    stop();
  }
}));
