const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

const REQUIRED_DEPENDENCIES = {
  dependencies: {
    'mqtt': '^5.3.5',
    'mongoose': '^8.1.1',
    'recharts': '^2.12.0'
  },
  devDependencies: {
    'tailwindcss': '^4.0.0',
    'autoprefixer': '^10.4.17',
    'postcss': '^8.4.35'
  }
};

async function installDependencies() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = await fs.readJson(packageJsonPath);

  let needsUpdate = false;
  Object.entries(REQUIRED_DEPENDENCIES).forEach(([depType, deps]) => {
    Object.entries(deps).forEach(([dep, version]) => {
      if (!packageJson[depType]?.[dep]) {
        packageJson[depType] = packageJson[depType] || {};
        packageJson[depType][dep] = version;
        needsUpdate = true;
      }
    });
  });

  if (needsUpdate) {
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
    execSync('npm install', { stdio: 'inherit' });
  }
}

module.exports = { installDependencies }; 