#!/usr/bin/env node

const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const { generateComponent } = require('../lib/generator');

async function promptForComponentType() {
  const { type } = await inquirer.prompt([
    {
      type: 'list',
      name: 'type',
      message: 'What type of component would you like to create?',
      choices: [
        { name: 'State Component (for real-time values)', value: 'state' },
        { name: 'Deviation Component (for deviation control)', value: 'deviation' },
        { name: 'Statistics Component (watching stats)', value: 'stats' },
        { name: 'Toggle Component (for boolean controls)', value: 'toggle' },
        { name: 'Chart Component (for time-series data)', value: 'chart' },
        { name: 'Dashtable Container (for layout)', value: 'dashtable' }
      ]
    }
  ]);
  return type;
}

async function promptForConfigFile() {
  const { configPath } = await inquirer.prompt([
    {
      type: 'input',
      name: 'configPath',
      message: 'Enter the path to your configuration file:',
      validate: input => {
        if (!input) return 'Config file path is required';
        if (!input.endsWith('.js')) return 'Config file must be a JavaScript file';
        if (!fs.existsSync(path.resolve(input))) {
          return 'Config file does not exist';
        }
        return true;
      }
    }
  ]);
  return configPath;
}

async function main() {
  try {
    console.log(chalk.blue('\n🚀 Welcome to Microlab! Let\'s create a new component.\n'));

    const type = await promptForComponentType();
    const configPath = type === 'dashtable' ? null : await promptForConfigFile();

    console.log(chalk.blue('\nGenerating component...\n'));
    await generateComponent(type, configPath);
    
    console.log(chalk.green('\n✓ Component generated successfully!\n'));
    
    if (type !== 'dashtable') {
      console.log(chalk.yellow('Next steps:'));
      console.log(chalk.yellow('1. Make sure your .env file has the required environment variables:'));
      console.log(chalk.gray('   MQTT_HOST=your_mqtt_broker_host'));
      console.log(chalk.gray('   MQTT_USERNAME=your_mqtt_username'));
      console.log(chalk.gray('   MQTT_PASSWORD=your_mqtt_password'));
      console.log(chalk.gray('   MONGODB_URI=your_mongodb_connection_string'));
    }
    console.log(chalk.yellow('\n2. Import and use your component in your Next.js app:'));
    console.log(chalk.gray(`   import ${type.charAt(0).toUpperCase() + type.slice(1)} from '@/components/microlab/${type.charAt(0).toUpperCase() + type.slice(1)}'`));
    
    const componentName = type !== 'dashtable' ? require(path.resolve(configPath)).componentName : 'Dashtable';
    const apiPath = `src/app/api/microlab/${componentName.toLowerCase()}/route.js`;
    console.log(chalk.gray(`   API endpoint: /api/microlab/${componentName.toLowerCase()}`));
    console.log(chalk.gray(`   File location: ${apiPath}`));
    
  } catch (error) {
    console.error(chalk.red('\nError:'), error.message);
    process.exit(1);
  }
}

main();